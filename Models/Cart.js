const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ZenoPayUser', required: true },
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 1, default: 1 },
  size: { type: String, default: null },
  color: { type: String, default: null },
  added_at: { type: Date, default: Date.now }
});

// Indexes
cartSchema.index({ user_id: 1, product_id: 1 }, { unique: true });
cartSchema.index({ user_id: 1, added_at: -1 });

// Virtual for subtotal (populated after product lookup)
cartSchema.virtual('subtotal').get(function() {
  if (this.product) {
    const price = this.product.sale_price 
      ? parseFloat(this.product.sale_price.toString()) 
      : parseFloat(this.product.price.toString());
    return price * this.quantity;
  }
  return 0;
});

cartSchema.set('toJSON', { virtuals: true });

// Static method to get user's cart with products
cartSchema.statics.getUserCart = async function(userId) {
  const cartItems = await this.find({ user_id: userId })
    .populate('product_id')
    .sort({ added_at: -1 });
  
  return cartItems.map(item => {
    const product = item.product_id;
    if (!product || !product.is_active) return null;
    
    return {
      _id: item._id,
      product: {
        _id: product._id,
        name: product.name,
        sku: product.sku,
        price: parseFloat(product.price.toString()),
        sale_price: product.sale_price ? parseFloat(product.sale_price.toString()) : null,
        images: product.images,
        stock_quantity: product.stock_quantity,
        is_digital: product.is_digital
      },
      quantity: item.quantity,
      size: item.size,
      color: item.color,
      subtotal: product.sale_price 
        ? parseFloat(product.sale_price.toString()) * item.quantity
        : parseFloat(product.price.toString()) * item.quantity,
      added_at: item.added_at
    };
  }).filter(item => item !== null);
};

// Static method to calculate cart total
cartSchema.statics.calculateCartTotal = async function(userId) {
  const cartItems = await this.getUserCart(userId);
  
  const subtotal = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
  const tax = subtotal * 0.18; // 18% GST
  const shipping = subtotal > 500 ? 0 : 50; // Free shipping over ₹500
  const total = subtotal + tax + shipping;
  
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    shipping: Math.round(shipping * 100) / 100,
    total: Math.round(total * 100) / 100,
    itemCount: cartItems.length
  };
};

module.exports = mongoose.model('Cart', cartSchema);
