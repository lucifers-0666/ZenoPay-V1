const ZenoPayUser = require("../Models/ZenoPayUser");

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

// GET: Request Money page
const getRequestMoneyPage = async (req, res) => {
  try {
    const zenoPayId = req.session.user?.ZenoPayID || "ZP-DEMO2024";
    const user = await ZenoPayUser.findOne({ ZenoPayID: zenoPayId });

    if (!user) {
      return res.redirect("/login");
    }

    const templates = [
      { title: "Rent", amount: 1200, note: "Monthly rent" },
      { title: "Utilities", amount: 150, note: "Electricity & water" },
      { title: "Subscription", amount: 25, note: "Team subscription" },
      { title: "Freelance", amount: 500, note: "Design project" },
    ];

    res.render("request-money", {
      pageTitle: "Request Money",
      isLoggedIn: true,
      user,
      accounts: [],
      templates,
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

    const normalizedRecipients = Array.isArray(recipients)
      ? recipients.filter((r) => !!r).map((r) => r.trim()).filter(Boolean)
      : [];

    if (normalizedRecipients.length === 0) {
      return res.status(400).json({ success: false, message: "Add at least one recipient" });
    }

    const requestId = `REQ-${Date.now().toString(36).toUpperCase()}`;
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const requestLink = `${baseUrl}/pay/request/${requestId}`;

    const perPerson = splitCount && splitCount > 0 ? parsedAmount / splitCount : parsedAmount;

    // For now, we acknowledge creation without persisting. Hook in DB/email/SMS providers here.
    return res.json({
      success: true,
      message: saveAsDraft ? "Draft saved" : "Request created",
      request: {
        id: requestId,
        amount: parsedAmount,
        currency,
        description,
        dueDate,
        category,
        recipients: normalizedRecipients,
        sendEmail,
        sendSMS,
        generateLink,
        splitCount,
        perPerson,
        requestLink,
        qrData: requestLink,
      },
    });
  } catch (error) {
    console.error("Error creating request money:", error);
    res.status(500).json({ success: false, message: "Failed to create request" });
  }
};

// GET: Request Money Details page
const getRequestMoneyDetailsPage = async (req, res) => {
  try {
    const zenoPayId = req.session.user?.ZenoPayID || "ZP-DEMO2024";
    const user = await ZenoPayUser.findOne({ ZenoPayID: zenoPayId });

    if (!user) {
      return res.redirect("/login");
    }

    const { requestId } = req.params;
    const statusKey = getSafeStatus(req.query.status)?.key || "pending";
    const status = getSafeStatus(statusKey);

    const now = new Date();
    const createdAt = new Date(now);
    createdAt.setDate(createdAt.getDate() - 8);
    const lastReminderAt = new Date(now);
    lastReminderAt.setDate(lastReminderAt.getDate() - 3);
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + 6);

    const amount = 5000;
    const paymentLink = `${req.protocol}://${req.get("host")}/pay/request/${requestId}`;
    const partialReceived = 2000;
    const partialEnabled = true;
    const expiryDays = getDaysBetween(now, expiresAt);
    const totalWindow = getDaysBetween(createdAt, expiresAt) || 1;
    const elapsed = Math.min(totalWindow, totalWindow - expiryDays);
    const expiryProgress = Math.min(100, Math.max(0, Math.round((elapsed / totalWindow) * 100)));

    const request = {
      id: requestId,
      amount,
      currency: "INR",
      note: "Monthly rent for workspace and utilities",
      requestedFrom: "Priya Mehta",
      requestType: "By Link",
      via: "Payment Link",
      paymentLink,
      createdAt,
      lastReminderAt,
      expiresAt,
      reminders: 2,
      partialEnabled,
      partialReceived,
      partialPayments: [
        { name: "Priya Mehta", amount: 1000, date: "Feb 18, 2026" },
        { name: "Priya Mehta", amount: 1000, date: "Feb 20, 2026" },
      ],
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
      { state: "completed", title: "Request Created", desc: `Payment request sent to ${request.requestedFrom}`, time: "Feb 14, 2026" },
      { state: "completed", title: "Reminder Sent", desc: "First reminder sent via email", time: "Feb 18, 2026" },
      { state: "completed", title: "Link Opened", desc: "Recipient viewed the payment link", time: "Feb 20, 2026" },
      { state: status.key === "paid" ? "completed" : "active", title: "Payment Pending", desc: "Waiting for payment", time: "Today" },
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

module.exports = {
  getRequestMoneyPage,
  createRequestMoney,
  getRequestMoneyDetailsPage,
};