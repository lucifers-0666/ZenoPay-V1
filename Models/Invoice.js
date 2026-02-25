const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  invoice_number: {
    type: String,
    required: true,
    unique: true,
  },
  user_id: {
    type: String,
    required: true,
    index: true,
  },
  client_name: {
    type: String,
    required: true,
    trim: true,
  },
  client_email: {
    type: String,
    default: '',
    trim: true,
  },
  client_address: {
    type: String,
    default: '',
    trim: true,
  },
  issue_date: {
    type: Date,
    default: Date.now,
  },
  due_date: {
    type: Date,
    required: true,
  },
  amount: {
    type: mongoose.Types.Decimal128,
    required: true,
    get: (v) => parseFloat(v.toString()),
  },
  status: {
    type: String,
    enum: ['paid', 'pending', 'overdue', 'draft'],
    default: 'pending',
  },
  notes: {
    type: String,
    default: '',
    trim: true,
  },
  items: {
    type: Array,
    default: null,
  },
  payment_info: {
    type: Object,
    default: null,
  },
  currency: {
    type: String,
    default: 'INR',
  },
}, {
  timestamps: true,
  toJSON: { getters: true },
  toObject: { getters: true },
});

invoiceSchema.index({ user_id: 1, issue_date: -1 });
invoiceSchema.index({ user_id: 1, status: 1 });

invoiceSchema.statics.generateInvoiceNumber = async function generateInvoiceNumber() {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;

  const latest = await this.findOne({
    invoice_number: new RegExp(`^${prefix}`),
  }).sort({ invoice_number: -1 });

  let nextNumber = 1;
  if (latest?.invoice_number) {
    const last = parseInt(String(latest.invoice_number).split('-').pop(), 10);
    if (Number.isFinite(last)) nextNumber = last + 1;
  }

  return `${prefix}${String(nextNumber).padStart(4, '0')}`;
};

module.exports = mongoose.model('Invoice', invoiceSchema);
