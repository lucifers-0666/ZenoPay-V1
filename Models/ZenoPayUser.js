const mongoose = require("mongoose");

const ZenoPayDetailsSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },

  phone: {
    type: String,
    default: "",
  },

  userId: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
  },

  avatar: {
    type: String,
    default: "",
  },

  avatarColor: {
    type: String,
    default: "#3B82F6",
  },

  role: {
    type: String,
    enum: ["User", "Merchant", "Admin", "Super Admin"],
    default: "User",
  },

  kycStatus: {
    type: String,
    enum: ["Verified", "Pending", "Rejected", "Not Submitted"],
    default: "Not Submitted",
  },

  status: {
    type: String,
    enum: ["Active", "Inactive", "Suspended"],
    default: "Active",
  },

  balance: {
    type: Number,
    default: 0,
  },
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
    pauseAll: {
      type: Boolean,
      default: false,
    },
    digestFrequency: {
      type: String,
      enum: ["real-time", "daily", "weekly"],
      default: "real-time",
    },
    quietHours: {
      type: Boolean,
      default: false,
    },
    quietFrom: {
      type: String,
      default: "22:00",
    },
    quietTo: {
      type: String,
      default: "07:00",
    },
    dynamicState: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
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

  KYCResubmissionRequested: {
    type: Boolean,
    default: false,
  },

  KYCResubmissionRequestedAt: {
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

  EmailVerified: {
    type: Boolean,
    default: false,
  },

  EmailVerificationToken: {
    type: String,
    required: false,
  },

  EmailVerificationExpiry: {
    type: Date,
    required: false,
  },

  EmailVerifiedAt: {
    type: Date,
    required: false,
  },

}, { timestamps: true });

const kycLegacyToUi = {
  verified: "Verified",
  approved: "Verified",
  pending: "Pending",
  rejected: "Rejected",
  not_started: "Not Submitted",
};

const kycUiToLegacy = {
  Verified: "verified",
  Pending: "pending",
  Rejected: "rejected",
  "Not Submitted": "not_started",
};

const roleLegacyToUi = {
  user: "User",
  merchant: "Merchant",
  admin: "Admin",
};

const roleUiToLegacy = {
  User: "user",
  Merchant: "merchant",
  Admin: "admin",
  "Super Admin": "admin",
};

function deriveAvatarColor(seed = "") {
  const palette = ["#3B82F6", "#8B5CF6", "#14B8A6", "#F59E0B", "#EF4444", "#10B981"];
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return palette[Math.abs(hash) % palette.length];
}

ZenoPayDetailsSchema.pre("validate", function syncUnifiedFromLegacy(next) {
  if (!this.name && this.FullName) this.name = this.FullName;
  if (!this.email && this.Email) this.email = this.Email;
  if (!this.phone && this.Mobile) this.phone = this.Mobile;
  if (!this.userId && this.ZenoPayID) this.userId = this.ZenoPayID;

  if (!this.role && this.Role) {
    this.role = roleLegacyToUi[String(this.Role).toLowerCase()] || "User";
  }

  if (!this.kycStatus && this.KYCStatus) {
    this.kycStatus = kycLegacyToUi[String(this.KYCStatus).toLowerCase()] || "Not Submitted";
  }

  if (!this.status) {
    this.status = this.AccountStatus || "Active";
  }

  if (!this.createdAt && this.RegistrationDate) {
    this.createdAt = this.RegistrationDate;
  }

  if (!this.avatarColor) {
    this.avatarColor = deriveAvatarColor(this.name || this.FullName || this.userId || this.ZenoPayID || "");
  }

  if (!this.name && this.email) {
    this.name = String(this.email).split("@")[0];
  }

  next();
});

ZenoPayDetailsSchema.pre("save", function syncLegacyFromUnified(next) {
  if (this.name) this.FullName = this.name;
  if (this.email) this.Email = this.email;
  if (this.phone) this.Mobile = this.phone;
  if (this.userId) this.ZenoPayID = this.userId;
  if (this.role) this.Role = roleUiToLegacy[this.role] || "user";
  if (this.kycStatus) this.KYCStatus = kycUiToLegacy[this.kycStatus] || "not_started";
  if (this.status) this.AccountStatus = this.status;
  if (this.createdAt) this.RegistrationDate = this.createdAt;
  next();
});

module.exports = mongoose.model("ZenoPayDetails", ZenoPayDetailsSchema);
