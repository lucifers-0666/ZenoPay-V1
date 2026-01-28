// Referral Program Controller
const ZenoPayUser = require('../Models/ZenoPayUser');

// Mock referral data
const referralData = {
  referralCode: 'ZENO-DEMO2024',
  referralLink: 'https://zenopay.com/ref/ZENO-DEMO2024',
  rewardPerReferral: 10.00,
  stats: {
    totalReferrals: 15,
    successfulSignups: 12,
    pendingRewards: 30.00,
    totalEarned: 90.00,
    availableBalance: 60.00
  },
  referrals: [
    {
      id: 1,
      friendName: 'John D.',
      status: 'rewarded',
      dateReferred: new Date('2025-01-15'),
      rewardAmount: 10.00
    },
    {
      id: 2,
      friendName: 'Jane S.',
      status: 'rewarded',
      dateReferred: new Date('2025-01-10'),
      rewardAmount: 10.00
    },
    {
      id: 3,
      friendName: 'Mike R.',
      status: 'verified',
      dateReferred: new Date('2025-01-20'),
      rewardAmount: 10.00
    },
    {
      id: 4,
      friendName: 'Sarah L.',
      status: 'signed-up',
      dateReferred: new Date('2025-01-25'),
      rewardAmount: 0
    },
    {
      id: 5,
      friendName: 'Friend',
      status: 'pending',
      dateReferred: new Date('2025-01-27'),
      rewardAmount: 0
    }
  ],
  rewardHistory: [
    {
      date: new Date('2025-01-16'),
      description: 'Referral reward - John D.',
      amount: 10.00,
      type: 'credit'
    },
    {
      date: new Date('2025-01-11'),
      description: 'Referral reward - Jane S.',
      amount: 10.00,
      type: 'credit'
    },
    {
      date: new Date('2025-01-05'),
      description: 'Reward redeemed to wallet',
      amount: -20.00,
      type: 'debit'
    }
  ],
  leaderboard: [
    { rank: 1, name: 'SuperReferrer', referrals: 156 },
    { rank: 2, name: 'PromoKing', referrals: 142 },
    { rank: 3, name: 'ShareMaster', referrals: 128 },
    { rank: 18, name: 'You', referrals: 12, isCurrentUser: true }
  ]
};

exports.getReferralPage = async (req, res) => {
  try {
    res.render('referral-program', {
      pageTitle: 'Referral Program - ZenoPay',
      referralData
    });
  } catch (error) {
    console.error('Error loading referral page:', error);
    res.status(500).send('Error loading referral page');
  }
};

exports.shareReferral = async (req, res) => {
  try {
    const { method, recipient } = req.body;
    
    // TODO: Implement sharing logic
    console.log(`Sharing referral via ${method} to ${recipient}`);
    
    res.json({
      success: true,
      message: `Referral shared via ${method}`
    });
  } catch (error) {
    console.error('Error sharing referral:', error);
    res.status(500).json({ success: false, message: 'Failed to share referral' });
  }
};

exports.redeemRewards = async (req, res) => {
  try {
    const { amount, method } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount'
      });
    }
    
    if (amount > referralData.stats.availableBalance) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance'
      });
    }
    
    // TODO: Process redemption
    console.log(`Redeeming ${amount} via ${method}`);
    
    res.json({
      success: true,
      message: 'Rewards redeemed successfully',
      newBalance: referralData.stats.availableBalance - amount
    });
  } catch (error) {
    console.error('Error redeeming rewards:', error);
    res.status(500).json({ success: false, message: 'Failed to redeem rewards' });
  }
};

exports.trackReferralClick = async (req, res) => {
  try {
    const { referralCode } = req.params;
    
    // TODO: Track referral click
    console.log(`Referral click tracked: ${referralCode}`);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error tracking referral:', error);
    res.status(500).json({ success: false });
  }
};
