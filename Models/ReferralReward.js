const mongoose = require('mongoose');

const referralRewardSchema = new mongoose.Schema({
  user_id: {
    type: String,
    required: true
  },
  referral_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Referral',
    required: true
  },
  reward_type: {
    type: String,
    enum: ['signup_bonus', 'transaction_bonus', 'milestone_bonus'],
    required: true
  },
  amount: {
    type: mongoose.Types.Decimal128,
    required: true,
    get: v => parseFloat(v.toString())
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'credited', 'withdrawn'],
    default: 'pending'
  },
  credited_at: {
    type: Date,
    default: null
  },
  transaction_id: {
    type: String,
    default: ''
  }
}, {
  timestamps: true,
  toJSON: { getters: true },
  toObject: { getters: true }
});

// Indexes
referralRewardSchema.index({ user_id: 1, status: 1 });
referralRewardSchema.index({ referral_id: 1 });
referralRewardSchema.index({ created_at: -1 });

// Method to calculate total rewards
referralRewardSchema.statics.calculateTotalRewards = async function(userId, status = null) {
  const match = { user_id: userId };
  if (status) match.status = status;
  
  const result = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        total: {
          $sum: { $toDouble: '$amount' }
        }
      }
    }
  ]);
  
  return result.length > 0 ? result[0].total : 0;
};

module.exports = mongoose.model('ReferralReward', referralRewardSchema);
