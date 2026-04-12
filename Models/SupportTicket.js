const mongoose = require('mongoose');

const SupportTicketSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    ticketNumber: {
      type: String,
      unique: true,
      index: true,
      default: () => `TKT-${Date.now()}`,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      enum: ['payment', 'account', 'kyc', 'other'],
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved', 'closed'],
      default: 'open',
      index: true,
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal',
      index: true,
    },
    isDraft: {
      type: Boolean,
      default: false,
      index: true,
    },
    adminNotes: {
      type: String,
      default: '',
      trim: true,
    },
    attachments: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

SupportTicketSchema.index({ userId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('SupportTicket', SupportTicketSchema);
