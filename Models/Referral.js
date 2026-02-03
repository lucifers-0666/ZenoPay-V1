const mongoose = require('mongoose');

const referralSchema = new mongoose.Schema({
  referrer_id: {
    type: String,
    required: true
  },
  referee_id: {
    type: String,
    default: null
  },
  referral_code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  referral_link: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'expired'],
    default: 'pending'
  },
  signed_up_at: {
    type: Date,
    default: null
  },
  first_transaction_at: {
    type: Date,
    default: null
  },
  reward_earned: {
    type: mongoose.Types.Decimal128,
    default: 0,
    get: v => v ? parseFloat(v.toString()) : 0
  },
  reward_status: {
    type: String,
    enum: ['pending', 'credited', 'cancelled'],
    default: 'pending'
  },
  referee_email: {
    type: String,
    default: ''
  },
  referee_name: {
    type: String,
    default: ''
  },
  click_count: {
    type: Number,
    default: 0
  },
  last_clicked_at: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { getters: true },
  toObject: { getters: true }
});

// Indexes
referralSchema.index({ referrer_id: 1, status: 1 });
referralSchema.index({ created_at: -1 });

// Static method to generate unique referral code
referralSchema.statics.generateReferralCode = async function(userName) {
  const baseName = userName.replace(/[^a-zA-Z]/g, '').substring(0, 6).toUpperCase();
  let code = baseName + Math.floor(1000 + Math.random() * 9000);
  
  // Check uniqueness
  let exists = await this.findOne({ referral_code: code });
  let attempts = 0;
  
  while (exists && attempts < 10) {
    code = baseName + Math.floor(1000 + Math.random() * 9000);
    exists = await this.findOne({ referral_code: code });
    attempts++;
  }
  
  if (exists) {
    // Fallback to completely random
    code = 'REF' + Math.floor(100000 + Math.random() * 900000);
  }
  
  return code;
};

// Method to check if code is valid for custom code
referralSchema.statics.isCodeAvailable = async function(code) {
  const exists = await this.findOne({ referral_code: code.toUpperCase() });
  return !exists;
};

module.exports = mongoose.model('Referral', referralSchema);
