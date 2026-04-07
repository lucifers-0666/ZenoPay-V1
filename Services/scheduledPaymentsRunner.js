const ScheduledPayment = require("../Models/ScheduledPayment");
const AuditLog = require("../Models/AuditLog");
const Transaction = require("../Models/Transaction");
const Wallet = require("../Models/Wallet");
const ZenoPayUser = require("../Models/ZenoPayUser");
const emailService = require("./EmailService");

const DEFAULT_INTERVAL_MS = Number.parseInt(process.env.SCHEDULED_PAYMENTS_RUNNER_MS || "60000", 10);
const MAX_PER_TICK = Number.parseInt(process.env.SCHEDULED_PAYMENTS_RUNNER_BATCH || "50", 10);

let timer = null;
let isRunning = false;

const calculateNextDueDate = (fromDate, frequency) => {
  const base = new Date(fromDate || Date.now());
  const next = new Date(base);

  switch (String(frequency || "Monthly").toLowerCase()) {
    case "once":
    case "one-time":
      return null;
    case "daily":
      next.setDate(next.getDate() + 1);
      return next;
    case "weekly":
      next.setDate(next.getDate() + 7);
      return next;
    case "custom":
      next.setDate(next.getDate() + 30);
      return next;
    case "monthly":
    default:
      next.setMonth(next.getMonth() + 1);
      return next;
  }
};

const processSinglePayment = async (scheduledPayment) => {
  const now = new Date();
  const executionRef = `SP-AUTO-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const amount = Number(scheduledPayment.amount || 0);

  const senderUser = await ZenoPayUser.findOne({ ZenoPayID: scheduledPayment.ZenoPayId });
  if (!senderUser) {
    throw new Error("Sender user not found");
  }

  const recipientToken = String(scheduledPayment.recipient || "").trim();
  const recipientUser = await ZenoPayUser.findOne({
    $or: [
      { ZenoPayID: recipientToken },
      { Email: recipientToken.toLowerCase() },
      { email: recipientToken.toLowerCase() },
      { Mobile: recipientToken },
    ],
  });

  if (!recipientUser) {
    throw new Error("Recipient user not found");
  }

  const [senderWallet, recipientWallet] = await Promise.all([
    Wallet.findOne({ userId: senderUser._id }),
    Wallet.findOne({ userId: recipientUser._id }),
  ]);

  if (!senderWallet || !recipientWallet) {
    throw new Error("Sender/recipient wallet not found");
  }

  if (Number(senderWallet.balance || 0) < amount) {
    scheduledPayment.status = "failed";
    scheduledPayment.failureMessage = `Insufficient balance for ${executionRef}`;
    scheduledPayment.lastRunAt = now;
    scheduledPayment.executionHistory = Array.isArray(scheduledPayment.executionHistory)
      ? scheduledPayment.executionHistory
      : [];

    scheduledPayment.executionHistory.push({
      executedAt: now,
      amount,
      status: "failed",
      reference: executionRef,
      note: "Insufficient balance",
    });

    if (scheduledPayment.executionHistory.length > 25) {
      scheduledPayment.executionHistory = scheduledPayment.executionHistory.slice(-25);
    }

    await scheduledPayment.save();
    throw new Error("Insufficient wallet balance");
  }

  senderWallet.balance = Number(senderWallet.balance || 0) - amount;
  recipientWallet.balance = Number(recipientWallet.balance || 0) + amount;

  await Promise.all([
    senderWallet.save(),
    recipientWallet.save(),
    Transaction.create({
      userId: senderUser._id,
      type: "send",
      amount,
      status: "completed",
      reference: `${executionRef}-D`,
      description: scheduledPayment.description || "Scheduled payment execution",
      metadata: {
        scheduledPaymentId: String(scheduledPayment._id),
        receiverZenoPayId: recipientUser.ZenoPayID,
        executionRef,
      },
    }),
    Transaction.create({
      userId: recipientUser._id,
      type: "receive",
      amount,
      status: "completed",
      reference: `${executionRef}-C`,
      description: `Received scheduled payment from ${senderUser.FullName || senderUser.name || senderUser.ZenoPayID}`,
      metadata: {
        scheduledPaymentId: String(scheduledPayment._id),
        senderZenoPayId: senderUser.ZenoPayID,
        executionRef,
      },
    }),
  ]);

  const nextDueCandidate = calculateNextDueDate(now, scheduledPayment.frequency);

  scheduledPayment.runCount = Number(scheduledPayment.runCount || 0) + 1;
  scheduledPayment.lastRunAt = now;
  scheduledPayment.totalExecutedAmount = Number(scheduledPayment.totalExecutedAmount || 0) + amount;
  scheduledPayment.lastExecutionRef = executionRef;
  scheduledPayment.failureMessage = "";

  scheduledPayment.executionHistory = Array.isArray(scheduledPayment.executionHistory)
    ? scheduledPayment.executionHistory
    : [];

  scheduledPayment.executionHistory.push({
    executedAt: now,
    amount,
    status: "success",
    reference: executionRef,
    note: "Automatic scheduler execution",
  });

  if (scheduledPayment.executionHistory.length > 25) {
    scheduledPayment.executionHistory = scheduledPayment.executionHistory.slice(-25);
  }

  if (!nextDueCandidate || ["one-time", "once"].includes(String(scheduledPayment.frequency).toLowerCase())) {
    scheduledPayment.status = "completed";
    scheduledPayment.nextDue = null;
    scheduledPayment.nextRunDate = null;
  } else if (!scheduledPayment.untilCancelled && scheduledPayment.endDate && nextDueCandidate > new Date(scheduledPayment.endDate)) {
    scheduledPayment.status = "completed";
    scheduledPayment.nextDue = null;
    scheduledPayment.nextRunDate = null;
  } else {
    scheduledPayment.status = "active";
    scheduledPayment.nextDue = nextDueCandidate;
    scheduledPayment.nextRunDate = nextDueCandidate;
  }

  await scheduledPayment.save();

  if (senderUser.Email) {
    await emailService.sendEmail({
      to: senderUser.Email,
      subject: "Scheduled payment executed - ZenoPay",
      html: `<p>Your scheduled payment of ₹${amount.toFixed(2)} to ${recipientUser.FullName || recipientUser.name || recipientUser.Email} was executed successfully.</p><p>Reference: ${executionRef}</p>`,
      text: `Scheduled payment executed: ₹${amount.toFixed(2)} to ${recipientUser.FullName || recipientUser.name || recipientUser.Email}. Reference: ${executionRef}`,
    });
  }

  console.log(`Scheduled payment executed: ₹${amount} to ${scheduledPayment.recipient}`);

  await AuditLog.create({
    action: "scheduled_payment_executed_auto",
    category: "transaction",
    description: `Scheduled payment auto-executed for ${scheduledPayment.recipient}`,
    targetId: String(scheduledPayment._id),
    targetType: "ScheduledPayment",
    status: "success",
    metadata: {
      zenoPayId: scheduledPayment.ZenoPayId,
      executionRef,
      amount,
      method: scheduledPayment.method,
      runCount: scheduledPayment.runCount,
      nextDue: scheduledPayment.nextRunDate || scheduledPayment.nextDue,
    },
  });

  return executionRef;
};

const processDueScheduledPayments = async () => {
  if (isRunning) {
    return;
  }

  isRunning = true;
  try {
    const now = new Date();
    const duePayments = await ScheduledPayment.find({
      status: "active",
      $or: [
        { nextRunDate: { $ne: null, $lte: now } },
        { nextDue: { $ne: null, $lte: now } },
      ],
    })
      .sort({ nextRunDate: 1, nextDue: 1 })
      .limit(MAX_PER_TICK);

    if (!duePayments.length) {
      return;
    }

    for (const scheduledPayment of duePayments) {
      try {
        await processSinglePayment(scheduledPayment);
      } catch (error) {
        console.error("[ScheduledRunner] Failed to execute payment", scheduledPayment._id, error.message);
          try {
            if (scheduledPayment.status !== "failed") {
              scheduledPayment.status = "failed";
              scheduledPayment.failureMessage = error.message;
              await scheduledPayment.save();
            }
          } catch (persistErr) {
            console.error("[ScheduledRunner] Failed to persist payment failure", persistErr.message);
          }
        try {
          await AuditLog.create({
            action: "scheduled_payment_execution_failed_auto",
            category: "transaction",
            description: `Scheduled payment auto-execution failed for ${scheduledPayment.recipient}`,
            targetId: String(scheduledPayment._id),
            targetType: "ScheduledPayment",
            status: "failed",
            metadata: {
              zenoPayId: scheduledPayment.ZenoPayId,
              amount: Number(scheduledPayment.amount || 0),
              error: error.message,
            },
          });
        } catch (auditErr) {
          console.error("[ScheduledRunner] Failed to write audit log", auditErr.message);
        }
      }
    }
  } finally {
    isRunning = false;
  }
};

const startScheduledPaymentsRunner = () => {
  if (timer) {
    return;
  }

  timer = setInterval(() => {
    processDueScheduledPayments().catch((error) => {
      console.error("[ScheduledRunner] Tick failed:", error.message);
    });
  }, DEFAULT_INTERVAL_MS);

  if (typeof timer.unref === "function") {
    timer.unref();
  }

  processDueScheduledPayments().catch((error) => {
    console.error("[ScheduledRunner] Initial run failed:", error.message);
  });

  console.log(`[ScheduledRunner] Started (interval ${DEFAULT_INTERVAL_MS}ms)`);
};

const stopScheduledPaymentsRunner = () => {
  if (!timer) {
    return;
  }

  clearInterval(timer);
  timer = null;
  console.log("[ScheduledRunner] Stopped");
};

module.exports = {
  startScheduledPaymentsRunner,
  stopScheduledPaymentsRunner,
  processDueScheduledPayments,
};
