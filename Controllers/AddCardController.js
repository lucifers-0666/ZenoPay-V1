const ZenoPayUser = require("../Models/ZenoPayUser");
const CardToken = require("../Models/CardToken");
const tokenizationService = require("../Services/cardTokenizationService");

// GET: Add Card Page
const getAddCardPage = async (req, res) => {
  try {
    const zenoPayId = req.session.user?.ZenoPayID || "ZP-DEMO2024";
    const user = await ZenoPayUser.findOne({ ZenoPayID: zenoPayId });

    if (!user) {
      return res.redirect("/login");
    }

    res.render("add-card", {
      pageTitle: "Add New Card",
      isLoggedIn: true,
      user,
      cardTokenization: {
        provider: tokenizationService.getDefaultProvider(),
        required: tokenizationService.isTokenizationRequired(),
      },
    });
  } catch (error) {
    console.error("Error loading add card page:", error);
    res.status(500).send("Unable to load Add Card page");
  }
};

// POST: Add New Card
const addCard = async (req, res) => {
  try {
    const zenoPayId = req.session.user?.ZenoPayID || "ZP-DEMO2024";
    const {
      tokenId,
      provider,
      brand,
      last4,
      cardholderName,
      expiryMonth,
      expiryYear,
      setAsDefault,
    } = req.body || {};

    if (!tokenId || !provider || !last4) {
      return res.status(400).json({
        success: false,
        message: "Tokenized card details are required (provider, tokenId, last4)",
      });
    }

    const tokenCheck = await tokenizationService.verifyToken(provider, tokenId);
    if (!tokenCheck.valid) {
      return res.status(400).json({
        success: false,
        message: `Card token verification failed: ${tokenCheck.reason || "Invalid token"}`,
      });
    }

    const normalizedProvider = String(provider).toLowerCase();
    const normalizedLast4 = String(last4).replace(/\D/g, "").slice(-4);
    if (normalizedLast4.length !== 4) {
      return res.status(400).json({ success: false, message: "Invalid last4 value" });
    }

    if (setAsDefault) {
      await CardToken.updateMany({ ZenoPayId: zenoPayId }, { $set: { isDefault: false } });
    }

    const cardDoc = await CardToken.findOneAndUpdate(
      {
        provider: normalizedProvider,
        tokenId: tokenCheck.normalizedTokenId || tokenId,
      },
      {
        $set: {
          ZenoPayId: zenoPayId,
          provider: normalizedProvider,
          tokenId: tokenCheck.normalizedTokenId || tokenId,
          brand: tokenCheck.details?.brand || brand || "unknown",
          last4: tokenCheck.details?.last4 || normalizedLast4,
          cardholderName: String(cardholderName || "").trim(),
          expiryMonth: tokenCheck.details?.exp_month || String(expiryMonth || "").padStart(2, "0"),
          expiryYear: tokenCheck.details?.exp_year || String(expiryYear || ""),
          isDefault: !!setAsDefault,
          status: "active",
          metadata: {
            tokenVerificationWarning: tokenCheck.warning || null,
          },
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({
      success: true,
      message: "Card added successfully",
      card: {
        id: String(cardDoc._id),
        provider: cardDoc.provider,
        brand: cardDoc.brand,
        last4: cardDoc.last4,
        cardholderName: cardDoc.cardholderName,
        expiryMonth: cardDoc.expiryMonth,
        expiryYear: cardDoc.expiryYear,
        isDefault: cardDoc.isDefault,
      },
    });
  } catch (error) {
    console.error("Error adding card:", error);
    res.status(500).json({ success: false, message: "Failed to add card" });
  }
};

module.exports = {
  getAddCardPage,
  addCard,
};
