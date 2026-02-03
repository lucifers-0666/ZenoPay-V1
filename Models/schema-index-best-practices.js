/**
 * MONGOOSE SCHEMA INDEX - BEST PRACTICES
 * 
 * This file demonstrates correct index patterns to avoid duplicate index warnings.
 */

const mongoose = require('mongoose');

// ============================================================================
// WHY THE WARNING OCCURS:
// ============================================================================
// Mongoose throws "Duplicate schema index" warning when you define the SAME
// index in TWO places:
//   1. Field definition: { index: true } or { unique: true }
//   2. Schema index: schema.index({ field: 1 })
//
// This creates redundant indexes in MongoDB, wasting resources.

// ============================================================================
// ❌ WRONG - CAUSES DUPLICATE INDEX WARNING
// ============================================================================

const badUserSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,      // ❌ Creates index
    index: true        // ❌ DUPLICATE - Don't do this with unique
  },
  username: {
    type: String,
    index: true        // ❌ Creates index
  },
  status: String
});

// ❌ This creates DUPLICATE indexes
badUserSchema.index({ username: 1 });  // Duplicate with field-level index
badUserSchema.index({ email: 1 });     // unique already creates index

// ============================================================================
// ✅ CORRECT - BEST PRACTICE #1: USE SCHEMA-LEVEL INDEXES (RECOMMENDED)
// ============================================================================

const goodUserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true
    // ✅ NO index or unique here - we'll define it below
  },
  username: {
    type: String,
    required: true
    // ✅ NO index here
  },
  status: {
    type: String,
    enum: ['active', 'inactive']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// ✅ Define ALL indexes here (more flexible and visible)
goodUserSchema.index({ email: 1 }, { unique: true });        // Unique index
goodUserSchema.index({ username: 1 });                       // Simple index
goodUserSchema.index({ status: 1 });                         // Simple index
goodUserSchema.index({ username: 1, status: 1 });            // Compound index
goodUserSchema.index({ createdAt: -1 });                     // Descending order

// ============================================================================
// ✅ CORRECT - BEST PRACTICE #2: USE FIELD-LEVEL FOR UNIQUE ONLY
// ============================================================================

const mixedUserSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true      // ✅ OK - unique fields can use field-level
  },
  username: {
    type: String      // ✅ No index here
  },
  status: String
});

// ✅ Only define non-unique indexes here
mixedUserSchema.index({ username: 1 });
mixedUserSchema.index({ status: 1 });

// ============================================================================
// WHEN TO USE schema.index() INSTEAD OF FIELD-LEVEL:
// ============================================================================

const advancedSchema = new mongoose.Schema({
  userId: String,
  productId: String,
  category: String,
  price: Number,
  name: String,
  description: String,
  tags: [String],
  createdAt: Date,
  status: String
});

// 1. ✅ COMPOUND INDEXES (multiple fields together)
advancedSchema.index({ userId: 1, createdAt: -1 });

// 2. ✅ TEXT SEARCH INDEXES
advancedSchema.index({ name: 'text', description: 'text', tags: 'text' });

// 3. ✅ CONDITIONAL INDEXES (with options)
advancedSchema.index({ status: 1 }, { 
  sparse: true,              // Only index documents with this field
  partialFilterExpression: { status: { $exists: true } }
});

// 4. ✅ TTL INDEXES (auto-delete old documents)
advancedSchema.index({ createdAt: 1 }, { 
  expireAfterSeconds: 2592000  // 30 days
});

// 5. ✅ INDEXES WITH CUSTOM COLLATION
advancedSchema.index({ name: 1 }, {
  collation: { locale: 'en', strength: 2 }  // Case-insensitive
});

// 6. ✅ BACKGROUND INDEXES (for large collections)
advancedSchema.index({ category: 1, price: 1 }, {
  background: true  // Don't block other operations
});

// ============================================================================
// CORRECTED RECEIPT SCHEMA (from your project)
// ============================================================================

const receiptSchema = new mongoose.Schema({
  receipt_number: {
    type: String,
    required: true,
    unique: true     // ✅ unique is OK at field level
  },
  transaction_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TransactionHistory',
    required: true
  },
  user_id: {
    type: String,
    required: true   // ✅ NO index: true here
  },
  transaction_date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['success', 'pending', 'failed'],
    default: 'success'
  }
}, {
  timestamps: true
});

// ✅ All indexes defined here
receiptSchema.index({ user_id: 1, transaction_date: -1 });
receiptSchema.index({ transaction_id: 1 });
receiptSchema.index({ status: 1 });
// Note: receipt_number index created automatically by unique: true

// ============================================================================
// CORRECTED REFERRAL SCHEMA (from your project)
// ============================================================================

const referralSchema = new mongoose.Schema({
  referrer_id: {
    type: String,
    required: true   // ✅ NO index: true
  },
  referral_code: {
    type: String,
    required: true,
    unique: true,    // ✅ unique is OK
    uppercase: true
  },
  referral_link: {
    type: String,
    required: true,
    unique: true     // ✅ unique is OK
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'expired'],
    default: 'pending'
  }
}, {
  timestamps: true
});

// ✅ All non-unique indexes here
referralSchema.index({ referrer_id: 1, status: 1 });
referralSchema.index({ createdAt: -1 });
// Note: referral_code and referral_link indexes created by unique: true

// ============================================================================
// PERFORMANCE TIPS
// ============================================================================

// 1. Order matters in compound indexes
//    { userId: 1, date: -1 } is NOT the same as { date: -1, userId: 1 }

// 2. Put most selective fields first in compound indexes
//    { userId: 1, status: 1 } - userId is more selective

// 3. Limit number of indexes (each index slows writes)
//    Aim for 5-10 indexes per collection maximum

// 4. Use explain() to verify index usage
//    Model.find({ userId: 'x' }).explain('executionStats')

// 5. Drop unused indexes
//    db.collection.dropIndex('index_name')

// ============================================================================
// SUMMARY
// ============================================================================

// RULE 1: Never use both field-level AND schema.index() for same field
// RULE 2: Prefer schema.index() for better visibility and flexibility
// RULE 3: Use field-level unique: true (it's clear and standard)
// RULE 4: Use schema.index() for compound, text, TTL, and conditional indexes
// RULE 5: Always document why each index exists

module.exports = {
  goodUserSchema,
  mixedUserSchema,
  advancedSchema,
  receiptSchema,
  referralSchema
};
