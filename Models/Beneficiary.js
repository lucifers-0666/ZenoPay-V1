const mongoose = require("mongoose");

const BeneficiarySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ZenoPayDetails",
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  phone: {
    type: String,
    default: "",
    trim: true,
  },
  accountNumber: {
    type: String,
    default: "",
    trim: true,
  },
  nickname: {
    type: String,
    default: "",
    trim: true,
  },
  avatar: {
    type: String,
    default: "",
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

BeneficiarySchema.index({ userId: 1, email: 1 }, { unique: true });

module.exports = mongoose.model("Beneficiary", BeneficiarySchema);
