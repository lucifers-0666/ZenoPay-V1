const mongoose = require("mongoose");

const TransactionHistorySchema = new mongoose.Schema({
  TransactionID: {
    type: Number,
    required: true,
    unique: true,
  },
  TransactionTime: {
    type: Date,
    default: Date.now,
    required: true,
  },
  SenderBank: {
    type: String,
    required: true,
  },
  SenderAccountNumber: {
    type: String,
    required: true,
  },
  SenderHolderName: {
    type: String,
    required: true,
  },
  SenderBalanceBefore: {
    type: mongoose.Types.Decimal128,
    required: true,
  },
  SenderBalanceAfter: {
    type: mongoose.Types.Decimal128,
    required: true,
  },
  ReceiverBank: {
    type: String,
    required: true,
  },
  ReceiverAccountNumber: {
    type: String,
    required: true,
  },
  ReceiverHolderName: {
    type: String,
    required: true,
  },
  ReceiverBalanceBefore: {
    type: mongoose.Types.Decimal128,
    required: true,
  },
  ReceiverBalanceAfter: {
    type: mongoose.Types.Decimal128,
    required: false,
  },
  Amount: {
    type: mongoose.Types.Decimal128,
    required: true,
  },
  Description: {
    type: String,
    required: true,
  },
  Status: {
    type: String,
    enum: ["success", "failed", "pending"],
    default: "success",
  },
});

module.exports = mongoose.model("TransactionHistory", TransactionHistorySchema);
