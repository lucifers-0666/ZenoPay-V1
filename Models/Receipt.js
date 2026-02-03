const mongoose = require('mongoose');

const receiptSchema = new mongoose.Schema({
  receipt_number: {
    type: String,
    required: true,
    unique: true,
    // Format: RCP-2026-0001
  },
  transaction_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TransactionHistory',
    required: true
  },
  user_id: {
    type: String,
    required: true
  },
  transaction_type: {
    type: String,
    enum: ['sent', 'received'],
    required: true
  },
  amount: {
    type: mongoose.Types.Decimal128,
    required: true,
    get: v => parseFloat(v.toString())
  },
  fee: {
    type: mongoose.Types.Decimal128,
    default: 0,
    get: v => parseFloat(v.toString())
  },
  total_amount: {
    type: mongoose.Types.Decimal128,
    required: true,
    get: v => parseFloat(v.toString())
  },
  recipient_name: {
    type: String,
    required: true
  },
  recipient_id: {
    type: String,
    required: true
  },
  recipient_email: {
    type: String,
    default: ''
  },
  sender_name: {
    type: String,
    required: true
  },
  sender_id: {
    type: String,
    required: true
  },
  payment_method: {
    type: String,
    default: 'ZenoPay Wallet'
  },
  transaction_date: {
    type: Date,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  pdf_url: {
    type: String,
    default: null
  },
  generated_at: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['success', 'pending', 'failed'],
    default: 'success'
  },
  transaction_hash: {
    type: String,
    default: ''
  },
  verification_status: {
    type: String,
    enum: ['verified', 'pending', 'failed'],
    default: 'verified'
  }
}, {
  timestamps: true,
  toJSON: { getters: true },
  toObject: { getters: true }
});

// Indexes for efficient querying
receiptSchema.index({ user_id: 1, transaction_date: -1 });
receiptSchema.index({ transaction_id: 1 });
receiptSchema.index({ status: 1 });

// Static method to generate unique receipt number
receiptSchema.statics.generateReceiptNumber = async function() {
  const year = new Date().getFullYear();
  const prefix = `RCP-${year}-`;
  
  // Find the latest receipt number for this year
  const latestReceipt = await this.findOne({
    receipt_number: new RegExp(`^${prefix}`)
  }).sort({ receipt_number: -1 });
  
  let nextNumber = 1;
  if (latestReceipt) {
    const lastNumber = parseInt(latestReceipt.receipt_number.split('-').pop());
    nextNumber = lastNumber + 1;
  }
  
  // Format: RCP-2026-0001
  return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
};

// Static method to create receipt from transaction
receiptSchema.statics.createFromTransaction = async function(transaction, userId, userType) {
  const receiptNumber = await this.generateReceiptNumber();
  
  const transactionType = transaction.SenderAccountNumber === userId ? 'sent' : 'received';
  const amount = parseFloat(transaction.Amount.toString());
  const fee = transaction.TransactionFee ? parseFloat(transaction.TransactionFee.toString()) : 0;
  
  const receiptData = {
    receipt_number: receiptNumber,
    transaction_id: transaction._id,
    user_id: userId,
    transaction_type: transactionType,
    amount: amount,
    fee: fee,
    total_amount: transactionType === 'sent' ? amount + fee : amount,
    recipient_name: transaction.ReceiverName || 'N/A',
    recipient_id: transaction.ReceiverAccountNumber || 'N/A',
    sender_name: transaction.SenderName || 'N/A',
    sender_id: transaction.SenderAccountNumber || 'N/A',
    payment_method: transaction.PaymentMethod || 'ZenoPay Wallet',
    transaction_date: transaction.TransactionTime,
    description: transaction.Description || '',
    status: transaction.Status === 'Completed' ? 'success' : 'pending',
    transaction_hash: transaction.TransactionID || ''
  };
  
  return await this.create(receiptData);
};

module.exports = mongoose.model('Receipt', receiptSchema);
