const Product = require('../Models/Product');
const Category = require('../Models/Category');
const Cart = require('../Models/Cart');
const Order = require('../Models/Order');
const OrderItem = require('../Models/OrderItem');
const ZenoPayUser = require('../Models/ZenoPayUser');

// ============================================
// SHOP PAGE
// ============================================
const getShop = async (req, res) => {
  try {
    const user = req.session?.user || { user_id: 'demo-user', name: 'Demo User' };
    
    res.render('shop', {
      pageTitle: 'ZenoPay Shop',
      user: user
    });
  } catch (error) {
    console.error('[Shop] Error loading shop page:', error);
    res.status(500).render('error-500', { message: 'Failed to load shop' });
  }
};

// ============================================
// GET ALL PRODUCTS (API)
// ============================================
const getProducts = async (req, res) => {
  try {
    const {
      category,
      search,
      sort = 'newest',
      page = 1,
      limit = 12,
      min_price,
      max_price,
      in_stock,
      on_sale,
      featured
    } = req.query;

    // Build query
    const query = { is_active: true };

    if (category) {
      query.category_id = category;
    }

    if (search) {
      query.$text = { $search: search };
    }

    if (min_price || max_price) {
      query.price = {};
      if (min_price) query.price.$gte = parseFloat(min_price);
      if (max_price) query.price.$lte = parseFloat(max_price);
    }

    if (in_stock === 'true') {
      query.stock_quantity = { $gt: 0 };
    }

    if (on_sale === 'true') {
      query.sale_price = { $ne: null };
    }

    if (featured === 'true') {
      query.featured = true;
    }

    // Sort options
    let sortOption = {};
    switch (sort) {
      case 'price_low':
        sortOption = { price: 1 };
        break;
      case 'price_high':
        sortOption = { price: -1 };
        break;
      case 'popular':
        sortOption = { view_count: -1 };
        break;
      case 'rating':
        sortOption = { rating: -1 };
        break;
      case 'newest':
      default:
        sortOption = { created_at: -1 };
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const totalProducts = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / parseInt(limit));

    // Get products
    const products = await Product.find(query)
      .populate('category_id', 'name slug')
      .sort(sortOption)
      .limit(parseInt(limit))
      .skip(skip)
      .lean();

    res.json({
      success: true,
      products,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalProducts,
        limit: parseInt(limit),
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('[Shop] Error fetching products:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch products' });
  }
};

// ============================================
// GET SINGLE PRODUCT (API)
// ============================================
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id)
      .populate('category_id', 'name slug')
      .lean();

    if (!product || !product.is_active) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Increment view count
    await Product.findByIdAndUpdate(id, { $inc: { view_count: 1 } });

    // Get related products
    const relatedProducts = await Product.find({
      category_id: product.category_id,
      _id: { $ne: id },
      is_active: true
    })
      .limit(6)
      .lean();

    res.json({
      success: true,
      product,
      relatedProducts
    });
  } catch (error) {
    console.error('[Shop] Error fetching product:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch product' });
  }
};

// ============================================
// GET CATEGORIES (API)
// ============================================
const getCategories = async (req, res) => {
  try {
    const categoryTree = await Category.getCategoryTree();

    res.json({
      success: true,
      categories: categoryTree
    });
  } catch (error) {
    console.error('[Shop] Error fetching categories:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch categories' });
  }
};

// ============================================
// GET USER CART (API)
// ============================================
const getCart = async (req, res) => {
  try {
    const user = req.session?.user || { user_id: 'demo-user' };
    
    const cartItems = await Cart.getUserCart(user.user_id);
    const cartSummary = await Cart.calculateCartTotal(user.user_id);

    res.json({
      success: true,
      cartItems,
      summary: cartSummary
    });
  } catch (error) {
    console.error('[Shop] Error fetching cart:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch cart' });
  }
};

// ============================================
// ADD TO CART (API)
// ============================================
const addToCart = async (req, res) => {
  try {
    const user = req.session?.user || { user_id: 'demo-user' };
    const { product_id, quantity = 1, size, color } = req.body;

    if (!product_id) {
      return res.status(400).json({ success: false, message: 'Product ID required' });
    }

    // Check product exists and in stock
    const product = await Product.findById(product_id);
    if (!product || !product.is_active) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (product.stock_quantity < quantity) {
      return res.status(400).json({ success: false, message: 'Insufficient stock' });
    }

    // Check if item already in cart
    const existingItem = await Cart.findOne({ user_id: user.user_id, product_id });

    if (existingItem) {
      // Update quantity
      existingItem.quantity += quantity;
      await existingItem.save();
    } else {
      // Create new cart item
      await Cart.create({
        user_id: user.user_id,
        product_id,
        quantity,
        size,
        color
      });
    }

    const cartSummary = await Cart.calculateCartTotal(user.user_id);

    res.json({
      success: true,
      message: 'Added to cart successfully',
      cartCount: cartSummary.itemCount
    });
  } catch (error) {
    console.error('[Shop] Error adding to cart:', error);
    res.status(500).json({ success: false, message: 'Failed to add to cart' });
  }
};

// ============================================
// UPDATE CART ITEM (API)
// ============================================
const updateCartItem = async (req, res) => {
  try {
    const user = req.session?.user || { user_id: 'demo-user' };
    const { id } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({ success: false, message: 'Invalid quantity' });
    }

    const cartItem = await Cart.findOne({ _id: id, user_id: user.user_id }).populate('product_id');

    if (!cartItem) {
      return res.status(404).json({ success: false, message: 'Cart item not found' });
    }

    // Check stock
    if (cartItem.product_id.stock_quantity < quantity) {
      return res.status(400).json({ success: false, message: 'Insufficient stock' });
    }

    cartItem.quantity = quantity;
    await cartItem.save();

    const cartSummary = await Cart.calculateCartTotal(user.user_id);

    res.json({
      success: true,
      message: 'Cart updated',
      summary: cartSummary
    });
  } catch (error) {
    console.error('[Shop] Error updating cart:', error);
    res.status(500).json({ success: false, message: 'Failed to update cart' });
  }
};

// ============================================
// REMOVE FROM CART (API)
// ============================================
const removeFromCart = async (req, res) => {
  try {
    const user = req.session?.user || { user_id: 'demo-user' };
    const { id } = req.params;

    await Cart.deleteOne({ _id: id, user_id: user.user_id });

    const cartSummary = await Cart.calculateCartTotal(user.user_id);

    res.json({
      success: true,
      message: 'Item removed from cart',
      cartCount: cartSummary.itemCount
    });
  } catch (error) {
    console.error('[Shop] Error removing from cart:', error);
    res.status(500).json({ success: false, message: 'Failed to remove item' });
  }
};

// ============================================
// CHECKOUT (API)
// ============================================
const processCheckout = async (req, res) => {
  try {
    const user = req.session?.user || { user_id: 'demo-user', name: 'Demo User', email: 'demo@zenopay.com' };
    const { shipping_address, payment_method, promo_code } = req.body;

    // Validate shipping address
    if (!shipping_address || !shipping_address.name || !shipping_address.phone || !shipping_address.address_line1 || !shipping_address.city || !shipping_address.state || !shipping_address.pincode) {
      return res.status(400).json({ success: false, message: 'Complete shipping address required' });
    }

    // Get cart
    const cartItems = await Cart.getUserCart(user.user_id);
    if (cartItems.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    // Calculate totals
    const cartSummary = await Cart.calculateCartTotal(user.user_id);

    // Generate order number
    const orderNumber = await Order.generateOrderNumber();

    // Create order
    const order = await Order.create({
      user_id: user.user_id,
      order_number: orderNumber,
      total_amount: cartSummary.subtotal,
      discount_amount: 0,
      tax_amount: cartSummary.tax,
      shipping_fee: cartSummary.shipping,
      grand_total: cartSummary.total,
      payment_method,
      payment_status: payment_method === 'wallet' ? 'paid' : 'pending',
      order_status: 'processing',
      shipping_address,
      promo_code,
      paid_at: payment_method === 'wallet' ? Date.now() : null
    });

    // Create order items
    await OrderItem.createFromCart(order._id, cartItems);

    // Update product stock
    for (const item of cartItems) {
      await Product.findByIdAndUpdate(item.product._id, {
        $inc: { stock_quantity: -item.quantity }
      });
    }

    // Clear cart
    await Cart.deleteMany({ user_id: user.user_id });

    res.json({
      success: true,
      message: 'Order placed successfully',
      order_id: order._id,
      order_number: orderNumber
    });
  } catch (error) {
    console.error('[Shop] Error processing checkout:', error);
    res.status(500).json({ success: false, message: 'Failed to process checkout' });
  }
};

// ============================================
// GET USER ORDERS (API)
// ============================================
const getUserOrders = async (req, res) => {
  try {
    const user = req.session?.user || { user_id: 'demo-user' };
    const { status, page = 1, limit = 10 } = req.query;

    const query = { user_id: user.user_id };
    if (status) {
      query.order_status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const totalOrders = await Order.countDocuments(query);

    const orders = await Order.find(query)
      .sort({ ordered_at: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .lean();

    // Get items for each order
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const items = await OrderItem.find({ order_id: order._id }).limit(3).lean();
        return { ...order, items };
      })
    );

    res.json({
      success: true,
      orders: ordersWithItems,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalOrders / parseInt(limit)),
        totalOrders
      }
    });
  } catch (error) {
    console.error('[Shop] Error fetching orders:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch orders' });
  }
};

// ============================================
// GET ORDER DETAILS (API)
// ============================================
const getOrderById = async (req, res) => {
  try {
    const user = req.session?.user || { user_id: 'demo-user' };
    const { id } = req.params;

    const order = await Order.findOne({ _id: id, user_id: user.user_id }).lean();

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const items = await OrderItem.find({ order_id: order._id }).populate('product_id').lean();

    res.json({
      success: true,
      order: { ...order, items }
    });
  } catch (error) {
    console.error('[Shop] Error fetching order:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch order' });
  }
};

// ============================================
// CANCEL ORDER (API)
// ============================================
const cancelOrder = async (req, res) => {
  try {
    const user = req.session?.user || { user_id: 'demo-user' };
    const { id } = req.params;

    const order = await Order.findOne({ _id: id, user_id: user.user_id });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (!order.isCancellable()) {
      return res.status(400).json({ success: false, message: 'Order cannot be cancelled' });
    }

    await order.updateStatus('cancelled');

    // Restore stock
    const items = await OrderItem.find({ order_id: order._id });
    for (const item of items) {
      await Product.findByIdAndUpdate(item.product_id, {
        $inc: { stock_quantity: item.quantity }
      });
    }

    res.json({
      success: true,
      message: 'Order cancelled successfully'
    });
  } catch (error) {
    console.error('[Shop] Error cancelling order:', error);
    res.status(500).json({ success: false, message: 'Failed to cancel order' });
  }
};

module.exports = {
  getShop,
  getProducts,
  getProductById,
  getCategories,
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  processCheckout,
  getUserOrders,
  getOrderById,
  cancelOrder
};