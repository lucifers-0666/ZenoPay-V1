const ZenoPayUser = require("../Models/ZenoPayUser");

// GET: Request Money page
const getRequestMoneyPage = async (req, res) => {
  try {
    // TEMPORARY: Bypass auth for design review
    if (!req.session.isLoggedIn || !req.session.user) {
      req.session.isLoggedIn = true;
      req.session.user = { ZenoPayID: "ZP-DEMO2024" };
    }

    const zenoPayId = req.session.user.ZenoPayID;
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
      templates,
    });
  } catch (error) {
    console.error("Error loading request money page:", error);
    res.status(500).send("Unable to load Request Money page");
  }
};

// POST: Create a request (stubbed server-side acknowledgement)
const createRequestMoney = async (req, res) => {
  try {
    if (!req.session.isLoggedIn || !req.session.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
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

module.exports = {
  getRequestMoneyPage,
  createRequestMoney,
};