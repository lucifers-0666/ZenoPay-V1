const mongoose = require("mongoose");
const crypto = require("crypto");

const merchantSchema = new mongoose.Schema(
  {
    ZenoPayId: {
      type: String,
      required: true,
      unique: true,
      ref: "ZenoPayUser",
    },
    BusinessName: {
      type: String,
      required: true,
      trim: true,
    },
    BusinessType: {
      type: String,
      required: true,
      enum: [
        "E-commerce",
        "SaaS",
        "Education",
        "Healthcare",
        "Food & Beverage",
        "Travel",
        "Entertainment",
        "Other",
      ],
    },
    BusinessWebsite: {
      type: String,
      trim: true,
    },
    BusinessDescription: {
      type: String,
      trim: true,
    },
    BusinessEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    Phone: {
      type: String,
      trim: true,
      default: "",
    },
    LegalBusinessName: {
      type: String,
      trim: true,
      default: "",
    },
    BusinessRegistrationNumber: {
      type: String,
      trim: true,
      default: "",
    },
    TaxId: {
      type: String,
      trim: true,
      default: "",
    },
    documents: {
      gstCertificate: {
        path: { type: String, default: "" },
        originalName: { type: String, default: "" },
        mimetype: { type: String, default: "" },
        size: { type: Number, default: 0 },
        uploadedAt: { type: Date, default: null },
      },
      panCard: {
        path: { type: String, default: "" },
        originalName: { type: String, default: "" },
        mimetype: { type: String, default: "" },
        size: { type: Number, default: 0 },
        uploadedAt: { type: Date, default: null },
      },
      bankStatement: {
        path: { type: String, default: "" },
        originalName: { type: String, default: "" },
        mimetype: { type: String, default: "" },
        size: { type: Number, default: 0 },
        uploadedAt: { type: Date, default: null },
      },
      businessLicense: {
        path: { type: String, default: "" },
        originalName: { type: String, default: "" },
        mimetype: { type: String, default: "" },
        size: { type: Number, default: 0 },
        uploadedAt: { type: Date, default: null },
      },
    },
    onboardingStatus: {
      type: String,
      enum: ["pending_review", "approved", "rejected"],
      default: "pending_review",
      index: true,
    },
    onboardingSubmittedAt: {
      type: Date,
      default: Date.now,
    },
    onboardingReviewedAt: {
      type: Date,
      default: null,
    },
    onboardingReviewedBy: {
      type: String,
      trim: true,
      default: "",
    },
    onboardingRejectionReason: {
      type: String,
      trim: true,
      default: "",
    },
    ApiKey: {
      type: String,
      unique: true,
      required: true,
    },
    SecretKey: {
      type: String,
      required: true,
    },
    IsActive: {
      type: Boolean,
      default: true,
    },
    WebhookUrl: {
      type: String,
      trim: true,
    },
    CallbackUrl: {
      type: String,
      trim: true,
    },
    AllowedDomains: [
      {
        type: String,
        trim: true,
      },
    ],
    TransactionCount: {
      type: Number,
      default: 0,
    },
    TotalVolume: {
      type: Number,
      default: 0,
    },
    LastTransactionDate: {
      type: Date,
    },
    Status: {
      type: String,
      enum: ["pending", "active", "suspended", "closed"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

// Generate API Key
merchantSchema.methods.generateApiKey = function () {
  this.ApiKey = "zpk_live_" + crypto.randomBytes(32).toString("hex");
  this.SecretKey = "zsk_" + crypto.randomBytes(48).toString("hex");
};

// Regenerate API Key
merchantSchema.methods.regenerateApiKey = function () {
  this.ApiKey = "zpk_live_" + crypto.randomBytes(32).toString("hex");
  this.SecretKey = "zsk_" + crypto.randomBytes(48).toString("hex");
  return this.save();
};

// Update transaction statistics
merchantSchema.methods.updateStats = function (amount) {
  this.TransactionCount += 1;
  this.TotalVolume += amount;
  this.LastTransactionDate = new Date();
  return this.save();
};

module.exports = mongoose.model("Merchant", merchantSchema);
