const ZenoPayUser = require("../Models/ZenoPayUser");
const generateQRWithLogo = require("../Services/generateQR");

// GET: QR Payment Page
const getQRPaymentPage = async (req, res) => {
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

    // Generate static QR code for user's payment URL
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const paymentUrl = `${baseUrl}/pay/${zenoPayId}`;
    const staticQR = await generateQRWithLogo(paymentUrl);

    res.render("qr-payment", {
      pageTitle: "Receive Payment",
      isLoggedIn: true,
      user,
      zenoPayId,
      paymentUrl,
      staticQR,
    });
  } catch (error) {
    console.error("Error loading QR payment page:", error);
    res.status(500).send("Unable to load QR Payment page");
  }
};

// POST: Generate Dynamic QR Code
const generateDynamicQR = async (req, res) => {
  try {
    if (!req.session.isLoggedIn || !req.session.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { amount = null, description = "", expiryMinutes = 30 } = req.body;
    const zenoPayId = req.session.user.ZenoPayID;

    // Build dynamic payment URL with query params
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const params = new URLSearchParams();
    if (amount) params.append("amount", amount);
    if (description) params.append("note", description);
    if (expiryMinutes) {
      const expiryTime = Date.now() + expiryMinutes * 60 * 1000;
      params.append("expires", expiryTime);
    }

    const dynamicUrl = `${baseUrl}/pay/${zenoPayId}?${params.toString()}`;
    const qrDataUrl = await generateQRWithLogo(dynamicUrl);

    res.json({
      success: true,
      qrCode: qrDataUrl,
      paymentUrl: dynamicUrl,
      expiresAt: expiryMinutes ? Date.now() + expiryMinutes * 60 * 1000 : null,
    });
  } catch (error) {
    console.error("Error generating dynamic QR:", error);
    res.status(500).json({ success: false, message: "Failed to generate QR code" });
  }
};

module.exports = {
  getQRPaymentPage,
  generateDynamicQR,
};
