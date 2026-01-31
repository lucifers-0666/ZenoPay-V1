const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  order_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  product_name: { type: String, required: true },
  product_sku: { type: String, required: true },
  product_image: { type: String, default: '' },
  quantity: { type: Number, required: true, min: 1 },
  unit_price: { type: mongoose.Schema.Types.Decimal128, required: true },
  subtotal: { type: mongoose.Schema.Types.Decimal128, required: true },
  size: { type: String, default: null },
  color: { type: String, default: null }
});

// Indexes
orderItemSchema.index({ order_id: 1 });
orderItemSchema.index({ product_id: 1 });

// Convert Decimal128 to number for JSON
orderItemSchema.set('toJSON', { 
  virtuals: true,
  transform: function(doc, ret) {
    if (ret.unit_price) ret.unit_price = parseFloat(ret.unit_price.toString());
    if (ret.subtotal) ret.subtotal = parseFloat(ret.subtotal.toString());
    return ret;
  }
});

// Static method to create items from cart
orderItemSchema.statics.createFromCart = async function(orderId, cartItems) {
  const orderItems = cartItems.map(item => ({
    order_id: orderId,
    product_id: item.product._id,
    product_name: item.product.name,
    product_sku: item.product.sku,
    product_image: item.product.images[0] || '',
    quantity: item.quantity,
    unit_price: item.product.sale_price || item.product.price,
    subtotal: item.subtotal,
    size: item.size,
    color: item.color
  }));
  
  return await this.insertMany(orderItems);
};

module.exports = mongoose.model('OrderItem', orderItemSchema);
