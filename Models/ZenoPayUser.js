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

  dateOfBirth: {
    type: Date,
    required: false,
  },

  address: {
    type: String,
    default: "",
  },

  panNumber: {
    type: String,
    default: "",
    uppercase: true,
    trim: true,
  },

  aadhaarNumber: {
    type: String,
    default: "",
    trim: true,
  },

  profilePhoto: {
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
    enum: [
      "pending",
      "submitted",
      "verified",
      "rejected",
      "Verified",
      "Pending",
      "Rejected",
      "Not Submitted",
    ],
    default: "pending",
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

  transactionPin: {
    type: String,
    default: null,
  },

  pinAttempts: {
    type: Number,
    default: 0,
  },

  pinLockedUntil: {
    type: Date,
    default: null,
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

  isEmailVerified: {
    type: Boolean,
    default: false,
  },

  emailOtp: {
    type: String,
    required: false,
  },

  emailOtpExpiry: {
    type: Date,
    required: false,
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
  verified: "verified",
  approved: "verified",
  pending: "pending",
  submitted: "submitted",
  rejected: "rejected",
  not_started: "pending",
};

const kycUiToLegacy = {
  verified: "verified",
  submitted: "pending",
  pending: "pending",
  rejected: "rejected",
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

ZenoPayDetailsSchema.pre("validate", function syncUnifiedFromLegacy() {
  if (!this.name && this.FullName) this.name = this.FullName;
  if (!this.email && this.Email) this.email = this.Email;
  if (!this.phone && this.Mobile) this.phone = this.Mobile;
  if (!this.dateOfBirth && this.DOB) this.dateOfBirth = this.DOB;
  if (!this.address && this.Address) this.address = this.Address;
  if (!this.panNumber && this.PANCard) this.panNumber = this.PANCard;
  if (!this.aadhaarNumber && this.AadharNumber) this.aadhaarNumber = this.AadharNumber;
  if (!this.profilePhoto && this.ImagePath) this.profilePhoto = this.ImagePath;
  if (!this.userId && this.ZenoPayID) this.userId = this.ZenoPayID;

  const roleWasExplicitlySet = this.isModified("Role") || (this.isNew && this.Role && this.Role !== "user");
  if ((roleWasExplicitlySet || !this.role) && this.Role) {
    this.role = roleLegacyToUi[String(this.Role).toLowerCase()] || "User";
  }

  if (!this.kycStatus && this.KYCStatus) {
    this.kycStatus = kycLegacyToUi[String(this.KYCStatus).toLowerCase()] || "pending";
  }

  if (!this.status) {
    this.status = this.AccountStatus || "Active";
  }

  if (typeof this.EmailVerified === "boolean" && typeof this.isEmailVerified !== "boolean") {
    this.isEmailVerified = this.EmailVerified;
  }

  if (typeof this.isEmailVerified === "boolean" && typeof this.EmailVerified !== "boolean") {
    this.EmailVerified = this.isEmailVerified;
  }

  if (typeof this.isEmailVerified !== "boolean" && typeof this.EmailVerified !== "boolean") {
    this.isEmailVerified = false;
    this.EmailVerified = false;
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

});

ZenoPayDetailsSchema.pre("save", function syncLegacyFromUnified() {
  if (this.name) this.FullName = this.name;
  if (this.email) this.Email = this.email;
  if (this.phone) this.Mobile = this.phone;
  if (this.dateOfBirth) this.DOB = this.dateOfBirth;
  if (this.address) this.Address = this.address;
  if (this.panNumber) this.PANCard = this.panNumber;
  if (this.aadhaarNumber) this.AadharNumber = this.aadhaarNumber;
  if (this.profilePhoto) this.ImagePath = this.profilePhoto;
  if (this.userId) this.ZenoPayID = this.userId;
  if (this.role) this.Role = roleUiToLegacy[this.role] || "user";
  if (this.kycStatus) this.KYCStatus = kycUiToLegacy[this.kycStatus] || "not_started";
  if (this.status) this.AccountStatus = this.status;
  if (typeof this.isEmailVerified === "boolean") this.EmailVerified = this.isEmailVerified;
  if (typeof this.EmailVerified === "boolean") this.isEmailVerified = this.EmailVerified;
  if (this.createdAt) this.RegistrationDate = this.createdAt;
});

module.exports = mongoose.model("ZenoPayDetails", ZenoPayDetailsSchema);
