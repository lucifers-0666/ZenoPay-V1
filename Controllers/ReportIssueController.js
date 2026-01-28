// Report Issue Controller
const ZenoPayUser = require('../Models/ZenoPayUser');
const TransactionHistory = require('../Models/TransactionHistory');

// Issue categories
const issueCategories = [
  { value: 'payment-failed', label: 'Payment Failed' },
  { value: 'account-access', label: 'Account Access' },
  { value: 'transaction-dispute', label: 'Transaction Dispute' },
  { value: 'technical-bug', label: 'Technical Bug' },
  { value: 'security-concern', label: 'Security Concern' },
  { value: 'other', label: 'Other' }
];

exports.getReportIssuePage = async (req, res) => {
  try {
    const user = await ZenoPayUser.findOne({ ZenoPayID: req.session.user.ZenoPayID });
    
    // Get recent transactions for dropdown
    const recentTransactions = await TransactionHistory.find({
      $or: [
        { SenderZenoPayID: req.session.user.ZenoPayID },
        { ReceiverZenoPayID: req.session.user.ZenoPayID }
      ]
    })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();
    
    res.render('report-issue', {
      pageTitle: 'Report an Issue - ZenoPay',
      issueCategories,
      recentTransactions: recentTransactions || [],
      user
    });
  } catch (error) {
    console.error('Error loading report issue page:', error);
    res.status(500).send('Error loading page');
  }
};

// Submit issue report
exports.submitIssue = async (req, res) => {
  try {
    const {
      category,
      subject,
      description,
      transactionId,
      priority,
      contactEmail,
      contactPhone,
      preferredContactTime
    } = req.body;
    
    // Validate required fields
    if (!category || !subject || !description) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all required fields'
      });
    }
    
    // Validate description length
    if (description.length < 50) {
      return res.status(400).json({
        success: false,
        message: 'Description must be at least 50 characters'
      });
    }
    
    if (description.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Description must not exceed 1000 characters'
      });
    }
    
    // Generate ticket number
    const ticketNumber = 'TKT-' + Date.now().toString().slice(-8);
    
    // Mock issue submission
    const issue = {
      ticketNumber,
      userId: req.session.user.ZenoPayID,
      category,
      subject,
      description,
      transactionId: transactionId || null,
      priority: priority || 'medium',
      contactPreferences: {
        email: contactEmail || false,
        phone: contactPhone || false,
        preferredTime: preferredContactTime || null
      },
      status: 'open',
      createdAt: new Date(),
      expectedResponseTime: priority === 'high' ? '4 hours' : priority === 'medium' ? '24 hours' : '48 hours'
    };
    
    // TODO: Save to database
    console.log('Issue submitted:', issue);
    
    res.json({
      success: true,
      ticketNumber,
      expectedResponseTime: issue.expectedResponseTime,
      message: 'Your issue has been submitted successfully'
    });
  } catch (error) {
    console.error('Error submitting issue:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit issue. Please try again.'
    });
  }
};

// Check similar issues (for suggestions)
exports.checkSimilarIssues = async (req, res) => {
  try {
    const { query } = req.body;
    
    // Mock similar issues
    const similarIssues = [
      {
        title: 'Payment not received after 24 hours',
        solution: 'Payments typically process within 1-3 business days. Check your transaction status.',
        helpfulCount: 234
      },
      {
        title: 'Unable to add new bank account',
        solution: 'Ensure your bank account details are correct and your account is verified.',
        helpfulCount: 189
      }
    ];
    
    res.json({ success: true, similarIssues });
  } catch (error) {
    console.error('Error checking similar issues:', error);
    res.status(500).json({ success: false, similarIssues: [] });
  }
};

// Save draft
exports.saveDraft = async (req, res) => {
  try {
    const draftData = req.body;
    const draftId = 'DRAFT-' + Date.now();
    
    // TODO: Save draft to database or session
    console.log('Draft saved:', draftId, draftData);
    
    res.json({
      success: true,
      draftId,
      message: 'Draft saved successfully'
    });
  } catch (error) {
    console.error('Error saving draft:', error);
    res.status(500).json({ success: false, message: 'Failed to save draft' });
  }
};
