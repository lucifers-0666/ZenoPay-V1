// Dispute Management Controller
const ZenoPayUser = require('../Models/ZenoPayUser');
const TransactionHistory = require('../Models/TransactionHistory');

const statusConfig = {
  open: { key: 'open', label: 'Open', stripClass: 'strip-open', pillClass: 'status-open' },
  'under-review': { key: 'under-review', label: 'Under Review', stripClass: 'strip-open', pillClass: 'status-open' },
  'evidence-requested': { key: 'evidence-requested', label: 'Evidence Requested', stripClass: 'strip-open', pillClass: 'status-open' },
  escalated: { key: 'escalated', label: 'Escalated', stripClass: 'strip-escalated', pillClass: 'status-escalated' },
  resolved: { key: 'resolved', label: 'Resolved', stripClass: 'strip-resolved', pillClass: 'status-resolved' },
  won: { key: 'won', label: 'Won', stripClass: 'strip-resolved', pillClass: 'status-resolved' },
  closed: { key: 'closed', label: 'Closed', stripClass: 'strip-closed', pillClass: 'status-closed' },
  lost: { key: 'lost', label: 'Lost', stripClass: 'strip-closed', pillClass: 'status-closed' },
};

const getStatusMeta = (statusKey) => statusConfig[statusKey] || statusConfig.open;

const disputeSteps = [
  'Submitted',
  'Under Review',
  'Evidence Requested',
  'Decision Made',
  'Resolved',
];

const resolveStepIndex = (statusKey) => {
  switch (statusKey) {
    case 'open':
      return 0;
    case 'under-review':
      return 1;
    case 'evidence-requested':
    case 'escalated':
      return 2;
    case 'decision-made':
      return 3;
    case 'resolved':
    case 'won':
    case 'closed':
    case 'lost':
      return 4;
    default:
      return 0;
  }
};

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
    const format = req.query.format || '';

    const dispute = mockDisputes.find(d => d.disputeId === disputeId);

    if (!dispute) {
      if (format === 'json' || req.accepts('json')) {
        return res.status(404).json({ success: false, message: 'Dispute not found' });
      }
      return res.status(404).send('Dispute not found');
    }

    if (format === 'json' || req.accepts('json')) {
      return res.json({ success: true, dispute });
    }

    const statusMeta = getStatusMeta(dispute.status);
    const createdAt = dispute.submittedDate || new Date();
    const expectedResolution = new Date(createdAt);
    expectedResolution.setDate(expectedResolution.getDate() + 14);

    const evidence = dispute.evidence?.length
      ? dispute.evidence
      : [
          { filename: 'payment_receipt.pdf', uploadDate: new Date('2026-02-16'), size: '1.2 MB', type: 'pdf' },
          { filename: 'chat_screenshot.png', uploadDate: new Date('2026-02-17'), size: '600 KB', type: 'image' },
        ];

    const timeline = [
      {
        actor: 'you',
        title: 'Dispute Submitted',
        time: 'Feb 15, 2026 • 10:05 AM',
        content: 'You filed the dispute with a description of the unauthorized transaction.',
      },
      {
        actor: 'zeno',
        title: 'Case Assigned',
        time: 'Feb 15, 2026 • 12:30 PM',
        content: 'ZenoPay support assigned a dispute specialist to review your case.',
      },
      {
        actor: 'system',
        title: 'Evidence Requested',
        time: 'Feb 16, 2026 • 09:00 AM',
        content: 'We requested supporting documents to proceed with the investigation.',
      },
      {
        actor: 'you',
        title: 'Evidence Submitted',
        time: 'Feb 16, 2026 • 04:20 PM',
        content: 'You submitted two files to support your claim.',
        attachments: ['payment_receipt.pdf', 'chat_screenshot.png'],
      },
      {
        actor: 'zeno',
        title: 'Under Review',
        time: 'Feb 18, 2026 • 11:45 AM',
        content: 'The dispute specialist is reviewing the evidence and contacting the merchant.',
      },
    ];

    const transaction = {
      id: dispute.transactionId || 'ZP-TRX-2026-8821',
      amount: dispute.amount || 15000,
      date: 'Feb 12, 2026 • 04:18 PM',
      type: 'Card Payment',
      from: 'You',
      to: dispute.merchantName || 'ZenoPay Merchant',
      reference: 'REF-90218-2026',
    };

    const caseSummary = {
      id: dispute.disputeId,
      type: dispute.reason || 'Unauthorized Transaction',
      amount: dispute.amount || 15000,
      reason: dispute.reason || 'Unauthorized Transaction',
      filedOn: createdAt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      updatedOn: dispute.lastUpdated
        ? dispute.lastUpdated.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        : createdAt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      assignedAgent: 'Aditi Sharma',
    };

    const importantDates = [
      { label: 'Filed', date: caseSummary.filedOn },
      { label: 'Evidence Deadline', date: 'Feb 22, 2026', overdue: false },
      { label: 'Expected Decision', date: expectedResolution.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) },
    ];

    res.render('dispute-details-timeline', {
      pageTitle: 'Dispute Case - ZenoPay',
      dispute,
      statusMeta,
      steps: disputeSteps,
      activeStep: resolveStepIndex(dispute.status),
      transaction,
      evidence,
      timeline,
      caseSummary,
      importantDates,
    });
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
