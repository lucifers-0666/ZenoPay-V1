// Report Issue Controller
const ZenoPayUser = require('../Models/ZenoPayUser');
const TransactionHistory = require('../Models/TransactionHistory');
const SupportTicket = require('../Models/SupportTicket');

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

const resolveSessionUserId = (req) => {
  return req?.session?.user?._id || req?.session?.user?.id || null;
};

const normalizeCategory = (category) => {
  const value = String(category || '').trim().toLowerCase();

  if (!value) return 'other';
  if (value.includes('payment')) return 'payment';
  if (value.includes('account')) return 'account';
  if (value.includes('kyc')) return 'kyc';

  return ['payment', 'account', 'kyc', 'other'].includes(value) ? value : 'other';
};

const normalizePriority = (priority) => {
  const value = String(priority || '').trim().toLowerCase();
  if (value === 'medium') return 'normal';
  if (['low', 'normal', 'high', 'urgent'].includes(value)) return value;
  return 'normal';
};

// Submit issue report (DB-backed)
const submitTicket = async (req, res) => {
  try {
    const userId = resolveSessionUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized', data: null });
    }

    const {
      category,
      subject,
      description,
      priority,
      attachments,
    } = req.body;

    // Validate required fields
    if (!category || !subject || !description) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all required fields',
        data: null,
      });
    }

    // Validate description length
    if (description.length < 50) {
      return res.status(400).json({
        success: false,
        message: 'Description must be at least 50 characters',
        data: null,
      });
    }

    if (description.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Description must not exceed 1000 characters',
        data: null,
      });
    }

    const ticket = await SupportTicket.create({
      userId,
      ticketNumber: `TKT-${Date.now()}`,
      category: normalizeCategory(category),
      subject: String(subject).trim(),
      description: String(description).trim(),
      priority: normalizePriority(priority),
      isDraft: false,
      attachments: Array.isArray(attachments)
        ? attachments.map((item) => String(item || '').trim()).filter(Boolean)
        : [],
    });

    res.json({
      success: true,
      message: 'Your issue has been submitted successfully',
      ticket,
      data: ticket,
      ticketNumber: ticket.ticketNumber,
    });
  } catch (error) {
    console.error('Error submitting issue:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit issue. Please try again.',
      data: null,
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

// Save draft (upsert by userId + isDraft=true)
const saveDraft = async (req, res) => {
  try {
    const userId = resolveSessionUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized', data: null });
    }

    const {
      category,
      subject,
      description,
      priority,
      attachments,
      adminNotes,
      status,
    } = req.body;

    const updateDoc = {
      userId,
      isDraft: true,
      ticketNumber: `TKT-${Date.now()}`,
      category: normalizeCategory(category),
      subject: String(subject || 'Draft Ticket').trim(),
      description: String(description || 'Draft description').trim(),
      priority: normalizePriority(priority),
      status: ['open', 'in_progress', 'resolved', 'closed'].includes(String(status || '').toLowerCase())
        ? String(status).toLowerCase()
        : 'open',
      adminNotes: String(adminNotes || '').trim(),
      attachments: Array.isArray(attachments)
        ? attachments.map((item) => String(item || '').trim()).filter(Boolean)
        : [],
    };

    const draft = await SupportTicket.findOneAndUpdate(
      { userId, isDraft: true },
      updateDoc,
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    ).lean();

    res.json({
      success: true,
      message: 'Draft saved successfully',
      draft,
      data: draft,
    });
  } catch (error) {
    console.error('Error saving draft:', error);
    return res.status(500).json({ success: false, message: 'Failed to save draft', data: null });
  }
};

const getTickets = async (req, res) => {
  try {
    const userId = resolveSessionUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized', data: null });
    }

    const tickets = await SupportTicket.find({ userId, isDraft: false })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      message: 'Tickets fetched successfully',
      tickets,
      data: tickets,
    });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch tickets', data: null });
  }
};

const getTicketById = async (req, res) => {
  try {
    const userId = resolveSessionUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized', data: null });
    }

    const { id } = req.params;
    const ticket = await SupportTicket.findOne({ _id: id, userId }).lean();

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found', data: null });
    }

    return res.json({
      success: true,
      message: 'Ticket fetched successfully',
      ticket,
      data: ticket,
    });
  } catch (error) {
    console.error('Error fetching ticket:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch ticket', data: null });
  }
};

const getAdminTickets = async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};

    if (status) {
      query.status = String(status).toLowerCase();
    }

    const priorityOrder = {
      urgent: 0,
      high: 1,
      normal: 2,
      low: 3,
    };

    const tickets = await SupportTicket.find(query)
      .sort({ createdAt: -1 })
      .lean();

    tickets.sort((a, b) => {
      const ap = priorityOrder[a.priority] ?? 99;
      const bp = priorityOrder[b.priority] ?? 99;
      if (ap !== bp) return ap - bp;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return res.json({
      success: true,
      message: 'Admin tickets fetched successfully',
      data: tickets,
    });
  } catch (error) {
    console.error('Error fetching admin tickets:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch admin tickets', data: null });
  }
};

exports.submitTicket = submitTicket;
exports.submitIssue = submitTicket;
exports.saveDraft = saveDraft;
exports.getTickets = getTickets;
exports.getTicketById = getTicketById;
exports.getAdminTickets = getAdminTickets;
