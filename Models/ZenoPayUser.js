const mongoose = require("mongoose");

const ZenoPayDetailsSchema = new mongoose.Schema({
  ZenoPayID: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },

  Password: {
    type: String,
    required: false,
  },

  FullName: {
    type: String,
    required: true,
  },

  DOB: {
    type: Date,
    required: true,
  },

  Gender: {
    type: String,
    required: true,
  },

  Mobile: {
    type: String,
    required: true,
    match: [/^[0-9]{10}$/, "Invalid mobile number"],
  },

  Email: {
    type: String,
    unique: true,
    required: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function (email) {
        return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email);
      },
      message: "Invalid email format",
    },
  },

  FatherName: {
    type: String,
    required: true,
  },

  MotherName: {
    type: String,
    required: false,
  },

  Address: {
    type: String,
    required: true,
  },

  City: {
    type: String,
    required: true,
  },

  State: {
    type: String,
    required: true,
  },

  Pincode: {
    type: String,
    required: true,
    match: [/^[0-9]{6}$/, "Invalid pincode"],
  },

  ImagePath: {
    type: String,
    required: false,
  },

  RegistrationDate: {
    type: Date,
    default: Date.now,
  },

  Role: {
    type: String,
    enum: ["user", "merchant", "admin"],
    default: "user",
    required: true,
  },

  PhoneNumber: {
    type: String,
    get: function() {
      return this.Mobile;
    },
    set: function(v) {
      this.Mobile = v;
      return v;
    }
  },

  AadharNumber: {
    type: String,
    required: false,
  },

  PANCard: {
    type: String,
    required: false,
  },

  NotificationPreferences: {
    emailNotifications: {
      type: Boolean,
      default: true,
    },
    smsNotifications: {
      type: Boolean,
      default: true,
    },
    transactionAlerts: {
      type: Boolean,
      default: true,
    },
    promotionalEmails: {
      type: Boolean,
      default: false,
    },
  },

  AccountStatus: {
    type: String,
    enum: ["Active", "Inactive", "Suspended"],
    default: "Active",
  },

  DeactivationReason: {
    type: String,
    required: false,
  },

  DeactivatedAt: {
    type: Date,
    required: false,
  },

  PasswordChangeDate: {
    type: Date,
    required: false,
  },

  PasswordResetToken: {
    type: String,
    required: false,
  },

  PasswordResetExpiry: {
    type: Date,
    required: false,
  },

  KYCStatus: {
    type: String,
    enum: ["not_started", "pending", "approved", "rejected", "verified"],
    default: "not_started",
  },

  KYCSubmittedAt: {
    type: Date,
    required: false,
  },

  KYCVerifiedAt: {
    type: Date,
    required: false,
  },

  KYCRejectedAt: {
    type: Date,
    required: false,
  },

  KYCRejectionReason: {
    type: String,
    required: false,
  },

  KYCDocuments: {
    identityType: String,
    identityFront: String,
    identityBack: String,
    identityFrontRotation: Number,
    identityBackRotation: Number,
    addressType: String,
    addressDocument: String,
    addressRotation: Number,
    selfie: String,
    selfieRotation: Number,
  },

});

module.exports = mongoose.model("ZenoPayDetails", ZenoPayDetailsSchema);
