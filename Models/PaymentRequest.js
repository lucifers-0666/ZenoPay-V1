const mongoose = require("mongoose");

const PaymentRequestSchema = new mongoose.Schema(
  {
    requestId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ZenoPayDetails",
      required: true,
      index: true,
    },
    requesterZenoPayId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    recipients: {
      type: [String],
      default: [],
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    currency: {
      type: String,
      default: "INR",
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    category: {
      type: String,
      default: "",
      trim: true,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    splitCount: {
      type: Number,
      default: 1,
      min: 1,
    },
    splitMode: {
      type: Boolean,
      default: false,
    },
    perPerson: {
      type: Number,
      default: 0,
      min: 0,
    },
    perPersonAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    contributions: {
      type: [
        {
          userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ZenoPayDetails",
            required: true,
          },
          amount: {
            type: Number,
            required: true,
            min: 0,
          },
          status: {
            type: String,
            enum: ["pending", "paid"],
            default: "pending",
          },
          paidAt: {
            type: Date,
            default: null,
          },
        },
      ],
      default: [],
    },
    totalCollected: {
      type: Number,
      default: 0,
      min: 0,
    },
    isFullySettled: {
      type: Boolean,
      default: false,
    },
    sendEmail: {
      type: Boolean,
      default: false,
    },
    sendSMS: {
      type: Boolean,
      default: false,
    },
    generateLink: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ["draft", "pending", "paid", "expired", "cancelled"],
      default: "pending",
      index: true,
    },
    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ZenoPayDetails",
      default: null,
    },
    paidAt: {
      type: Date,
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    transactionRef: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("PaymentRequest", PaymentRequestSchema);
