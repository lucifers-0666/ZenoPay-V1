const axios = require("axios");

class CardTokenizationService {
  constructor() {
    this.stripeSecret = process.env.STRIPE_SECRET_KEY || "";
    this.razorpayKey = process.env.RAZORPAY_KEY || "";
    this.razorpaySecret = process.env.RAZORPAY_SECRET || "";
  }

  getDefaultProvider() {
    return String(process.env.CARD_TOKEN_PROVIDER || "stripe").toLowerCase();
  }

  isTokenizationRequired() {
    const explicit = process.env.CARD_TOKENIZATION_REQUIRED;
    if (typeof explicit === "string") {
      return explicit.toLowerCase() === "true";
    }
    return process.env.NODE_ENV === "production";
  }

  async verifyToken(provider, tokenId) {
    const normalizedProvider = String(provider || this.getDefaultProvider()).toLowerCase();
    const normalizedToken = String(tokenId || "").trim();

    if (!normalizedToken) {
      return { valid: false, provider: normalizedProvider, reason: "Missing token" };
    }

    if (normalizedProvider === "stripe") {
      return this.verifyStripeToken(normalizedToken);
    }

    if (normalizedProvider === "razorpay") {
      return this.verifyRazorpayToken(normalizedToken);
    }

    return { valid: false, provider: normalizedProvider, reason: "Unsupported token provider" };
  }

  async verifyStripeToken(tokenId) {
    if (!this.stripeSecret) {
      return { valid: false, provider: "stripe", reason: "STRIPE_SECRET_KEY not configured" };
    }

    try {
      const stripe = require("stripe")(this.stripeSecret);

      if (tokenId.startsWith("pm_")) {
        const paymentMethod = await stripe.paymentMethods.retrieve(tokenId);
        return {
          valid: !!paymentMethod,
          provider: "stripe",
          normalizedTokenId: paymentMethod?.id || tokenId,
          details: paymentMethod?.card
            ? {
                brand: paymentMethod.card.brand,
                last4: paymentMethod.card.last4,
                exp_month: String(paymentMethod.card.exp_month || "").padStart(2, "0"),
                exp_year: String(paymentMethod.card.exp_year || "").slice(-2),
              }
            : null,
        };
      }

      if (tokenId.startsWith("tok_")) {
        const token = await stripe.tokens.retrieve(tokenId);
        return {
          valid: !!token,
          provider: "stripe",
          normalizedTokenId: token?.id || tokenId,
          details: token?.card
            ? {
                brand: token.card.brand,
                last4: token.card.last4,
                exp_month: String(token.card.exp_month || "").padStart(2, "0"),
                exp_year: String(token.card.exp_year || "").slice(-2),
              }
            : null,
        };
      }

      return { valid: false, provider: "stripe", reason: "Invalid Stripe token format" };
    } catch (error) {
      return { valid: false, provider: "stripe", reason: error.message };
    }
  }

  async verifyRazorpayToken(tokenId) {
    // Razorpay token APIs differ by account features. We validate format first,
    // and perform API verification when credentials are present.
    const looksLikeRazorpayToken = /^token_[A-Za-z0-9]+$/.test(tokenId);
    if (!looksLikeRazorpayToken) {
      return { valid: false, provider: "razorpay", reason: "Invalid Razorpay token format" };
    }

    if (!this.razorpayKey || !this.razorpaySecret) {
      return {
        valid: true,
        provider: "razorpay",
        normalizedTokenId: tokenId,
        details: null,
        warning: "Razorpay credentials not configured; format-only validation applied",
      };
    }

    try {
      const auth = Buffer.from(`${this.razorpayKey}:${this.razorpaySecret}`).toString("base64");
      await axios.get(`https://api.razorpay.com/v1/tokens/${tokenId}`, {
        headers: { Authorization: `Basic ${auth}` },
        timeout: 10000,
      });

      return {
        valid: true,
        provider: "razorpay",
        normalizedTokenId: tokenId,
        details: null,
      };
    } catch (error) {
      return {
        valid: false,
        provider: "razorpay",
        reason: error.response?.data?.error?.description || error.message,
      };
    }
  }
}

module.exports = new CardTokenizationService();
