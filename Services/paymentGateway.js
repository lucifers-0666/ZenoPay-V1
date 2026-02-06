/**
 * Payment Gateway Integration Service
 * Supports Razorpay, Stripe, and other payment providers
 */

const axios = require("axios");

class PaymentGatewayService {
  constructor() {
    this.razorpayKey = process.env.RAZORPAY_KEY || "";
    this.razorpaySecret = process.env.RAZORPAY_SECRET || "";
    this.stripeKey = process.env.STRIPE_SECRET_KEY || "";
    this.paypalClientId = process.env.PAYPAL_CLIENT_ID || "";
    this.paypalSecret = process.env.PAYPAL_SECRET || "";
  }

  /**
   * Create a payment order (Razorpay)
   */
  async createRazorpayOrder(amount, currency = "INR", customerId) {
    try {
      const auth = Buffer.from(`${this.razorpayKey}:${this.razorpaySecret}`).toString("base64");

      const response = await axios.post(
        "https://api.razorpay.com/v1/orders",
        {
          amount: amount * 100, // Convert to paise
          currency,
          receipt: customerId,
        },
        {
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/json",
          },
        }
      );

      return {
        success: true,
        orderId: response.data.id,
        amount: response.data.amount,
        currency: response.data.currency,
      };
    } catch (error) {
      console.error("Razorpay order creation error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Verify Razorpay payment
   */
  async verifyRazorpayPayment(orderId, paymentId, signature) {
    try {
      const crypto = require("crypto");

      // Create hash for verification
      const hash = crypto
        .createHmac("sha256", this.razorpaySecret)
        .update(`${orderId}|${paymentId}`)
        .digest("hex");

      if (hash === signature) {
        return {
          success: true,
          message: "Payment verified successfully",
          paymentId,
        };
      }

      return {
        success: false,
        error: "Invalid payment signature",
      };
    } catch (error) {
      console.error("Razorpay verification error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Create a Stripe payment intent
   */
  async createStripePaymentIntent(amount, currency = "inr", customerId) {
    try {
      const stripe = require("stripe")(this.stripeKey);

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount * 100, // Convert to cents
        currency,
        customer: customerId,
        metadata: {
          orderId: customerId,
        },
      });

      return {
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      };
    } catch (error) {
      console.error("Stripe payment intent error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Test gateway connection
   */
  async testConnection(gateway = "razorpay") {
    try {
      if (gateway === "razorpay") {
        const auth = Buffer.from(`${this.razorpayKey}:${this.razorpaySecret}`).toString("base64");

        const response = await axios.get("https://api.razorpay.com/v1/customers", {
          headers: {
            Authorization: `Basic ${auth}`,
          },
          timeout: 5000,
        });

        return {
          success: true,
          message: "Razorpay connection successful",
          gateway: "razorpay",
        };
      }

      if (gateway === "stripe") {
        const stripe = require("stripe")(this.stripeKey);
        await stripe.customers.list({ limit: 1 });

        return {
          success: true,
          message: "Stripe connection successful",
          gateway: "stripe",
        };
      }

      return {
        success: false,
        error: "Unknown gateway",
      };
    } catch (error) {
      console.error(`${gateway} connection error:`, error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get transaction fee
   */
  async getTransactionFee(amount, gateway = "razorpay", method = "card") {
    // Fee structure: 2% for card, 1.5% for netbanking, 1% for wallet
    let percentageFee = 0;
    let fixedFee = 0;

    if (gateway === "razorpay") {
      switch (method) {
        case "card":
          percentageFee = 0.02;
          fixedFee = 0;
          break;
        case "netbanking":
          percentageFee = 0.015;
          fixedFee = 0;
          break;
        case "upi":
          percentageFee = 0.012;
          fixedFee = 0;
          break;
        default:
          percentageFee = 0.02;
      }
    }

    const fee = Math.round(amount * percentageFee + fixedFee);

    return {
      amount,
      percentageFee: percentageFee * 100,
      fixedFee,
      totalFee: fee,
      finalAmount: amount + fee,
    };
  }

  /**
   * Refund payment
   */
  async refundPayment(paymentId, amount, gateway = "razorpay") {
    try {
      if (gateway === "razorpay") {
        const auth = Buffer.from(`${this.razorpayKey}:${this.razorpaySecret}`).toString("base64");

        const response = await axios.post(
          `https://api.razorpay.com/v1/payments/${paymentId}/refund`,
          { amount: amount * 100 },
          {
            headers: {
              Authorization: `Basic ${auth}`,
              "Content-Type": "application/json",
            },
          }
        );

        return {
          success: true,
          refundId: response.data.id,
          amount: response.data.amount,
        };
      }

      return {
        success: false,
        error: "Unsupported gateway",
      };
    } catch (error) {
      console.error("Refund error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

module.exports = new PaymentGatewayService();
