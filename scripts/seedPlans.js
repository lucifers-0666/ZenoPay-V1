const mongoose = require("mongoose");
require("dotenv").config();

const Plan = require("../Models/Plan");
const PricingSettings = require("../Models/PricingSettings");

const DB_PATH = process.env.MONGO_URI;

const defaultPlans = [
  {
    slug: "starter",
    name: "Starter",
    tagline: "For Individuals & Freelancers",
    description: "Start quickly with essential payment capabilities.",
    status: "active",
    monthlyPrice: 299,
    annualPrice: 2999,
    discount: 16.4,
    monthlyTxLimit: 200,
    dailyTransferLimit: 50000,
    apiCallsPerDay: 0,
    transactionFeeText: "From 2.5% + ₹3 per transaction",
    volumeLimitText: "Up to ₹5 lakhs/month",
    features: ["200 transactions per month", "Payment links & QR codes", "Basic analytics dashboard", "Email support (48-hour response)", "Standard payout (T+3 days)"],
    showOnPricingPage: true,
    highlightPopular: false,
    bestValue: false,
    sortOrder: 1,
    subscribers: 218,
  },
  {
    slug: "professional",
    name: "Professional",
    tagline: "For Small Businesses",
    description: "For growing teams that need APIs and deeper insights.",
    status: "active",
    monthlyPrice: 999,
    annualPrice: 9999,
    discount: 16.6,
    monthlyTxLimit: 1000,
    dailyTransferLimit: 200000,
    apiCallsPerDay: 1000,
    transactionFeeText: "From 2.0% + ₹2 per transaction",
    volumeLimitText: "Up to ₹25 lakhs/month",
    features: ["1,000 transactions per month", "API access (REST & Webhooks)", "Custom payment page branding", "Advanced analytics & reports", "Priority email (24-hour response)"],
    showOnPricingPage: true,
    highlightPopular: true,
    bestValue: false,
    sortOrder: 2,
    subscribers: 542,
  },
  {
    slug: "business",
    name: "Business",
    tagline: "For Established Companies",
    description: "High-volume plan with premium support and speed.",
    status: "beta",
    monthlyPrice: 2999,
    annualPrice: 29999,
    discount: 16.7,
    monthlyTxLimit: 0,
    dailyTransferLimit: 1000000,
    apiCallsPerDay: 10000,
    transactionFeeText: "From 1.75% + ₹2 per transaction",
    volumeLimitText: "Up to ₹1 crore/month",
    features: ["Unlimited transactions", "Dedicated account manager", "Same-day payouts (T+1)", "Advanced fraud prevention", "Custom reporting & analytics"],
    showOnPricingPage: true,
    highlightPopular: false,
    bestValue: true,
    sortOrder: 3,
    subscribers: 97,
  },
  {
    slug: "enterprise",
    name: "Enterprise",
    tagline: "For Large Organizations",
    description: "Custom pricing and white-glove support.",
    status: "active",
    monthlyPrice: 0,
    annualPrice: 0,
    discount: 0,
    monthlyTxLimit: 0,
    dailyTransferLimit: 0,
    apiCallsPerDay: 0,
    transactionFeeText: "Custom rates (as low as 1.2%)",
    volumeLimitText: "Unlimited volume",
    features: ["Unlimited transactions", "24/7 premium support", "Dedicated technical team", "Custom API development", "SLA guarantees"],
    showOnPricingPage: true,
    highlightPopular: false,
    bestValue: false,
    sortOrder: 4,
    subscribers: 15,
  },
];

async function seedPlans() {
  try {
    await mongoose.connect(DB_PATH);
    console.log("✅ MongoDB Connected");

    for (const plan of defaultPlans) {
      await Plan.findOneAndUpdate(
        { slug: plan.slug },
        { $set: plan },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    await PricingSettings.findOneAndUpdate(
      { key: "default" },
      {
        $set: {
          applyGST: true,
          gstRate: 18,
          gstRegNumber: "",
          annualDiscount: 15,
          studentDiscountEnabled: false,
          studentDiscount: 10,
          revenueChart: [620000, 710000, 780000, 820000, 870000, 897143],
          churnRate: 2.8,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log("✅ Plans and pricing settings seeded successfully.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to seed plans:", error);
    process.exit(1);
  }
}

seedPlans();
