const mongoose = require("mongoose");

const UserConsentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ZenoPayUser",
    required: true,
    index: true
  },
  
  policyVersion: {
    type: String,
    required: true,
    trim: true
  },
  
  policyType: {
    type: String,
    enum: ["privacy", "terms"],
    default: "privacy",
    index: true
  },
  
  consentDate: {
    type: Date,
    default: Date.now,
    required: true
  },
  
  consentMethod: {
    type: String,
    enum: ["signup", "explicit", "continued_use", "update_acceptance"],
    required: true
  },
  
  ipAddress: {
    type: String,
    required: true,
    trim: true
  },
  
  userAgent: {
    type: String,
    required: true
  },
  
  deviceInfo: {
    browser: String,
    os: String,
    device: String
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
UserConsentSchema.index({ userId: 1, policyType: 1, policyVersion: 1 });
UserConsentSchema.index({ consentDate: -1 });

// Static method to record user consent
UserConsentSchema.statics.recordConsent = async function(data) {
  const consent = new this({
    userId: data.userId,
    policyVersion: data.policyVersion,
    policyType: data.policyType || "privacy",
    consentMethod: data.consentMethod,
    ipAddress: data.ipAddress,
    userAgent: data.userAgent,
    deviceInfo: data.deviceInfo || {}
  });
  
  return await consent.save();
};

// Static method to check if user has accepted a specific version
UserConsentSchema.statics.hasUserAccepted = async function(userId, policyVersion, policyType = "privacy") {
  const consent = await this.findOne({
    userId,
    policyVersion,
    policyType
  });
  
  return !!consent;
};

// Static method to get user's consent history
UserConsentSchema.statics.getUserConsentHistory = async function(userId, policyType = "privacy") {
  return await this.find({
    userId,
    policyType
  }).sort({ consentDate: -1 });
};

// Static method to get users who haven't accepted latest version
UserConsentSchema.statics.getUsersWithoutLatestConsent = async function(latestVersion, policyType = "privacy") {
  const usersWithConsent = await this.distinct("userId", {
    policyVersion: latestVersion,
    policyType
  });
  
  return usersWithConsent;
};

// Static method to get acceptance count for a version
UserConsentSchema.statics.getAcceptanceCount = async function(policyVersion, policyType = "privacy") {
  return await this.countDocuments({
    policyVersion,
    policyType
  });
};

const UserConsent = mongoose.model("UserConsent", UserConsentSchema);

module.exports = UserConsent;
