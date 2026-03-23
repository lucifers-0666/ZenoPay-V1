const ScheduledPayment = require("../Models/ScheduledPayment");
const AuditLog = require("../Models/AuditLog");

const DEFAULT_INTERVAL_MS = Number.parseInt(process.env.SCHEDULED_PAYMENTS_RUNNER_MS || "60000", 10);
const MAX_PER_TICK = Number.parseInt(process.env.SCHEDULED_PAYMENTS_RUNNER_BATCH || "50", 10);

let timer = null;
let isRunning = false;

const calculateNextDueDate = (fromDate, frequency) => {
  const base = new Date(fromDate || Date.now());
  const next = new Date(base);

  switch (String(frequency || "Monthly").toLowerCase()) {
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

  const nextDueCandidate = calculateNextDueDate(now, scheduledPayment.frequency);

  scheduledPayment.runCount = Number(scheduledPayment.runCount || 0) + 1;
  scheduledPayment.lastRunAt = now;
  scheduledPayment.totalExecutedAmount = Number(scheduledPayment.totalExecutedAmount || 0) + Number(scheduledPayment.amount || 0);
  scheduledPayment.lastExecutionRef = executionRef;

  scheduledPayment.executionHistory = Array.isArray(scheduledPayment.executionHistory)
    ? scheduledPayment.executionHistory
    : [];

  scheduledPayment.executionHistory.push({
    executedAt: now,
    amount: Number(scheduledPayment.amount || 0),
    status: "success",
    reference: executionRef,
    note: "Automatic scheduler execution",
  });

  if (scheduledPayment.executionHistory.length > 25) {
    scheduledPayment.executionHistory = scheduledPayment.executionHistory.slice(-25);
  }

  if (!nextDueCandidate || String(scheduledPayment.frequency).toLowerCase() === "one-time") {
    scheduledPayment.status = "completed";
    scheduledPayment.nextDue = null;
  } else if (!scheduledPayment.untilCancelled && scheduledPayment.endDate && nextDueCandidate > new Date(scheduledPayment.endDate)) {
    scheduledPayment.status = "completed";
    scheduledPayment.nextDue = null;
  } else {
    scheduledPayment.status = "active";
    scheduledPayment.nextDue = nextDueCandidate;
  }

  await scheduledPayment.save();

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
      amount: Number(scheduledPayment.amount || 0),
      method: scheduledPayment.method,
      runCount: scheduledPayment.runCount,
      nextDue: scheduledPayment.nextDue,
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
      nextDue: { $ne: null, $lte: now },
    })
      .sort({ nextDue: 1 })
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
