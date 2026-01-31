const mongoose = require('mongoose');
const Category = require('../Models/Category');
const Product = require('../Models/Product');
require('dotenv').config();

// MongoDB connection - Use environment variable
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/zenopay';

async function seedShopData() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('\n🗑️  Clearing existing shop data...');
    await Category.deleteMany({});
    await Product.deleteMany({});

    // Create categories
    console.log('\n📂 Creating categories...');
    const categories = await Category.insertMany([
      { name: 'Merchandise', slug: 'merchandise', icon: 'fas fa-tshirt', display_order: 1, description: 'ZenoPay branded merchandise' },
      { name: 'Digital Products', slug: 'digital-products', icon: 'fas fa-download', display_order: 2, description: 'E-books, courses, and digital content' },
      { name: 'Gift Cards', slug: 'gift-cards', icon: 'fas fa-gift', display_order: 3, description: 'ZenoPay gift cards' },
      { name: 'Accessories', slug: 'accessories', icon: 'fas fa-gem', display_order: 4, description: 'Stickers, keychains, and more' },
      { name: 'Electronics', slug: 'electronics', icon: 'fas fa-mobile-alt', display_order: 5, description: 'Payment terminals and devices' }
    ]);
    console.log(`✅ Created ${categories.length} categories`);

    // Create products
    console.log('\n🛍️  Creating products...');
    
    const merchandiseCat = categories.find(c => c.slug === 'merchandise')._id;
    const digitalCat = categories.find(c => c.slug === 'digital-products')._id;
    const giftCardCat = categories.find(c => c.slug === 'gift-cards')._id;
    const accessoriesCat = categories.find(c => c.slug === 'accessories')._id;
    const electronicsCat = categories.find(c => c.slug === 'electronics')._id;

    const products = [
      // Merchandise
      {
        name: 'ZenoPay Classic T-Shirt',
        description: 'Premium cotton t-shirt with ZenoPay logo. Available in multiple sizes and colors. Comfortable fit for everyday wear.',
        category_id: merchandiseCat,
        price: 799,
        sale_price: 599,
        stock_quantity: 50,
        sku: 'ZP-TSHIRT-001',
        images: ['/Images/tshirt.jpg'],
        is_digital: false,
        featured: true,
        tags: ['clothing', 'casual', 'branded'],
        rating: 4.5,
        review_count: 24
      },
      {
        name: 'ZenoPay Premium Hoodie',
        description: 'Cozy hoodie with embroidered ZenoPay logo. Perfect for cold weather. Made from high-quality fleece material.',
        category_id: merchandiseCat,
        price: 1999,
        sale_price: 1499,
        stock_quantity: 30,
        sku: 'ZP-HOODIE-001',
        images: ['/Images/hoodie.jpg'],
        is_digital: false,
        featured: true,
        tags: ['clothing', 'winter', 'branded'],
        rating: 4.8,
        review_count: 18
      },
      {
        name: 'ZenoPay Coffee Mug',
        description: 'Ceramic coffee mug with ZenoPay branding. Dishwasher and microwave safe. 350ml capacity.',
        category_id: merchandiseCat,
        price: 399,
        stock_quantity: 100,
        sku: 'ZP-MUG-001',
        images: ['/Images/mug.jpg'],
        is_digital: false,
        tags: ['drinkware', 'office', 'branded'],
        rating: 4.2,
        review_count: 45
      },
      
      // Digital Products
      {
        name: 'Digital Payment Masterclass',
        description: 'Complete video course on digital payments, fintech, and online transactions. 10+ hours of content with lifetime access.',
        category_id: digitalCat,
        price: 2999,
        sale_price: 1999,
        stock_quantity: 9999,
        sku: 'ZP-COURSE-001',
        images: ['/Images/course.jpg'],
        is_digital: true,
        featured: true,
        tags: ['education', 'fintech', 'online'],
        rating: 4.9,
        review_count: 156
      },
      {
        name: 'Fintech Security E-book',
        description: 'Comprehensive guide to securing digital payments and protecting financial data. PDF format, 250+ pages.',
        category_id: digitalCat,
        price: 599,
        sale_price: 299,
        stock_quantity: 9999,
        sku: 'ZP-EBOOK-001',
        images: ['/Images/ebook.jpg'],
        is_digital: true,
        tags: ['education', 'security', 'pdf'],
        rating: 4.6,
        review_count: 89
      },
      
      // Gift Cards
      {
        name: 'ZenoPay Gift Card - ₹500',
        description: 'Digital gift card worth ₹500. Can be redeemed on ZenoPay for any service. Instant delivery via email.',
        category_id: giftCardCat,
        price: 500,
        stock_quantity: 9999,
        sku: 'ZP-GIFT-500',
        images: ['/Images/giftcard.jpg'],
        is_digital: true,
        tags: ['gift', 'digital', 'instant'],
        rating: 5.0,
        review_count: 203
      },
      {
        name: 'ZenoPay Gift Card - ₹1000',
        description: 'Digital gift card worth ₹1000. Perfect gift for friends and family. No expiry date.',
        category_id: giftCardCat,
        price: 1000,
        stock_quantity: 9999,
        sku: 'ZP-GIFT-1000',
        images: ['/Images/giftcard.jpg'],
        is_digital: true,
        featured: true,
        tags: ['gift', 'digital', 'instant'],
        rating: 5.0,
        review_count: 178
      },
      
      // Accessories
      {
        name: 'ZenoPay Sticker Pack',
        description: 'Set of 10 waterproof vinyl stickers featuring ZenoPay designs. Perfect for laptops, water bottles, and more.',
        category_id: accessoriesCat,
        price: 199,
        sale_price: 149,
        stock_quantity: 200,
        sku: 'ZP-STICKER-001',
        images: ['/Images/stickers.jpg'],
        is_digital: false,
        tags: ['stickers', 'vinyl', 'branded'],
        rating: 4.7,
        review_count: 67
      },
      {
        name: 'ZenoPay Premium Keychain',
        description: 'Metal keychain with ZenoPay logo. Durable and stylish. Makes a great accessory.',
        category_id: accessoriesCat,
        price: 299,
        stock_quantity: 150,
        sku: 'ZP-KEYCHAIN-001',
        images: ['/Images/keychain.jpg'],
        is_digital: false,
        tags: ['accessories', 'metal', 'branded'],
        rating: 4.4,
        review_count: 34
      },
      
      // Electronics
      {
        name: 'ZenoPay Mobile POS Terminal',
        description: 'Portable card reader for accepting payments anywhere. Bluetooth connectivity, long battery life, accepts all major cards.',
        category_id: electronicsCat,
        price: 4999,
        sale_price: 3999,
        stock_quantity: 25,
        sku: 'ZP-POS-001',
        images: ['/Images/pos.jpg'],
        is_digital: false,
        featured: true,
        tags: ['electronics', 'pos', 'business'],
        rating: 4.8,
        review_count: 92,
        specifications: new Map([
          ['Connectivity', 'Bluetooth 5.0'],
          ['Battery Life', '8 hours'],
          ['Card Types', 'All major cards + NFC'],
          ['Dimensions', '12cm × 7cm × 2cm'],
          ['Weight', '180g']
        ])
      },
      {
        name: 'ZenoPay QR Code Stand',
        description: 'Acrylic display stand for QR codes. Perfect for retail counters. Includes customizable QR code card.',
        category_id: electronicsCat,
        price: 499,
        stock_quantity: 80,
        sku: 'ZP-QRSTAND-001',
        images: ['/Images/qr-stand.jpg'],
        is_digital: false,
        tags: ['accessories', 'qr', 'business'],
        rating: 4.3,
        review_count: 28
      },
      
      // More products for variety
      {
        name: 'ZenoPay Laptop Sleeve',
        description: '13-15 inch laptop sleeve with premium padding. ZenoPay branding on front. Water-resistant material.',
        category_id: accessoriesCat,
        price: 1299,
        sale_price: 999,
        stock_quantity: 40,
        sku: 'ZP-SLEEVE-001',
        images: ['/Images/laptop-sleeve.jpg'],
        is_digital: false,
        tags: ['accessories', 'laptop', 'protection'],
        rating: 4.6,
        review_count: 41
      },
      {
        name: 'ZenoPay Cap',
        description: 'Baseball cap with embroidered ZenoPay logo. Adjustable strap, one size fits all. Available in multiple colors.',
        category_id: merchandiseCat,
        price: 599,
        sale_price: 449,
        stock_quantity: 60,
        sku: 'ZP-CAP-001',
        images: ['/Images/cap.jpg'],
        is_digital: false,
        tags: ['clothing', 'headwear', 'branded'],
        rating: 4.4,
        review_count: 31
      },
      {
        name: 'Payment Gateway Integration Guide',
        description: 'Technical documentation for integrating ZenoPay into your platform. Includes code samples and best practices.',
        category_id: digitalCat,
        price: 999,
        sale_price: 499,
        stock_quantity: 9999,
        sku: 'ZP-GUIDE-001',
        images: ['/Images/guide.jpg'],
        is_digital: true,
        tags: ['education', 'technical', 'development'],
        rating: 4.7,
        review_count: 73
      },
      {
        name: 'ZenoPay Water Bottle',
        description: 'Stainless steel water bottle, 750ml capacity. Keeps drinks cold for 24hrs, hot for 12hrs. BPA-free.',
        category_id: merchandiseCat,
        price: 899,
        stock_quantity: 70,
        sku: 'ZP-BOTTLE-001',
        images: ['/Images/bottle.jpg'],
        is_digital: false,
        tags: ['drinkware', 'stainless', 'branded'],
        rating: 4.5,
        review_count: 52
      }
    ];

    const createdProducts = await Product.insertMany(products);
    console.log(`✅ Created ${createdProducts.length} products`);

    console.log('\n✅ Shop data seeded successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Categories: ${categories.length}`);
    console.log(`   Products: ${createdProducts.length}`);
    console.log(`   Featured Products: ${createdProducts.filter(p => p.featured).length}`);
    console.log(`   Digital Products: ${createdProducts.filter(p => p.is_digital).length}`);
    console.log(`   Physical Products: ${createdProducts.filter(p => !p.is_digital).length}`);
    console.log(`   Products on Sale: ${createdProducts.filter(p => p.sale_price).length}`);
    
    console.log('\n🚀 You can now access the shop at: http://localhost:3000/shop');

  } catch (error) {
    console.error('❌ Error seeding shop data:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
    process.exit(0);
  }
}

seedShopData();
