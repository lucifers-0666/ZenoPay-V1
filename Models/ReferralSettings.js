const mongoose = require('mongoose');

const referralSettingsSchema = new mongoose.Schema({
  signup_bonus_referrer: {
    type: mongoose.Types.Decimal128,
    default: 100,
    get: v => parseFloat(v.toString())
  },
  signup_bonus_referee: {
    type: mongoose.Types.Decimal128,
    default: 50,
    get: v => parseFloat(v.toString())
  },
  transaction_bonus: {
    type: mongoose.Types.Decimal128,
    default: 0,
    get: v => parseFloat(v.toString())
  },
  max_referrals: {
    type: Number,
    default: -1 // -1 means unlimited
  },
  min_transaction_for_reward: {
    type: mongoose.Types.Decimal128,
    default: 100,
    get: v => parseFloat(v.toString())
  },
  reward_expiry_days: {
    type: Number,
    default: 365
  },
  active: {
    type: Boolean,
    default: true
  },
  milestones: {
    type: [{
      count: Number,
      bonus: Number,
      description: String
    }],
    default: [
      { count: 5, bonus: 500, description: 'First 5 referrals bonus' },
      { count: 10, bonus: 1200, description: '10 referrals milestone' },
      { count: 25, bonus: 3500, description: '25 referrals champion' }
    ]
  }
}, {
  timestamps: true,
  toJSON: { getters: true },
  toObject: { getters: true }
});

// Static method to get current settings
referralSettingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  
  if (!settings) {
    settings = await this.create({});
  }
  
  return settings;
};

module.exports = mongoose.model('ReferralSettings', referralSettingsSchema);
