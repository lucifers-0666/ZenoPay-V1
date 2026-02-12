/**
 * Seed Privacy Policy Data
 * Run this script to populate the database with an initial privacy policy
 * Usage: node scripts/seed-privacy-policy.js
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const PrivacyPolicy = require('../Models/PrivacyPolicy');

const defaultSections = [
  {
    id: 1,
    title: "Introduction & Overview",
    content: "<p>At ZenoPay, we are committed to protecting your privacy and ensuring you have a positive experience on our platform. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services.</p>",
    order: 1
  },
  {
    id: 2,
    title: "Information We Collect",
    content: "<p>We collect information from you in several ways, including:</p><ul><li><strong>Personal Information:</strong> Name, email address, phone number, date of birth, and identification documents</li><li><strong>Account Information:</strong> Username, password, payment method, and transaction history</li><li><strong>Device Information:</strong> IP address, browser type, and device identifiers</li><li><strong>Usage Data:</strong> Pages visited, time spent on pages, and interactions with our platform</li></ul>",
    order: 2
  },
  {
    id: 3,
    title: "How We Collect Information",
    content: "<p>We collect information through:</p><ul><li>Direct interactions (registration forms, customer support)</li><li>Automated technologies (cookies, pixel tags, analytics)</li><li>Third-party partners and service providers</li><li>Payment processors and financial institutions</li></ul>",
    order: 3
  },
  {
    id: 4,
    title: "How We Use Your Information",
    content: "<p>We use the information we collect to:</p><ul><li>Provide, maintain, and improve our services</li><li>Process transactions and send related information</li><li>Prevent fraudulent activities and enhance security</li><li>Send promotional communications (with your consent)</li><li>Comply with legal obligations</li><li>Conduct research and analytics</li></ul>",
    order: 4
  },
  {
    id: 5,
    title: "Information Sharing & Disclosure",
    content: "<p>We do not sell your personal information. We may share information with:</p><ul><li>Service providers who assist us in operations</li><li>Payment processors and financial institutions</li><li>Law enforcement when required by law</li><li>Business partners (with your consent)</li></ul>",
    order: 5
  },
  {
    id: 6,
    title: "Data Security Measures",
    content: "<p>We implement comprehensive security measures including:</p><ul><li>SSL/TLS encryption for data in transit</li><li>AES-256 encryption for sensitive data at rest</li><li>Regular security audits and penetration testing</li><li>Access controls and role-based permissions</li><li>Multi-factor authentication for accounts</li></ul>",
    order: 6
  },
  {
    id: 7,
    title: "Data Retention & Deletion",
    content: "<p>We retain your personal information for as long as necessary to provide our services and comply with legal obligations. You may request deletion of your account and associated data at any time by contacting our Data Protection Officer. Some information may be retained for legal compliance or to prevent fraud.</p>",
    order: 7
  },
  {
    id: 8,
    title: "Your Rights & Choices",
    content: "<p>You have the following rights:</p><ul><li><strong>Access:</strong> Request a copy of your personal data</li><li><strong>Correction:</strong> Update or correct inaccurate information</li><li><strong>Deletion:</strong> Request erasure of your data (Right to be Forgotten)</li><li><strong>Portability:</strong> Receive your data in a structured format</li><li><strong>Opt-Out:</strong> Unsubscribe from marketing communications</li></ul>",
    order: 8
  },
  {
    id: 9,
    title: "Cookies & Tracking Technologies",
    content: "<p>We use cookies and similar technologies to:</p><ul><li>Remember your preferences</li><li>Understand how you use our platform</li><li>Enhance security and detect fraud</li><li>Deliver personalized content</li></ul><p>You can control cookie preferences through your browser settings. However, disabling cookies may affect functionality.</p>",
    order: 9
  },
  {
    id: 10,
    title: "Third-Party Links & Services",
    content: "<p>Our platform may contain links to third-party websites and services. We are not responsible for their privacy practices. We encourage you to review their privacy policies before providing personal information.</p>",
    order: 10
  },
  {
    id: 11,
    title: "International Data Transfers",
    content: "<p>ZenoPay operates globally. Your information may be transferred to, stored in, and processed in countries other than your country of residence. These countries may have different data protection laws. By using our services, you consent to such transfers.</p>",
    order: 11
  },
  {
    id: 12,
    title: "Children's Privacy",
    content: "<p>ZenoPay services are not directed to individuals under 18 years old. We do not knowingly collect personal information from children under 18. If we learn we have collected information from a child under 18, we will delete such data promptly.</p>",
    order: 12
  },
  {
    id: 13,
    title: "Marketing Communications",
    content: "<p>With your consent, we may send you promotional emails, newsletters, and marketing materials. You can unsubscribe from marketing communications at any time by clicking the 'Unsubscribe' link in any email or by updating your preferences in your account settings.</p>",
    order: 13
  },
  {
    id: 14,
    title: "Changes to Privacy Policy",
    content: "<p>We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the 'Last Updated' date. Your continued use of our services constitutes your acceptance of the updated Privacy Policy.</p>",
    order: 14
  },
  {
    id: 15,
    title: "Contact & Data Protection Officer",
    content: "<p><strong>Data Protection Officer:</strong> dpo@zenopay.com</p><p><strong>Privacy Team:</strong> privacy@zenopay.com</p><p><strong>Mailing Address:</strong></p><p>ZenoPay Technologies Inc.<br>123 Financial District<br>San Francisco, CA 94111<br>United States</p><p>If you have any questions or concerns about our privacy practices, please contact us using the information above.</p>",
    order: 15
  }
];

async function seedPrivacyPolicy() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('❌ Error: MONGO_URI or MONGODB_URI environment variable not set');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Check if policy already exists
    const existingPolicy = await PrivacyPolicy.findOne({ version: '1.0' });
    
    if (existingPolicy) {
      console.log('⚠️  Privacy Policy v1.0 already exists in database');
      console.log('📋 Existing policy:');
      console.log(`   - Version: ${existingPolicy.version}`);
      console.log(`   - Status: ${existingPolicy.status}`);
      console.log(`   - Published: ${existingPolicy.isCurrent}`);
      
      if (process.argv[2] === '--force') {
        console.log('🔄 Force flag detected, updating existing policy...');
        existingPolicy.sections = defaultSections;
        existingPolicy.status = 'published';
        existingPolicy.isCurrent = true;
        existingPolicy.publishedDate = new Date();
        await existingPolicy.save();
        console.log('✅ Privacy Policy updated successfully');
      } else {
        console.log('💡 Tip: Use "node scripts/seed-privacy-policy.js --force" to update existing policy');
      }
    } else {
      // Create new privacy policy
      const privacyPolicy = new PrivacyPolicy({
        version: '1.0',
        effectiveDate: new Date(),
        sections: defaultSections,
        status: 'published',
        isCurrent: true,
        publishedDate: new Date(),
        metaTitle: 'Privacy Policy - ZenoPay',
        metaDescription: 'Learn how ZenoPay collects, uses, and protects your personal data.',
        changeSummary: 'Initial Privacy Policy v1.0'
      });

      await privacyPolicy.save();
      console.log('✅ Privacy Policy created successfully');
      console.log('📋 Created policy:');
      console.log(`   - Version: ${privacyPolicy.version}`);
      console.log(`   - Sections: ${privacyPolicy.sections.length}`);
      console.log(`   - Status: ${privacyPolicy.status}`);
      console.log(`   - ID: ${privacyPolicy._id}`);
    }

    console.log('\n✨ Privacy Policy seed complete!');
    console.log('🌐 Visit: http://localhost:3000/privacy-policy');
    
  } catch (error) {
    console.error('❌ Error seeding privacy policy:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

// Run the seed
seedPrivacyPolicy();
