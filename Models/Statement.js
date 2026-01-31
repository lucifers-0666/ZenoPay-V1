const mongoose = require("mongoose");

const StatementSchema = new mongoose.Schema({
  user_id: {
    type: String,
    required: true,
    index: true,
  },
  statement_month: {
    type: String,
    required: true, // e.g., "January 2026"
  },
  statement_period_start: {
    type: Date,
    required: true,
  },
  statement_period_end: {
    type: Date,
    required: true,
  },
  total_transactions: {
    type: Number,
    default: 0,
  },
  total_amount_sent: {
    type: mongoose.Types.Decimal128,
    default: 0,
  },
  total_amount_received: {
    type: mongoose.Types.Decimal128,
    default: 0,
  },
  fees_charged: {
    type: mongoose.Types.Decimal128,
    default: 0,
  },
  opening_balance: {
    type: mongoose.Types.Decimal128,
    default: 0,
  },
  closing_balance: {
    type: mongoose.Types.Decimal128,
    default: 0,
  },
  pdf_url: {
    type: String,
    default: null,
  },
  generated_at: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ["processing", "ready", "failed"],
    default: "processing",
  },
  // Additional fields for detailed breakdown
  transaction_breakdown: {
    sent_count: { type: Number, default: 0 },
    received_count: { type: Number, default: 0 },
    total_debits: { type: mongoose.Types.Decimal128, default: 0 },
    total_credits: { type: mongoose.Types.Decimal128, default: 0 },
  },
  fee_breakdown: [
    {
      fee_type: String,
      amount: mongoose.Types.Decimal128,
      date: Date,
      description: String,
    },
  ],
  // Metadata
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12,
  },
  year: {
    type: Number,
    required: true,
  },
});

// Compound index for efficient queries
StatementSchema.index({ user_id: 1, year: -1, month: -1 });
StatementSchema.index({ user_id: 1, status: 1 });

// Virtual for net amount
StatementSchema.virtual("net_amount").get(function () {
  const received = parseFloat(this.total_amount_received.toString());
  const sent = parseFloat(this.total_amount_sent.toString());
  const fees = parseFloat(this.fees_charged.toString());
  return received - sent - fees;
});

// Ensure virtuals are included in JSON
StatementSchema.set("toJSON", { virtuals: true });
StatementSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Statement", StatementSchema);
