const ZenoPayUser = require("../Models/ZenoPayUser");
const generateQRWithLogo = require("../Services/generateQR");
const Wallet = require("../Models/Wallet");
const Transaction = require("../Models/Transaction");
const Merchant = require("../Models/Merchant");
const bcrypt = require("bcryptjs");
const qrcode = require("qrcode");

const parsePositiveAmount = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.round(parsed * 100) / 100;
};

const isValidZenoPayId = (value) => /^[A-Za-z0-9_-]{3,50}$/.test(String(value || "").trim());

const resolveAppUrl = (req) => {
  return (process.env.APP_URL || `${req.protocol}://${req.get("host")}`).replace(/\/$/, "");
};

const findUserByZenoPayId = async (zenoPayId) => {
  if (!zenoPayId) return null;
  return ZenoPayUser.findOne({
    $or: [
      { ZenoPayID: String(zenoPayId).trim() },
      { userId: String(zenoPayId).trim() },
    ],
  });
};

const resolveLoggedInPayer = async (req) => {
  const sessionUser = req.session?.user;
  if (!sessionUser) return null;

  if (sessionUser._id) {
    const byId = await ZenoPayUser.findById(sessionUser._id);
    if (byId) return byId;
  }

  const sessionZenoPayId = sessionUser.ZenoPayID || sessionUser.ZenoPayId || sessionUser.userId;
  if (!sessionZenoPayId) return null;
  return findUserByZenoPayId(sessionZenoPayId);
};

// GET: QR Payment Page
const getQRPaymentPage = async (req, res) => {
  try {
    const zenoPayId = req.session.user?.ZenoPayID || "ZP-DEMO2024";
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
    const { amount, description, expiryMinutes } = req.body || {};
    const zenoPayId = req.session.user?.ZenoPayID || "ZP-DEMO2024";
    const user = await findUserByZenoPayId(zenoPayId);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const parsedAmount = parsePositiveAmount(amount);
    if (parsedAmount === null) {
      return res.status(400).json({ success: false, message: "Amount must be a positive number" });
    }

    const parsedExpiryMinutes = Number(expiryMinutes);
    if (!Number.isFinite(parsedExpiryMinutes) || parsedExpiryMinutes < 1 || parsedExpiryMinutes > 1440) {
      return res.status(400).json({ success: false, message: "Expiry must be between 1 and 1440 minutes" });
    }

    const normalizedZenoPayId = user.ZenoPayID || user.userId;
    const expiryAt = Date.now() + parsedExpiryMinutes * 60 * 1000;
    const qrPayload = {
      zenoPayId: normalizedZenoPayId,
      amount: parsedAmount,
      description: String(description || "").trim(),
      expiry: expiryAt,
    };
    const qrData = JSON.stringify(qrPayload);
    const qrImage = await qrcode.toDataURL(qrData);

    // Keep existing UI compatibility by returning paymentUrl + qrCode alias.
    const baseUrl = resolveAppUrl(req);
    const params = new URLSearchParams();
    params.append("amount", String(parsedAmount));
    if (qrPayload.description) params.append("description", qrPayload.description);
    params.append("expiry", String(expiryAt));

    const dynamicUrl = `${baseUrl}/pay/${encodeURIComponent(normalizedZenoPayId)}?${params.toString()}`;

    res.json({
      success: true,
      qrImage,
      qrCode: qrImage,
      paymentUrl: dynamicUrl,
      expiresAt: expiryAt,
    });
  } catch (error) {
    console.error("Error generating dynamic QR:", error);
    res.status(500).json({ success: false, message: "Failed to generate QR code" });
  }
};

const getPayPage = async (req, res) => {
  try {
    const rawZenoPayId = String(req.params.zenoPayId || "");
    const isPlaceholder = rawZenoPayId.startsWith(":");
    const looksValid = isValidZenoPayId(rawZenoPayId);

    if (!isPlaceholder && !looksValid) {
      return res.status(400).render("error-404", {
        pageTitle: "Invalid Payment Link - ZenoPay",
        path: req.path,
      });
    }

    const zenoPayId = isPlaceholder ? "ZP-PREVIEW" : rawZenoPayId;
    const recipient = await findUserByZenoPayId(zenoPayId);

    if (!recipient) {
      if (process.env.NODE_ENV !== "production") {
        return res.status(200).render("pay", {
          pageTitle: "Pay with ZenoPay",
          isLoggedIn: !!req.session?.user,
          user: req.session?.user || null,
          recipient: {
            fullName: "Preview Recipient",
            zenoPayId,
          },
          amount: parsePositiveAmount(req.query.amount) || 199,
          description: String(req.query.description || "Preview payment link").trim(),
          expiry: Number(req.query.expiry || 0) || null,
          appUrl: resolveAppUrl(req),
          previewMode: true,
          previewMessage: "Preview mode: this payment ID is placeholder only. Use a real ZenoPay ID for live payments.",
        });
      }

      return res.status(404).render("error-404", {
        pageTitle: "Recipient Not Found - ZenoPay",
        path: req.path,
      });
    }

    const amount = parsePositiveAmount(req.query.amount);

    return res.render("pay", {
      pageTitle: "Pay with ZenoPay",
      isLoggedIn: !!req.session?.user,
      user: req.session?.user || null,
      recipient: {
        fullName: recipient.FullName || recipient.name || "ZenoPay User",
        zenoPayId: recipient.ZenoPayID || recipient.userId,
      },
      amount: amount || null,
      description: String(req.query.description || "").trim(),
      expiry: Number(req.query.expiry || 0) || null,
      appUrl: resolveAppUrl(req),
      previewMode: false,
      previewMessage: null,
    });
  } catch (error) {
    console.error("Error loading pay page:", error);
    return res.status(500).render("error-500", {
      pageTitle: "Server Error - ZenoPay",
      errorId: `ERR-${Date.now().toString(36).toUpperCase()}`,
    });
  }
};

const processPay = async (req, res) => {
  try {
    const { zenoPayId } = req.params;
    if (!isValidZenoPayId(zenoPayId)) {
      return res.status(400).json({ success: false, message: "Invalid recipient ZenoPay ID" });
    }

    const { amount, description, payerZenoPayId, pin, expiry } = req.body || {};

    if (expiry !== undefined && expiry !== null && String(expiry).trim() !== "") {
      const expiryTs = Number(expiry);
      if (!Number.isFinite(expiryTs)) {
        return res.status(400).json({ success: false, message: "Invalid payment expiry timestamp" });
      }

      if (Date.now() > expiryTs) {
        return res.status(410).json({ success: false, message: "This QR payment request has expired" });
      }
    }

    const parsedAmount = parsePositiveAmount(amount);
    if (parsedAmount === null) {
      return res.status(400).json({ success: false, message: "Amount must be a positive number" });
    }

    const recipient = await findUserByZenoPayId(zenoPayId);
    if (!recipient) {
      return res.status(404).json({ success: false, message: "Recipient not found" });
    }

    let payer = await resolveLoggedInPayer(req);
    if (!payer) {
      if (!payerZenoPayId || !pin) {
        return res.status(401).json({
          success: false,
          message: "Login required, or provide payer ZenoPay ID and PIN",
        });
      }

      payer = await findUserByZenoPayId(payerZenoPayId);
      if (!payer) {
        return res.status(404).json({ success: false, message: "Payer not found" });
      }

      if (!payer.transactionPin || !(await bcrypt.compare(String(pin), String(payer.transactionPin)))) {
        return res.status(401).json({ success: false, message: "Invalid payer PIN" });
      }
    }

    const payerZpId = payer.ZenoPayID || payer.userId;
    const recipientZpId = recipient.ZenoPayID || recipient.userId;
    if (String(payer._id) === String(recipient._id) || payerZpId === recipientZpId) {
      return res.status(400).json({ success: false, message: "Self payment is not allowed" });
    }

    const [payerWallet, recipientWallet] = await Promise.all([
      Wallet.findOne({ userId: payer._id }),
      Wallet.findOne({ userId: recipient._id }),
    ]);

    if (!payerWallet || !payerWallet.isActive) {
      return res.status(400).json({ success: false, message: "Payer wallet is not available" });
    }

    if (!recipientWallet || !recipientWallet.isActive) {
      return res.status(400).json({ success: false, message: "Recipient wallet is not available" });
    }

    if (Number(payerWallet.balance || 0) < parsedAmount) {
      return res.status(400).json({ success: false, message: "Insufficient wallet balance" });
    }

    payerWallet.balance = Number((Number(payerWallet.balance) - parsedAmount).toFixed(2));
    recipientWallet.balance = Number((Number(recipientWallet.balance) + parsedAmount).toFixed(2));

    const recipientMerchant = await Merchant.findOne({ ZenoPayId: recipientZpId }).select("_id").lean();

    const baseRef = `QR-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    const narration = String(description || `QR payment to ${recipientZpId}`).trim();

    await Promise.all([
      payerWallet.save(),
      recipientWallet.save(),
      Transaction.create({
        userId: payer._id,
        merchant: recipientMerchant?._id || null,
        type: "send",
        amount: parsedAmount,
        status: "completed",
        reference: `${baseRef}-S`,
        description: narration,
        metadata: {
          channel: "qr",
          counterpartyZenoPayId: recipientZpId,
          counterpartyName: recipient.FullName || recipient.name,
        },
      }),
      Transaction.create({
        userId: recipient._id,
        merchant: recipientMerchant?._id || null,
        type: "receive",
        amount: parsedAmount,
        status: "completed",
        reference: `${baseRef}-R`,
        description: narration,
        metadata: {
          channel: "qr",
          counterpartyZenoPayId: payerZpId,
          counterpartyName: payer.FullName || payer.name,
        },
      }),
    ]);

    return res.json({
      success: true,
      message: "Payment successful",
      data: {
        reference: baseRef,
        payerZenoPayId: payerZpId,
        recipientZenoPayId: recipientZpId,
        amount: parsedAmount,
      },
    });
  } catch (error) {
    console.error("Error processing QR pay:", error);
    return res.status(500).json({ success: false, message: "Failed to process payment" });
  }
};

module.exports = {
  getQRPaymentPage,
  generateDynamicQR,
  getPayPage,
  processPay,
};
