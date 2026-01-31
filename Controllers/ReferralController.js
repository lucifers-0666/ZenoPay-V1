// Referral Program Controller
const ZenoPayUser = require('../Models/ZenoPayUser');
const Referral = require('../Models/Referral');
const ReferralReward = require('../Models/ReferralReward');
const ReferralSettings = require('../Models/ReferralSettings');
const EmailService = require('../Services/EmailService');

// GET /referral - Main referral program page
exports.getReferralPage = async (req, res) => {
  try {
    console.log('[Referral] Page requested');
    const userId = req.session?.user?.ZenoPayID || 'demo-user';
    
    // Get user's referral code or create one
    let userReferral = null;
    let stats = {
      totalReferrals: 0,
      successfulSignups: 0,
      pendingSignups: 0,
      totalRewardsEarned: 0
    };
    
    if (userId !== 'demo-user') {
      try {
        userReferral = await Referral.findOne({ referrer_id: userId });
        
        if (!userReferral) {
          // Create referral code for user
          const user = await ZenoPayUser.findOne({ ZenoPayID: userId });
          const code = await Referral.generateReferralCode(user?.FullName || 'User');
          const link = `${process.env.BASE_URL || 'http://localhost:3000'}/ref/${code}`;
          
          userReferral = await Referral.create({
            referrer_id: userId,
            referral_code: code,
            referral_link: link
          });
        }
        
        // Get statistics
        const allReferrals = await Referral.find({ referrer_id: userId });
        stats.totalReferrals = allReferrals.length;
        stats.successfulSignups = allReferrals.filter(r => r.status === 'completed').length;
        stats.pendingSignups = allReferrals.filter(r => r.status === 'pending').length;
        
        stats.totalRewardsEarned = await ReferralReward.calculateTotalRewards(userId, 'credited');
      } catch (error) {
        console.error('[Referral] Error loading data:', error);
      }
    } else {
      // Demo data
      stats = {
        totalReferrals: 15,
        successfulSignups: 12,
        pendingSignups: 3,
        totalRewardsEarned: 1200
      };
    }
    
    // Get settings
    const settings = await ReferralSettings.getSettings();
    
    res.render('referral-program', {
      pageTitle: 'Referral Program - ZenoPay',
      user: req.session?.user || { FullName: 'Demo User', ZenoPayID: 'demo-user' },
      referralCode: userReferral?.referral_code || 'DEMO2026',
      referralLink: userReferral?.referral_link || 'http://localhost:3000/ref/DEMO2026',
      stats: stats,
      settings: settings
    });
  } catch (error) {
    console.error('[Referral] CRITICAL ERROR:', error);
    res.status(500).render('error-500');
  }
};

// GET /api/referral/code - Get user's referral code
exports.getReferralCode = async (req, res) => {
  try {
    const userId = req.session?.user?.ZenoPayID || 'demo-user';
    
    let referral = await Referral.findOne({ referrer_id: userId });
    
    if (!referral) {
      const user = await ZenoPayUser.findOne({ ZenoPayID: userId });
      const code = await Referral.generateReferralCode(user?.FullName || 'User');
      const link = `${process.env.BASE_URL || 'http://localhost:3000'}/ref/${code}`;
      
      referral = await Referral.create({
        referrer_id: userId,
        referral_code: code,
        referral_link: link
      });
    }
    
    const settings = await ReferralSettings.getSettings();
    
    res.json({
      success: true,
      code: referral.referral_code,
      link: referral.referral_link,
      share_message: `Join me on ZenoPay and get ₹${settings.signup_bonus_referee} free! Use my code: ${referral.referral_code} or click: ${referral.referral_link}`
    });
  } catch (error) {
    console.error('[Referral] Error getting code:', error);
    res.status(500).json({ success: false, message: 'Error fetching referral code' });
  }
};

// POST /api/referral/generate-code - Generate custom code
exports.generateCustomCode = async (req, res) => {
  try {
    const userId = req.session?.user?.ZenoPayID || 'demo-user';
    const { custom_code } = req.body;
    
    if (!custom_code) {
      return res.status(400).json({ success: false, message: 'Custom code is required' });
    }
    
    // Validate code format
    const codeRegex = /^[A-Z0-9]{4,15}$/;
    if (!codeRegex.test(custom_code.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: 'Code must be 4-15 characters, alphanumeric only'
      });
    }
    
    // Check availability
    const isAvailable = await Referral.isCodeAvailable(custom_code);
    if (!isAvailable) {
      return res.status(400).json({
        success: false,
        message: 'This code is already taken'
      });
    }
    
    // Update referral code
    const link = `${process.env.BASE_URL || 'http://localhost:3000'}/ref/${custom_code.toUpperCase()}`;
    
    await Referral.findOneAndUpdate(
      { referrer_id: userId },
      {
        referral_code: custom_code.toUpperCase(),
        referral_link: link
      }
    );
    
    res.json({
      success: true,
      code: custom_code.toUpperCase(),
      link: link
    });
  } catch (error) {
    console.error('[Referral] Error generating custom code:', error);
    res.status(500).json({ success: false, message: 'Error updating referral code' });
  }
};

// GET /api/referral/stats - Get referral statistics
exports.getReferralStats = async (req, res) => {
  try {
    const userId = req.session?.user?.ZenoPayID || 'demo-user';
    
    const referrals = await Referral.find({ referrer_id: userId });
    const totalRewards = await ReferralReward.calculateTotalRewards(userId, 'credited');
    const pendingRewards = await ReferralReward.calculateTotalRewards(userId, 'pending');
    
    const stats = {
      total_referrals: referrals.length,
      pending: referrals.filter(r => r.status === 'pending').length,
      completed: referrals.filter(r => r.status === 'completed').length,
      expired: referrals.filter(r => r.status === 'expired').length,
      total_rewards: totalRewards,
      pending_rewards: pendingRewards,
      available_balance: totalRewards,
      total_clicks: referrals.reduce((sum, r) => sum + r.click_count, 0)
    };
    
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('[Referral] Error getting stats:', error);
    res.status(500).json({ success: false, message: 'Error fetching statistics' });
  }
};

// GET /api/referral/list - Get list of referred users
exports.getReferralList = async (req, res) => {
  try {
    const userId = req.session?.user?.ZenoPayID || 'demo-user';
    const { page = 1, limit = 10, status } = req.query;
    
    const query = { referrer_id: userId };
    if (status && status !== 'all') {
      query.status = status;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const referrals = await Referral.find(query)
      .sort({ created_at: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .lean();
    
    const total = await Referral.countDocuments(query);
    
    // Get reward information for each referral
    const referralIds = referrals.map(r => r._id);
    const rewards = await ReferralReward.find({
      referral_id: { $in: referralIds }
    }).lean();
    
    const rewardMap = {};
    rewards.forEach(r => {
      if (!rewardMap[r.referral_id]) rewardMap[r.referral_id] = [];
      rewardMap[r.referral_id].push(r);
    });
    
    const enrichedReferrals = referrals.map(ref => ({
      ...ref,
      rewards: rewardMap[ref._id] || []
    }));
    
    res.json({
      success: true,
      data: enrichedReferrals,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / parseInt(limit)),
        total_items: total,
        items_per_page: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('[Referral] Error getting list:', error);
    res.status(500).json({ success: false, message: 'Error fetching referral list' });
  }
};

// GET /api/referral/rewards - Get rewards history
exports.getRewardsHistory = async (req, res) => {
  try {
    const userId = req.session?.user?.ZenoPayID || 'demo-user';
    const { page = 1, limit = 20 } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const rewards = await ReferralReward.find({ user_id: userId })
      .populate('referral_id')
      .sort({ created_at: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .lean();
    
    const total = await ReferralReward.countDocuments({ user_id: userId });
    
    res.json({
      success: true,
      data: rewards,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / parseInt(limit)),
        total_items: total
      }
    });
  } catch (error) {
    console.error('[Referral] Error getting rewards:', error);
    res.status(500).json({ success: false, message: 'Error fetching rewards history' });
  }
};

// POST /api/referral/track/:code - Track referral click
exports.trackReferralClick = async (req, res) => {
  try {
    const { code } = req.params;
    const { source, device, location } = req.body;
    
    const referral = await Referral.findOne({ referral_code: code.toUpperCase() });
    
    if (!referral) {
      return res.status(404).json({ success: false, message: 'Referral code not found' });
    }
    
    // Update click count
    referral.click_count += 1;
    referral.last_clicked_at = new Date();
    await referral.save();
    
    // Store tracking data (you can create a separate collection for detailed analytics)
    
    res.json({ success: true, message: 'Click tracked' });
  } catch (error) {
    console.error('[Referral] Error tracking click:', error);
    res.status(500).json({ success: false, message: 'Error tracking click' });
  }
};

// GET /api/referral/leaderboard - Get top referrers
exports.getLeaderboard = async (req, res) => {
  try {
    const { period = 'all-time' } = req.query;
    const userId = req.session?.user?.ZenoPayID || 'demo-user';
    
    let dateFilter = {};
    const now = new Date();
    
    switch (period) {
      case 'week':
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        dateFilter = { created_at: { $gte: weekAgo } };
        break;
      case 'month':
        const monthAgo = new Date(now);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        dateFilter = { created_at: { $gte: monthAgo } };
        break;
    }
    
    // Aggregate referrals by user
    const leaderboard = await Referral.aggregate([
      { $match: { status: 'completed', ...dateFilter } },
      {
        $group: {
          _id: '$referrer_id',
          total_referrals: { $sum: 1 },
          total_rewards: { $sum: { $toDouble: '$reward_earned' } }
        }
      },
      { $sort: { total_referrals: -1 } },
      { $limit: 100 }
    ]);
    
    // Get user details
    const userIds = leaderboard.map(l => l._id);
    const users = await ZenoPayUser.find({ ZenoPayID: { $in: userIds } })
      .select('ZenoPayID FullName ImagePath')
      .lean();
    
    const userMap = {};
    users.forEach(u => {
      userMap[u.ZenoPayID] = u;
    });
    
    const enrichedLeaderboard = leaderboard.map((entry, index) => {
      const user = userMap[entry._id];
      return {
        rank: index + 1,
        user_id: entry._id,
        user_name: entry._id === userId ? user?.FullName : user?.FullName?.split(' ')[0] + ' ' + user?.FullName?.split(' ')[1]?.charAt(0) + '.',
        is_current_user: entry._id === userId,
        total_referrals: entry.total_referrals,
        total_rewards: entry.total_rewards,
        badge: index === 0 ? 'Top Referrer' : index < 3 ? 'Rising Star' : null,
        avatar: user?.ImagePath || ''
      };
    });
    
    res.json({ success: true, data: enrichedLeaderboard });
  } catch (error) {
    console.error('[Referral] Error getting leaderboard:', error);
    res.status(500).json({ success: false, message: 'Error fetching leaderboard' });
  }
};

// GET /ref/:code - Handle referral link click
exports.handleReferralLink = async (req, res) => {
  try {
    const { code } = req.params;
    
    const referral = await Referral.findOne({ referral_code: code.toUpperCase() });
    
    if (!referral) {
      return res.redirect('/register?error=invalid_referral_code');
    }
    
    // Update click count
    referral.click_count += 1;
    referral.last_clicked_at = new Date();
    await referral.save();
    
    // Store referral code in session/cookie for signup
    req.session.referral_code = code.toUpperCase();
    
    // Redirect to registration
    res.redirect(`/register?ref=${code.toUpperCase()}`);
  } catch (error) {
    console.error('[Referral] Error handling referral link:', error);
    res.redirect('/register');
  }
};

// Helper function to credit referral rewards (called after successful signup)
exports.creditReferralRewards = async (referrerUserId, refereeUserId, transactionAmount = 0) => {
  try {
    const settings = await ReferralSettings.getSettings();
    
    // Check if transaction meets minimum
    if (transactionAmount < settings.min_transaction_for_reward) {
      return { success: false, message: 'Transaction amount too low' };
    }
    
    // Find referral
    const referral = await Referral.findOne({
      referrer_id: referrerUserId,
      referee_id: refereeUserId
    });
    
    if (!referral || referral.reward_status === 'credited') {
      return { success: false, message: 'Referral not found or already credited' };
    }
    
    // Credit rewards to referrer
    await ReferralReward.create({
      user_id: referrerUserId,
      referral_id: referral._id,
      reward_type: 'signup_bonus',
      amount: settings.signup_bonus_referrer,
      description: `Referral bonus for inviting user`,
      status: 'credited',
      credited_at: new Date()
    });
    
    // Credit rewards to referee
    await ReferralReward.create({
      user_id: refereeUserId,
      referral_id: referral._id,
      reward_type: 'signup_bonus',
      amount: settings.signup_bonus_referee,
      description: `Welcome bonus for joining via referral`,
      status: 'credited',
      credited_at: new Date()
    });
    
    // Update referral status
    referral.status = 'completed';
    referral.reward_status = 'credited';
    referral.reward_earned = settings.signup_bonus_referrer;
    referral.first_transaction_at = new Date();
    await referral.save();
    
    // Send notifications
    // TODO: Send email to referrer
    
    return { success: true, message: 'Rewards credited successfully' };
  } catch (error) {
    console.error('[Referral] Error crediting rewards:', error);
    return { success: false, message: 'Error crediting rewards' };
  }
};
