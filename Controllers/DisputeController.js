// Dispute Management Controller
const ZenoPayUser = require('../Models/ZenoPayUser');
const TransactionHistory = require('../Models/TransactionHistory');

// Mock disputes data
const mockDisputes = [
  {
    disputeId: 'DSP-20250127001',
    transactionId: 'TXN-20250125456',
    amount: 250.00,
    merchantName: 'Online Store XYZ',
    reason: 'Unauthorized Transaction',
    status: 'under-review',
    submittedDate: new Date('2025-01-25'),
    lastUpdated: new Date('2025-01-26'),
    timeline: [
      { event: 'Dispute submitted', date: new Date('2025-01-25'), status: 'completed' },
      { event: 'Under review', date: new Date('2025-01-26'), status: 'current' },
      { event: 'Resolution', date: null, status: 'pending' }
    ],
    description: 'I did not authorize this transaction. My card was used without my permission.',
    evidence: [
      { filename: 'bank_statement.pdf', uploadDate: new Date('2025-01-25') }
    ],
    messages: [
      {
        from: 'Support Team',
        message: 'We have received your dispute and are reviewing it.',
        timestamp: new Date('2025-01-26T10:30:00')
      }
    ]
  },
  {
    disputeId: 'DSP-20250120002',
    transactionId: 'TXN-20250118234',
    amount: 89.99,
    merchantName: 'Service Provider ABC',
    reason: 'Service Not Received',
    status: 'resolved',
    submittedDate: new Date('2025-01-20'),
    lastUpdated: new Date('2025-01-24'),
    resolution: 'Refund processed',
    refundAmount: 89.99,
    refundDate: new Date('2025-01-24'),
    timeline: [
      { event: 'Dispute submitted', date: new Date('2025-01-20'), status: 'completed' },
      { event: 'Under review', date: new Date('2025-01-21'), status: 'completed' },
      { event: 'Resolution', date: new Date('2025-01-24'), status: 'completed' }
    ]
  }
];

exports.getDisputesPage = async (req, res) => {
  try {
    const { status, search, dateFrom, dateTo } = req.query;
    
    let disputes = [...mockDisputes];
    
    // Filter by status
    if (status && status !== 'all') {
      disputes = disputes.filter(d => d.status === status);
    }
    
    // Search filter
    if (search) {
      disputes = disputes.filter(d =>
        d.disputeId.includes(search) ||
        d.transactionId.includes(search) ||
        d.merchantName.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    res.render('disputes', {
      pageTitle: 'My Disputes - ZenoPay',
      disputes,
      filters: { status, search, dateFrom, dateTo }
    });
  } catch (error) {
    console.error('Error loading disputes:', error);
    res.status(500).send('Error loading disputes');
  }
};

exports.getDisputeDetail = async (req, res) => {
  try {
    const { disputeId } = req.params;
    
    const dispute = mockDisputes.find(d => d.disputeId === disputeId);
    
    if (!dispute) {
      return res.status(404).json({ success: false, message: 'Dispute not found' });
    }
    
    res.json({ success: true, dispute });
  } catch (error) {
    console.error('Error loading dispute detail:', error);
    res.status(500).json({ success: false, message: 'Failed to load dispute' });
  }
};

exports.submitDispute = async (req, res) => {
  try {
    const {
      transactionId,
      reason,
      description
    } = req.body;
    
    if (!transactionId || !reason || !description) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all required fields'
      });
    }
    
    const disputeId = 'DSP-' + Date.now().toString().slice(-11);
    
    const newDispute = {
      disputeId,
      transactionId,
      reason,
      description,
      status: 'open',
      submittedDate: new Date(),
      userId: req.session.user.ZenoPayID
    };
    
    // TODO: Save to database
    console.log('Dispute submitted:', newDispute);
    
    res.json({
      success: true,
      disputeId,
      message: 'Dispute submitted successfully'
    });
  } catch (error) {
    console.error('Error submitting dispute:', error);
    res.status(500).json({ success: false, message: 'Failed to submit dispute' });
  }
};

exports.addDisputeInformation = async (req, res) => {
  try {
    const { disputeId } = req.params;
    const { message } = req.body;
    
    // TODO: Add message to dispute
    console.log('Adding information to dispute:', disputeId, message);
    
    res.json({
      success: true,
      message: 'Information added successfully'
    });
  } catch (error) {
    console.error('Error adding information:', error);
    res.status(500).json({ success: false, message: 'Failed to add information' });
  }
};

exports.withdrawDispute = async (req, res) => {
  try {
    const { disputeId } = req.params;
    
    // TODO: Update dispute status to withdrawn
    console.log('Withdrawing dispute:', disputeId);
    
    res.json({
      success: true,
      message: 'Dispute withdrawn successfully'
    });
  } catch (error) {
    console.error('Error withdrawing dispute:', error);
    res.status(500).json({ success: false, message: 'Failed to withdraw dispute' });
  }
};
