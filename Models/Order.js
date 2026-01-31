const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ZenoPayUser', required: true },
  order_number: { type: String, required: true, unique: true, uppercase: true },
  
  // Pricing
  total_amount: { type: mongoose.Schema.Types.Decimal128, required: true },
  discount_amount: { type: mongoose.Schema.Types.Decimal128, default: 0 },
  tax_amount: { type: mongoose.Schema.Types.Decimal128, default: 0 },
  shipping_fee: { type: mongoose.Schema.Types.Decimal128, default: 0 },
  grand_total: { type: mongoose.Schema.Types.Decimal128, required: true },
  
  // Payment
  payment_method: { 
    type: String, 
    required: true,
    enum: ['wallet', 'upi', 'card', 'netbanking', 'cod']
  },
  payment_status: { 
    type: String, 
    required: true,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  payment_id: { type: String, default: null },
  
  // Order Status
  order_status: { 
    type: String, 
    required: true,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  
  // Shipping
  shipping_address: {
    name: String,
    email: String,
    phone: String,
    address_line1: String,
    address_line2: String,
    city: String,
    state: String,
    pincode: String,
    country: { type: String, default: 'India' }
  },
  
  tracking_number: { type: String, default: null },
  carrier: { type: String, default: null },
  
  // Promo code
  promo_code: { type: String, default: null },
  
  // Timestamps
  ordered_at: { type: Date, default: Date.now },
  paid_at: { type: Date, default: null },
  shipped_at: { type: Date, default: null },
  delivered_at: { type: Date, default: null },
  cancelled_at: { type: Date, default: null },
  
  // Notes
  customer_notes: { type: String, default: '' },
  admin_notes: { type: String, default: '' }
});

// Indexes
orderSchema.index({ user_id: 1, ordered_at: -1 });
orderSchema.index({ order_number: 1 });
orderSchema.index({ order_status: 1 });
orderSchema.index({ payment_status: 1 });

// Convert Decimal128 to number for JSON
orderSchema.set('toJSON', { 
  virtuals: true,
  transform: function(doc, ret) {
    if (ret.total_amount) ret.total_amount = parseFloat(ret.total_amount.toString());
    if (ret.discount_amount) ret.discount_amount = parseFloat(ret.discount_amount.toString());
    if (ret.tax_amount) ret.tax_amount = parseFloat(ret.tax_amount.toString());
    if (ret.shipping_fee) ret.shipping_fee = parseFloat(ret.shipping_fee.toString());
    if (ret.grand_total) ret.grand_total = parseFloat(ret.grand_total.toString());
    return ret;
  }
});

// Static method to generate order number
orderSchema.statics.generateOrderNumber = async function() {
  const count = await this.countDocuments();
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const number = String(count + 1).padStart(4, '0');
  return `ZP-ORD-${year}${month}-${number}`;
};

// Instance method to update status
orderSchema.methods.updateStatus = async function(newStatus) {
  this.order_status = newStatus;
  
  if (newStatus === 'shipped' && !this.shipped_at) {
    this.shipped_at = Date.now();
  } else if (newStatus === 'delivered' && !this.delivered_at) {
    this.delivered_at = Date.now();
  } else if (newStatus === 'cancelled' && !this.cancelled_at) {
    this.cancelled_at = Date.now();
  }
  
  await this.save();
};

// Instance method to check if cancellable
orderSchema.methods.isCancellable = function() {
  return ['pending', 'processing'].includes(this.order_status);
};

module.exports = mongoose.model('Order', orderSchema);
