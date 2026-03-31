const mongoose = require("mongoose");
const crypto = require("crypto");

// Encryption utilities
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.scryptSync(process.env.SECRET_KEY || "default-secret", "salt", 32);
const ALGORITHM = "aes-256-cbc";

const encrypt = (text) => {
  if (!text) return null;
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(String(text));
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
};

const decrypt = (hash) => {
  if (!hash) return null;
  const parts = hash.split(":");
  const iv = Buffer.from(parts.shift(), "hex");
  const encryptedText = Buffer.from(parts.join(":"), "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
};

const KYCSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ZenoPayUser",
      required: true,
      index: true,
    },

    // Encrypted PAN Number (stored as encrypted)
    panNumber: {
      type: String,
      default: null,
      // This will be stored encrypted
    },

    // Only last 4 digits of Aadhaar stored (plaintext)
    aadhaarLast4: {
      type: String,
      default: null,
      match: [/^\d{4}$/, "Aadhaar last 4 digits must be numeric"],
    },

    // Document file paths
    panCardImage: {
      type: String,
      default: null,
      // Relative path: /uploads/kyc/userId_pan_timestamp.jpg
    },

    aadhaarFrontImage: {
      type: String,
      default: null,
      // Relative path: /uploads/kyc/userId_aadhaar_front_timestamp.jpg
    },

    aadhaarBackImage: {
      type: String,
      default: null,
      // Relative path: /uploads/kyc/userId_aadhaar_back_timestamp.jpg
    },

    // KYC Status tracking
    status: {
      type: String,
      enum: ["pending", "under_review", "approved", "rejected"],
      default: "pending",
      index: true,
    },

    submittedAt: {
      type: Date,
      default: Date.now,
    },

    reviewedAt: {
      type: Date,
      default: null,
    },

    rejectionReason: {
      type: String,
      default: null,
      maxlength: 500,
    },

    // Admin reviewer reference
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ZenoPayUser",
      default: null,
    },

    // Resubmission tracking
    resubmissionAllowed: {
      type: Boolean,
      default: false,
    },

    previousSubmissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "KYC",
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "kyc",
  }
);

// Virtual getter for decrypted PAN (never returned by default)
KYCSchema.virtual("panNumberDecrypted").get(function () {
  return this.panNumber ? decrypt(this.panNumber) : null;
});

// Pre-save hook to encrypt PAN if provided
KYCSchema.pre("save", function (next) {
  if (this.isModified("panNumber") && this.panNumber) {
    this.panNumber = encrypt(this.panNumber);
  }
  next();
});

// Pre-find hook to exclude encrypted fields by default
KYCSchema.pre(/^find/, function (next) {
  // Don't automatically exclude - let controller decide based on context
  next();
});

// Method to securely get PAN (use only when needed)
KYCSchema.methods.getPAN = function () {
  return this.panNumber ? decrypt(this.panNumber) : null;
};

// Method to check PAN match (for verification)
KYCSchema.methods.verifyPAN = function (plainPAN) {
  const decrypted = this.panNumber ? decrypt(this.panNumber) : null;
  return decrypted && decrypted === plainPAN.toUpperCase();
};

// Ensure virtual fields are included in JSON output
KYCSchema.set("toJSON", { virtuals: false });

module.exports = mongoose.model("KYC", KYCSchema);
