const ZenoPayUser = require("../Models/ZenoPayUser");

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

    // Validation
    if (!cardNumber || !cardholderName || !expiryMonth || !expiryYear || !cvv) {
      return res.status(400).json({ success: false, message: "All card fields are required" });
    }

    // Detect card brand
    const cleanCardNumber = cardNumber.replace(/\s/g, "");
    let brand = "unknown";
    if (/^4/.test(cleanCardNumber)) brand = "visa";
    else if (/^5[1-5]/.test(cleanCardNumber)) brand = "mastercard";
    else if (/^3[47]/.test(cleanCardNumber)) brand = "amex";
    else if (/^6(?:011|5)/.test(cleanCardNumber)) brand = "discover";

    // Luhn algorithm validation
    const isValidCard = validateLuhn(cleanCardNumber);
    if (!isValidCard) {
      return res.status(400).json({ success: false, message: "Invalid card number" });
    }

    // Expiry validation
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    const fullYear = parseInt(`20${expiryYear}`);

    if (fullYear < currentYear || (fullYear === currentYear && parseInt(expiryMonth) < currentMonth)) {
      return res.status(400).json({ success: false, message: "Card has expired" });
    }

    const last4 = cleanCardNumber.slice(-4);

    // TODO: In production, encrypt and store card via payment gateway (Stripe, etc.)
    // For now, just acknowledge
    res.json({
      success: true,
      message: "Card added successfully",
      card: {
        brand,
        last4,
        cardholderName,
        expiryMonth,
        expiryYear,
        isDefault: setAsDefault,
      },
    });
  } catch (error) {
    console.error("Error adding card:", error);
    res.status(500).json({ success: false, message: "Failed to add card" });
  }
};

// Luhn algorithm for card validation
function validateLuhn(cardNumber) {
  let sum = 0;
  let isEven = false;

  for (let i = cardNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cardNumber[i]);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}

module.exports = {
  getAddCardPage,
  addCard,
};
