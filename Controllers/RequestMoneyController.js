const ZenoPayUser = require("../Models/ZenoPayUser");
const Wallet = require("../Models/Wallet");
const Transaction = require("../Models/Transaction");
const PaymentRequest = require("../Models/PaymentRequest");
const bcrypt = require("bcryptjs");
const { nanoid } = require("nanoid");
const EmailService = require("../Services/EmailService");

const statusConfig = {
  pending: { key: "pending", text: "Pending", icon: "fa-hourglass-half" },
  paid: { key: "paid", text: "Paid", icon: "fa-circle-check" },
  expired: { key: "expired", text: "Expired", icon: "fa-calendar-xmark" },
  cancelled: { key: "cancelled", text: "Cancelled", icon: "fa-ban" },
};

const getSafeStatus = (statusKey) => statusConfig[statusKey] || statusConfig.pending;

const getDaysBetween = (startDate, endDate) => {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.max(0, Math.ceil((endDate - startDate) / msPerDay));
};

const DEFAULT_EXPIRY_DAYS = 7;

const isGuestPreview = (req) => process.env.NODE_ENV !== "production" && !req.session?.user;

const buildPreviewUser = () => ({
  FullName: "Guest Preview",
  ZenoPayID: "ZP-PREVIEW",
  Email: "preview@zenopay.local",
  _id: null,
});

const buildRequestLink = (req, requestId) => `${req.protocol}://${req.get("host")}/pay/request/${requestId}`;

const coerceDateOrNull = (value) => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const normalizeRecipients = (recipients) => {
  if (!Array.isArray(recipients)) {
    return [];
  }

  return recipients.map((entry) => String(entry || "").trim()).filter(Boolean);
};

const markExpiredIfNeeded = async (requestDoc) => {
  if (!requestDoc) {
    return requestDoc;
  }

  if (requestDoc.status === "pending" && requestDoc.expiresAt && new Date(requestDoc.expiresAt) < new Date()) {
    requestDoc.status = "expired";
    await requestDoc.save();
  }

  return requestDoc;
};

const formatRequestResponse = (req, requestDoc) => {
  const requestLink = buildRequestLink(req, requestDoc.requestId);

  return {
    id: requestDoc.requestId,
    amount: Number(requestDoc.amount),
    currency: requestDoc.currency,
    description: requestDoc.description,
    dueDate: requestDoc.dueDate,
    category: requestDoc.category,
    recipients: requestDoc.recipients || [],
    sendEmail: Boolean(requestDoc.sendEmail),
    sendSMS: Boolean(requestDoc.sendSMS),
    generateLink: Boolean(requestDoc.generateLink),
    splitCount: Number(requestDoc.splitCount || 1),
    perPerson: Number(requestDoc.perPerson || 0),
    status: requestDoc.status,
    requestLink,
    qrData: requestLink,
    expiresAt: requestDoc.expiresAt,
  };
};

// GET: Request Money page
const getRequestMoneyPage = async (req, res) => {
  try {
    const guestPreview = isGuestPreview(req);
    const zenoPayId = req.session?.user?.ZenoPayID || null;
    const user = await ZenoPayUser.findOne({ ZenoPayID: zenoPayId });

    if (!user && !guestPreview) {
      return res.redirect("/login");
    }

    const templates = [
      { title: "Rent", amount: 1200, note: "Monthly rent" },
      { title: "Utilities", amount: 150, note: "Electricity & water" },
      { title: "Subscription", amount: 25, note: "Team subscription" },
      { title: "Freelance", amount: 500, note: "Design project" },
    ];

    const [sentSplitRequests, owedSplitRequests] = await Promise.all([
      user?._id
        ? PaymentRequest.find({ requester: user._id, splitMode: true }).sort({ createdAt: -1 }).limit(6).lean()
        : Promise.resolve([]),
      user?._id
        ? PaymentRequest.find({
          splitMode: true,
          contributions: {
            $elemMatch: {
              userId: user._id,
              status: "pending",
            },
          },
        }).sort({ createdAt: -1 }).limit(6).lean()
        : Promise.resolve([]),
    ]);

    res.render("request-money", {
      pageTitle: "Request Money",
      isLoggedIn: !!user,
      user: user || buildPreviewUser(),
      accounts: [],
      templates,
      sentSplitRequests,
      owedSplitRequests,
    });
  } catch (error) {
    console.error("Error loading request money page:", error);
    return res.status(500).render("error-500", {
      pageTitle: "Server Error - ZenoPay",
      errorId: `ERR-${Date.now().toString(36).toUpperCase()}`,
    });
  }
};

// POST: Create a request (stubbed server-side acknowledgement)
const createRequestMoney = async (req, res) => {
  try {
    const zenoPayId = req.session.user?.ZenoPayID || "ZP-DEMO2024";
    const requester = await ZenoPayUser.findOne({ ZenoPayID: zenoPayId });

    if (!requester) {
      return res.status(401).json({ success: false, message: "Session expired. Please login again." });
    }

    const {
      recipients = [],
      amount,
      currency = "USD",
      description = "",
      dueDate = null,
      category = "",
      sendEmail = false,
      sendSMS = false,
      generateLink = true,
      splitCount = 1,
      saveAsDraft = false,
    } = req.body;

    const parsedAmount = parseFloat(amount);
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ success: false, message: "Enter a valid amount" });
    }

    const normalizedRecipients = normalizeRecipients(recipients);

    if (!saveAsDraft && normalizedRecipients.length === 0) {
      return res.status(400).json({ success: false, message: "Add at least one recipient" });
    }

    const normalizedSplitCount = Number(splitCount) > 0 ? Number(splitCount) : 1;
    const perPerson = parsedAmount / normalizedSplitCount;
    const splitMode = normalizedSplitCount > 1;
    const recipientUsers = splitMode
      ? await ZenoPayUser.find({
        $or: normalizedRecipients.map((entry) => ({
          $or: [{ Email: String(entry).toLowerCase() }, { email: String(entry).toLowerCase() }],
        })),
      }).select("_id Email email FullName").lean()
      : [];

    const contributions = splitMode
      ? recipientUsers
        .filter((u) => String(u._id) !== String(requester._id))
        .map((u) => ({
          userId: u._id,
          amount: Number(perPerson.toFixed(2)),
          status: "pending",
          paidAt: null,
        }))
      : [];

    const parsedDueDate = coerceDateOrNull(dueDate);
    const expiresAt = parsedDueDate || new Date(Date.now() + DEFAULT_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
    const requestId = `REQ-${nanoid(10).toUpperCase()}`;

    const requestDoc = await PaymentRequest.create({
      requestId,
      requester: requester._id,
      requesterZenoPayId: requester.ZenoPayID,
      recipients: normalizedRecipients,
      amount: parsedAmount,
      currency: currency || "INR",
      description,
      dueDate: parsedDueDate,
      category,
      expiresAt,
      splitCount: normalizedSplitCount,
      perPerson,
      splitMode,
      perPersonAmount: Number(perPerson.toFixed(2)),
      contributions,
      totalCollected: 0,
      isFullySettled: false,
      sendEmail: Boolean(sendEmail),
      sendSMS: Boolean(sendSMS),
      generateLink: Boolean(generateLink),
      status: saveAsDraft ? "draft" : "pending",
    });

    if (splitMode && contributions.length > 0) {
      const emailService = new EmailService();
      const contributionUserIds = contributions.map((c) => String(c.userId));
      const contributionUsers = recipientUsers.filter((u) => contributionUserIds.includes(String(u._id)));
      await Promise.allSettled(
        contributionUsers.map((u) => {
          const toEmail = u.Email || u.email;
          if (!toEmail) return Promise.resolve();
          return emailService.sendEmail({
            to: toEmail,
            subject: `Split payment request from ${requester.FullName || requester.name}`,
            html: `<p>${requester.FullName || requester.name} requested a split payment of ₹${Number(perPerson).toFixed(2)}.</p><p>Description: ${description || "Split payment"}</p><p>Pay here: ${buildRequestLink(req, requestId)}</p>`,
            text: `${requester.FullName || requester.name} requested ₹${Number(perPerson).toFixed(2)}. Pay here: ${buildRequestLink(req, requestId)}`,
          });
        })
      );
    }

    return res.json({
      success: true,
      message: saveAsDraft ? "Draft saved" : "Request created",
      request: formatRequestResponse(req, requestDoc),
    });
  } catch (error) {
    console.error("Error creating request money:", error);
    res.status(500).json({ success: false, message: "Failed to create request" });
  }
};

// GET: Request Money Details page
const getRequestMoneyDetailsPage = async (req, res) => {
  try {
    const guestPreview = isGuestPreview(req);
    const zenoPayId = req.session?.user?.ZenoPayID || null;
    const user = await ZenoPayUser.findOne({ ZenoPayID: zenoPayId });
    const { requestId } = req.params;

    if (!user && !guestPreview) {
      return res.redirect("/login");
    }

    const requestDoc = user?._id
      ? await PaymentRequest.findOne({ requestId, requester: user._id })
      : null;

    const looksLikePlaceholder = String(requestId || "").startsWith(":");

    if (!requestDoc && !guestPreview) {
      return res.status(404).render("error-404", {
        pageTitle: "Request Not Found - ZenoPay",
      });
    }

    if (!requestDoc && guestPreview) {
      const now = new Date();
      const expiry = new Date(now.getTime() + DEFAULT_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
      const demoRequestId = looksLikePlaceholder ? "REQ-DEMO-2026" : String(requestId || "REQ-DEMO-2026").toUpperCase();
      const paymentLink = buildRequestLink(req, demoRequestId);

      return res.render("request-money-details", {
        pageTitle: "Money Request Details",
        isLoggedIn: false,
        user: buildPreviewUser(),
        accounts: [],
        request: {
          id: demoRequestId,
          amount: 1500,
          currency: "INR",
          note: "Preview request detail. Create a real request to see live data.",
          requestedFrom: "alex@example.com, priya@example.com",
          requestType: "By Link",
          via: "Payment Link",
          paymentLink,
          createdAt: now,
          lastReminderAt: now,
          expiresAt: expiry,
          reminders: 0,
          partialEnabled: true,
          partialReceived: 0,
          partialPayments: [],
        },
        status: getSafeStatus("pending"),
        meta: {
          requestedFrom: "alex@example.com, priya@example.com",
          requestedOn: now.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "2-digit" }),
          expiresOn: expiry.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "2-digit" }),
          via: "Payment Link",
        },
        detailFields: [
          { label: "Request ID", value: demoRequestId, mono: true },
          { label: "Request Type", value: "By Link" },
          { label: "Payment Link", value: paymentLink, isLink: true },
          { label: "QR Code", value: "Generate QR", isQr: true },
          { label: "Created At", value: now.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "2-digit" }) },
          { label: "Last Reminder Sent", value: now.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "2-digit" }) },
          { label: "Number of Reminders", value: 0 },
          { label: "Partial Payment Allowed", value: "Yes", badge: true },
        ],
        timeline: [
          {
            state: "completed",
            title: "Preview Mode",
            desc: "Create a real request to load live detail data.",
            time: "Now",
          },
        ],
        expiryDays: getDaysBetween(now, expiry),
        expiryProgress: 0,
      });
    }

    await markExpiredIfNeeded(requestDoc);

    const status = getSafeStatus(requestDoc.status);
    const now = new Date();
    const createdAt = requestDoc.createdAt || now;
    const lastReminderAt = requestDoc.updatedAt || createdAt;
    const expiresAt = requestDoc.expiresAt;
    const paymentLink = buildRequestLink(req, requestDoc.requestId);
    const partialReceived = requestDoc.status === "paid" ? Number(requestDoc.amount) : 0;
    const partialEnabled = Number(requestDoc.splitCount || 1) > 1;
    const expiryDays = getDaysBetween(now, expiresAt);
    const totalWindow = getDaysBetween(createdAt, expiresAt) || 1;
    const elapsed = Math.min(totalWindow, totalWindow - expiryDays);
    const expiryProgress = Math.min(100, Math.max(0, Math.round((elapsed / totalWindow) * 100)));

    const request = {
      id: requestDoc.requestId,
      amount: Number(requestDoc.amount),
      currency: requestDoc.currency || "INR",
      note: requestDoc.description || "No description provided",
      requestedFrom: (requestDoc.recipients || []).join(", ") || "Payment Link",
      requestType: "By Link",
      via: "Payment Link",
      paymentLink,
      createdAt,
      lastReminderAt,
      expiresAt,
      reminders: 0,
      partialEnabled,
      partialReceived,
      partialPayments: [],
    };

    const meta = {
      requestedFrom: request.requestedFrom,
      requestedOn: createdAt.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "2-digit" }),
      expiresOn: expiresAt.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "2-digit" }),
      via: request.via,
    };

    const detailFields = [
      { label: "Request ID", value: request.id, mono: true },
      { label: "Request Type", value: request.requestType },
      { label: "Payment Link", value: request.paymentLink, isLink: true },
      { label: "QR Code", value: "Generate QR", isQr: true },
      { label: "Created At", value: meta.requestedOn },
      { label: "Last Reminder Sent", value: lastReminderAt.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "2-digit" }) },
      { label: "Number of Reminders", value: request.reminders },
      { label: "Partial Payment Allowed", value: request.partialEnabled ? "Yes" : "No", badge: true },
    ];

    const timeline = [
      {
        state: "completed",
        title: "Request Created",
        desc: `Payment request created for ${request.requestedFrom}`,
        time: createdAt.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "2-digit" }),
      },
      {
        state: status.key === "paid" ? "completed" : "active",
        title: status.key === "paid" ? "Payment Completed" : "Payment Pending",
        desc: status.key === "paid" ? "The payment request has been paid" : "Waiting for payment",
        time: status.key === "paid" && requestDoc.paidAt
          ? new Date(requestDoc.paidAt).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "2-digit" })
          : "Today",
      },
    ];

    res.render("request-money-details", {
      pageTitle: "Money Request Details",
      isLoggedIn: true,
      user,
      accounts: [],
      request,
      status,
      meta,
      detailFields,
      timeline,
      expiryDays,
      expiryProgress,
    });
  } catch (error) {
    console.error("Error loading request money details page:", error);
    return res.status(500).render("error-500", {
      pageTitle: "Server Error - ZenoPay",
      errorId: `ERR-${Date.now().toString(36).toUpperCase()}`,
    });
  }
};

const getPaymentLinksPage = async (req, res) => {
  try {
    const guestPreview = isGuestPreview(req);
    const zenoPayId = req.session?.user?.ZenoPayID;
    const user = await ZenoPayUser.findOne({ ZenoPayID: zenoPayId });

    if (!user && !guestPreview) {
      return res.redirect("/login");
    }

    const requests = user?._id
      ? await PaymentRequest.find({ requester: user._id })
        .sort({ createdAt: -1 })
        .lean()
      : [];

    const now = new Date();
    const rows = requests.map((row) => {
      const status = row.status === "pending" && row.expiresAt && new Date(row.expiresAt) < now ? "expired" : row.status;
      return {
        id: row.requestId,
        amount: Number(row.amount || 0),
        currency: row.currency || "INR",
        description: row.description || "-",
        status,
        recipients: (row.recipients || []).join(", ") || "Payment Link",
        createdAt: row.createdAt,
        expiresAt: row.expiresAt,
        paymentLink: buildRequestLink(req, row.requestId),
      };
    });

    return res.render("payment-links", {
      pageTitle: "Payment Links",
      isLoggedIn: !!user,
      user: user || buildPreviewUser(),
      links: rows,
    });
  } catch (error) {
    console.error("Error loading payment links page:", error);
    return res.status(500).render("error-500", {
      pageTitle: "Server Error - ZenoPay",
      errorId: `ERR-${Date.now().toString(36).toUpperCase()}`,
    });
  }
};

const cancelPaymentLink = async (req, res) => {
  try {
    const zenoPayId = req.session.user?.ZenoPayID;
    const user = await ZenoPayUser.findOne({ ZenoPayID: zenoPayId });

    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { requestId } = req.params;
    const requestDoc = await PaymentRequest.findOne({ requestId, requester: user._id });

    if (!requestDoc) {
      return res.status(404).json({ success: false, message: "Payment link not found" });
    }

    if (!["pending", "draft"].includes(requestDoc.status)) {
      return res.status(400).json({ success: false, message: "Only pending/draft links can be cancelled" });
    }

    requestDoc.status = "cancelled";
    requestDoc.cancelledAt = new Date();
    await requestDoc.save();

    return res.json({ success: true, message: "Payment link cancelled" });
  } catch (error) {
    console.error("Error cancelling payment link:", error);
    return res.status(500).json({ success: false, message: "Failed to cancel payment link" });
  }
};

const getPayRequestPage = async (req, res) => {
  try {
    const rawRequestId = String(req.params.requestId || "");
    const isPlaceholder = rawRequestId.startsWith(":");
    const requestId = isPlaceholder ? "REQ-DEMO-2026" : rawRequestId;

    const requestDoc = await PaymentRequest.findOne({ requestId }).populate("requester", "name ZenoPayID");

    if (!requestDoc) {
      if (process.env.NODE_ENV !== "production") {
        return res.status(200).render("pay-request", {
          pageTitle: "Payment Link - ZenoPay",
          requestDoc: {
            requestId,
            currency: "INR",
            amount: 1250,
            description: "Preview request payment. Create a real request link for live payments.",
            expiresAt: new Date(Date.now() + DEFAULT_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
          },
          recipient: { name: "Preview Merchant", ZenoPayID: "ZP-PREVIEW" },
          canPay: false,
          failureMessage: "Preview mode: This is a placeholder request link. Use a real request ID after creating request-money data.",
          query: req.query,
          previewMode: true,
        });
      }

      return res.status(404).render("error-404", {
        pageTitle: "Payment Link Not Found - ZenoPay",
      });
    }

    await markExpiredIfNeeded(requestDoc);

    if (requestDoc.status !== "pending") {
      return res.status(400).render("pay-request", {
        pageTitle: "Payment Link - ZenoPay",
        requestDoc,
        recipient: requestDoc.requester,
        canPay: false,
        failureMessage: `This payment link is ${requestDoc.status}.`,
        query: req.query,
      });
    }

    return res.render("pay-request", {
      pageTitle: "Payment Link - ZenoPay",
      requestDoc,
      recipient: requestDoc.requester,
      canPay: true,
      failureMessage: null,
      query: req.query,
      previewMode: false,
    });
  } catch (error) {
    console.error("Error loading pay request page:", error);
    return res.status(500).render("error-500", {
      pageTitle: "Server Error - ZenoPay",
      errorId: `ERR-${Date.now().toString(36).toUpperCase()}`,
    });
  }
};

const processPayRequest = async (req, res) => {
  try {
    const requestDoc = await PaymentRequest.findOne({ requestId: req.params.requestId }).populate("requester", "_id name ZenoPayID");

    if (!requestDoc) {
      return res.status(404).json({ success: false, message: "Payment request not found" });
    }

    await markExpiredIfNeeded(requestDoc);

    if (requestDoc.status !== "pending") {
      return res.status(400).json({ success: false, message: `Payment request is ${requestDoc.status}` });
    }

    if (requestDoc.splitMode) {
      return res.status(400).json({
        success: false,
        message: "This is a split request. Please use contribution payment route.",
      });
    }

    let payer = null;

    if (req.session?.user?._id || req.session?.user?.id) {
      payer = await ZenoPayUser.findById(req.session.user._id || req.session.user.id);
    } else {
      const payerZenoPayId = String(req.body.payerZenoPayId || "").trim();
      const payerPin = String(req.body.payerPin || "").trim();

      if (!payerZenoPayId || !payerPin) {
        return res.status(400).json({ success: false, message: "Payer ZenoPay ID and PIN are required" });
      }

      payer = await ZenoPayUser.findOne({ ZenoPayID: payerZenoPayId });
      if (!payer || !payer.transactionPin) {
        return res.status(400).json({ success: false, message: "Invalid payer credentials" });
      }

      const validPin = await bcrypt.compare(payerPin, payer.transactionPin);
      if (!validPin) {
        return res.status(401).json({ success: false, message: "Invalid PIN" });
      }
    }

    if (!payer || String(payer._id) === String(requestDoc.requester._id)) {
      return res.status(400).json({ success: false, message: "Invalid payer account" });
    }

    const [payerWallet, receiverWallet] = await Promise.all([
      Wallet.findOne({ userId: payer._id }),
      Wallet.findOne({ userId: requestDoc.requester._id }),
    ]);

    if (!payerWallet || !receiverWallet) {
      return res.status(404).json({ success: false, message: "Wallet not found" });
    }

    const amount = Number(requestDoc.amount);
    if (payerWallet.balance < amount) {
      return res.status(400).json({ success: false, message: "Insufficient balance" });
    }

    payerWallet.balance -= amount;
    receiverWallet.balance += amount;

    const reference = `RQPAY-${Date.now()}-${nanoid(6).toUpperCase()}`;

    await Promise.all([
      payerWallet.save(),
      receiverWallet.save(),
      Transaction.create({
        userId: payer._id,
        type: "send",
        amount,
        status: "completed",
        reference: `${reference}-D`,
        description: `Paid request ${requestDoc.requestId}`,
        metadata: {
          requestId: requestDoc.requestId,
          receiverZenoPayId: requestDoc.requester.ZenoPayID,
        },
      }),
      Transaction.create({
        userId: requestDoc.requester._id,
        type: "receive",
        amount,
        status: "completed",
        reference: `${reference}-C`,
        description: `Received payment for request ${requestDoc.requestId}`,
        metadata: {
          requestId: requestDoc.requestId,
          payerZenoPayId: payer.ZenoPayID,
        },
      }),
    ]);

    requestDoc.status = "paid";
    requestDoc.paidBy = payer._id;
    requestDoc.paidAt = new Date();
    requestDoc.transactionRef = reference;
    await requestDoc.save();

    return res.json({
      success: true,
      message: "Payment completed successfully",
      requestId: requestDoc.requestId,
      reference,
    });
  } catch (error) {
    console.error("Error processing pay request:", error);
    return res.status(500).json({ success: false, message: "Failed to process payment" });
  }
};

const contributeToSplitRequest = async (req, res) => {
  try {
    const requestDoc = await PaymentRequest.findOne({ requestId: req.params.requestId }).populate("requester", "_id name ZenoPayID");

    if (!requestDoc) {
      return res.status(404).json({ success: false, message: "Payment request not found" });
    }

    if (!requestDoc.splitMode) {
      return res.status(400).json({ success: false, message: "This request is not a split request" });
    }

    if (requestDoc.status !== "pending") {
      return res.status(400).json({ success: false, message: `Payment request is ${requestDoc.status}` });
    }

    const payerId = req.session?.user?._id || req.session?.user?.id;
    if (!payerId) {
      return res.status(401).json({ success: false, message: "Please login to contribute" });
    }

    const contribution = (requestDoc.contributions || []).find((item) => String(item.userId) === String(payerId));
    if (!contribution) {
      return res.status(403).json({ success: false, message: "You are not part of this split request" });
    }

    if (contribution.status === "paid") {
      return res.status(400).json({ success: false, message: "Your contribution is already paid" });
    }

    const payer = await ZenoPayUser.findById(payerId);
    if (!payer) {
      return res.status(404).json({ success: false, message: "Payer account not found" });
    }

    const [payerWallet, receiverWallet] = await Promise.all([
      Wallet.findOne({ userId: payer._id }),
      Wallet.findOne({ userId: requestDoc.requester._id }),
    ]);

    if (!payerWallet || !receiverWallet) {
      return res.status(404).json({ success: false, message: "Wallet not found" });
    }

    const payableAmount = Number(requestDoc.perPersonAmount || contribution.amount || 0);
    if (Number(payerWallet.balance || 0) < payableAmount) {
      return res.status(400).json({ success: false, message: "Insufficient balance" });
    }

    payerWallet.balance = Number(payerWallet.balance || 0) - payableAmount;
    receiverWallet.balance = Number(receiverWallet.balance || 0) + payableAmount;

    const reference = `SPLIT-${Date.now()}-${nanoid(6).toUpperCase()}`;

    await Promise.all([
      payerWallet.save(),
      receiverWallet.save(),
      Transaction.create({
        userId: payer._id,
        type: "send",
        amount: payableAmount,
        status: "completed",
        reference: `${reference}-D`,
        description: `Split contribution for ${requestDoc.requestId}`,
        metadata: {
          requestId: requestDoc.requestId,
          split: true,
        },
      }),
      Transaction.create({
        userId: requestDoc.requester._id,
        type: "receive",
        amount: payableAmount,
        status: "completed",
        reference: `${reference}-C`,
        description: `Split contribution received for ${requestDoc.requestId}`,
        metadata: {
          requestId: requestDoc.requestId,
          split: true,
        },
      }),
    ]);

    contribution.status = "paid";
    contribution.paidAt = new Date();
    requestDoc.totalCollected = Number(requestDoc.totalCollected || 0) + payableAmount;

    const pending = (requestDoc.contributions || []).filter((c) => c.status !== "paid");
    if (pending.length === 0) {
      requestDoc.isFullySettled = true;
      requestDoc.status = "paid";
      requestDoc.paidAt = new Date();
      requestDoc.transactionRef = reference;
    }

    await requestDoc.save();

    return res.json({
      success: true,
      message: "Contribution paid successfully",
      requestId: requestDoc.requestId,
      paidAmount: payableAmount,
      totalCollected: Number(requestDoc.totalCollected || 0),
      totalAmount: Number(requestDoc.amount || 0),
      isFullySettled: Boolean(requestDoc.isFullySettled),
      contributorsPaid: (requestDoc.contributions || []).filter((c) => c.status === "paid").length,
      contributorsTotal: (requestDoc.contributions || []).length,
    });
  } catch (error) {
    console.error("Error processing split contribution:", error);
    return res.status(500).json({ success: false, message: "Failed to process contribution" });
  }
};

const getSplitRequestsPage = async (req, res) => {
  try {
    const guestPreview = isGuestPreview(req);
    const userId = req.session?.user?._id || null;
    if (!userId && !guestPreview) {
      return res.redirect("/login");
    }

    const [sentRequests, owedRequests] = await Promise.all([
      userId
        ? PaymentRequest.find({ requester: userId, splitMode: true }).sort({ createdAt: -1 }).lean()
        : Promise.resolve([]),
      userId
        ? PaymentRequest.find({
          splitMode: true,
          contributions: {
            $elemMatch: {
              userId,
              status: "pending",
            },
          },
        }).sort({ createdAt: -1 }).lean()
        : Promise.resolve([]),
    ]);

    return res.render("split-requests", {
      pageTitle: "Split Requests - ZenoPay",
      isLoggedIn: !!userId,
      user: req.session.user || buildPreviewUser(),
      sentRequests,
      owedRequests,
    });
  } catch (error) {
    console.error("Error loading split requests page:", error);
    return res.status(500).render("error-500", {
      pageTitle: "Server Error - ZenoPay",
      errorId: `ERR-${Date.now().toString(36).toUpperCase()}`,
    });
  }
};

module.exports = {
  getRequestMoneyPage,
  createRequestMoney,
  getRequestMoneyDetailsPage,
  getPaymentLinksPage,
  cancelPaymentLink,
  getPayRequestPage,
  processPayRequest,
  contributeToSplitRequest,
  getSplitRequestsPage,
};