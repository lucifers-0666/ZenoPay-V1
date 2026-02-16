#!/usr/bin/env node

/**
 * ZenoPay Blog Initialization Script
 * Seed initial categories, tags, and admin user setup
 * Run: node scripts/seed-blog-data.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const BlogCategory = require('../Models/BlogCategory');
const BlogTag = require('../Models/BlogTag');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/zenpay';

const categories = [
  {
    name: 'Payment Solutions',
    slug: 'payment-solutions',
    description: 'How-to guides, tutorials, and best practices for accepting payments',
    color: '#2196F3',
    display_order: 1,
  },
  {
    name: 'Security & Compliance',
    slug: 'security-compliance',
    description: 'KYC requirements, fraud prevention, and regulatory compliance',
    color: '#FF9800',
    display_order: 2,
  },
  {
    name: 'Industry News',
    slug: 'industry-news',
    description: 'Latest fintech trends, company updates, and market insights',
    color: '#4CAF50',
    display_order: 3,
  },
  {
    name: 'Product Updates',
    slug: 'product-updates',
    description: 'New features, releases, and changelog announcements',
    color: '#9C27B0',
    display_order: 4,
  },
  {
    name: 'Case Studies',
    slug: 'case-studies',
    description: 'Customer success stories and real-world implementations',
    color: '#FF5722',
    display_order: 5,
  },
  {
    name: 'Developer Guides',
    slug: 'developer-guides',
    description: 'API tutorials, integration docs, and technical guides',
    color: '#00BCD4',
    display_order: 6,
  },
  {
    name: 'Business Tips',
    slug: 'business-tips',
    description: 'Financial management, scaling advice, and merchant strategies',
    color: '#8BC34A',
    display_order: 7,
  },
];

const tags = [
  { name: 'UPI', slug: 'upi' },
  { name: 'NEFT', slug: 'neft' },
  { name: 'RTGS', slug: 'rtgs' },
  { name: 'IMPS', slug: 'imps' },
  { name: 'Payment Gateway', slug: 'payment-gateway' },
  { name: 'Digital Wallet', slug: 'digital-wallet' },
  { name: 'KYC', slug: 'kyc' },
  { name: 'AML', slug: 'aml' },
  { name: 'Compliance', slug: 'compliance' },
  { name: 'API Integration', slug: 'api-integration' },
  { name: 'Webhooks', slug: 'webhooks' },
  { name: 'Mobile Payments', slug: 'mobile-payments' },
  { name: 'QR Codes', slug: 'qr-codes' },
  { name: 'Merchant Solutions', slug: 'merchant-solutions' },
  { name: 'POS', slug: 'pos' },
  { name: 'Fintech', slug: 'fintech' },
  { name: 'Startups', slug: 'startups' },
  { name: 'Fraud Prevention', slug: 'fraud-prevention' },
  { name: 'Security', slug: 'security' },
  { name: 'E-commerce', slug: 'e-commerce' },
];

async function seedBlogData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✓ Connected to MongoDB');

    // Check if data already exists
    const existingCategories = await BlogCategory.countDocuments();
    const existingTags = await BlogTag.countDocuments();

    if (existingCategories > 0) {
      console.log(`⚠️  Blog categories already exist (${existingCategories} categories found)`);
    } else {
      // Seed categories
      await BlogCategory.insertMany(categories);
      console.log(`✓ Seeded ${categories.length} blog categories`);
    }

    if (existingTags > 0) {
      console.log(`⚠️  Blog tags already exist (${existingTags} tags found)`);
    } else {
      // Seed tags
      await BlogTag.insertMany(tags);
      console.log(`✓ Seeded ${tags.length} blog tags`);
    }

    console.log('\n✅ Blog initialization complete!');
    console.log('\nNext steps:');
    console.log('1. Create admin users for blog management');
    console.log('2. Create initial blog posts');
    console.log('3. Start publishing content');

  } catch (error) {
    console.error('❌ Error seeding blog data:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the seeding script
seedBlogData();
