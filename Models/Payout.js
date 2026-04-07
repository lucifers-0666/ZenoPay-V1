const mongoose = require("mongoose");

const payoutSchema = new mongoose.Schema({
  merchantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Merchant",
    required: true,
    index: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 100,
  },
  bankAccountName: {
    type: String,
    required: true,
    trim: true,
  },
  bankAccountNumber: {
    type: String,
    required: true,
    trim: true,
  },
  bankIFSC: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
  },
  status: {
    type: String,
    enum: ["pending", "processing", "completed", "rejected"],
    default: "pending",
    index: true,
  },
  requestedAt: {
    type: Date,
    default: Date.now,
  },
  processedAt: {
    type: Date,
    default: null,
  },
  rejectionReason: {
    type: String,
    default: "",
    trim: true,
  },
  transactionRef: {
    type: String,
    default: "",
    trim: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model("Payout", payoutSchema);
