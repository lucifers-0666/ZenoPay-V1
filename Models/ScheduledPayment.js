const mongoose = require("mongoose");

const ScheduledPaymentSchema = new mongoose.Schema(
  {
    ZenoPayId: {
      type: String,
      required: true,
      index: true,
    },
    recipient: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "Scheduled payment",
      trim: true,
    },
    frequency: {
      type: String,
      enum: ["One-time", "Daily", "Weekly", "Monthly", "Custom"],
      default: "Monthly",
    },
    method: {
      type: String,
      default: "UPI",
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    nextDue: {
      type: Date,
      required: false,
      index: true,
    },
    nextRunDate: {
      type: Date,
      required: false,
      index: true,
    },
    endDate: {
      type: Date,
      default: null,
    },
    untilCancelled: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["active", "paused", "completed", "failed"],
      default: "active",
      index: true,
    },
    runCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastRunAt: {
      type: Date,
      default: null,
    },
    totalExecutedAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastExecutionRef: {
      type: String,
      default: "",
    },
    failureMessage: {
      type: String,
      default: "",
      trim: true,
    },
    executionHistory: [
      {
        executedAt: { type: Date, default: Date.now },
        amount: { type: Number, required: true },
        status: {
          type: String,
          enum: ["success", "failed"],
          default: "success",
        },
        reference: { type: String, default: "" },
        note: { type: String, default: "" },
      },
    ],
  },
  { timestamps: true }
);

ScheduledPaymentSchema.pre("save", function syncRunDates(next) {
  if (this.nextRunDate && !this.nextDue) {
    this.nextDue = this.nextRunDate;
  }

  if (this.nextDue && !this.nextRunDate) {
    this.nextRunDate = this.nextDue;
  }

  next();
});

module.exports = mongoose.model("ScheduledPayment", ScheduledPaymentSchema);
