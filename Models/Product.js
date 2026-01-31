const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  price: { type: mongoose.Schema.Types.Decimal128, required: true },
  sale_price: { type: mongoose.Schema.Types.Decimal128, default: null },
  stock_quantity: { type: Number, required: true, default: 0 },
  sku: { type: String, required: true, unique: true, uppercase: true },
  images: [{ type: String }],
  is_digital: { type: Boolean, default: false },
  is_active: { type: Boolean, default: true },
  featured: { type: Boolean, default: false },
  tags: [{ type: String }],
  rating: { type: Number, default: 0, min: 0, max: 5 },
  review_count: { type: Number, default: 0 },
  view_count: { type: Number, default: 0 },
  specifications: { type: Map, of: String },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// Indexes
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category_id: 1, is_active: 1 });
productSchema.index({ featured: 1, is_active: 1 });
productSchema.index({ price: 1 });
productSchema.index({ created_at: -1 });

// Virtual for calculating discount percentage
productSchema.virtual('discount_percentage').get(function() {
  if (this.sale_price && parseFloat(this.sale_price.toString()) < parseFloat(this.price.toString())) {
    const price = parseFloat(this.price.toString());
    const salePrice = parseFloat(this.sale_price.toString());
    return Math.round(((price - salePrice) / price) * 100);
  }
  return 0;
});

// Virtual for final price
productSchema.virtual('final_price').get(function() {
  if (this.sale_price) {
    return parseFloat(this.sale_price.toString());
  }
  return parseFloat(this.price.toString());
});

// Check if in stock
productSchema.virtual('in_stock').get(function() {
  return this.stock_quantity > 0;
});

// Convert Decimal128 to number for JSON
productSchema.set('toJSON', { 
  virtuals: true,
  transform: function(doc, ret) {
    if (ret.price) ret.price = parseFloat(ret.price.toString());
    if (ret.sale_price) ret.sale_price = parseFloat(ret.sale_price.toString());
    return ret;
  }
});

// Update timestamp on save
productSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

// Static method to generate unique SKU
productSchema.statics.generateSKU = async function(prefix = 'PRD') {
  const count = await this.countDocuments();
  const year = new Date().getFullYear();
  const number = String(count + 1).padStart(4, '0');
  return `${prefix}-${year}-${number}`;
};

// Instance method to increment view count
productSchema.methods.incrementViews = async function() {
  this.view_count += 1;
  await this.save();
};

module.exports = mongoose.model('Product', productSchema);
