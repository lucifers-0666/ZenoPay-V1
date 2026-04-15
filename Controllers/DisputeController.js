// Dispute Management Controller
const mongoose = require('mongoose');
const Dispute = require('../Models/Dispute');

const statusConfig = {
  open: { key: 'open', label: 'Open', stripClass: 'strip-open', pillClass: 'status-open' },
  'under-review': { key: 'under-review', label: 'Under Review', stripClass: 'strip-open', pillClass: 'status-open' },
  resolved: { key: 'resolved', label: 'Resolved', stripClass: 'strip-resolved', pillClass: 'status-resolved' },
  closed: { key: 'closed', label: 'Closed', stripClass: 'strip-closed', pillClass: 'status-closed' },
};

const getStatusMeta = (statusKey) => statusConfig[statusKey] || statusConfig.open;

const disputeSteps = ['Submitted', 'Under Review', 'Resolved', 'Closed'];

const uiStatusToDbStatus = {
  open: 'open',
  'under-review': 'in_review',
  in_review: 'in_review',
  resolved: 'resolved',
  closed: 'rejected',
  rejected: 'rejected',
};

const dbStatusToUiStatus = {
  open: 'open',
  in_review: 'under-review',
  resolved: 'resolved',
  rejected: 'closed',
};

const resolveStepIndex = (statusKey) => {
  switch (statusKey) {
    case 'open':
      return 0;
    case 'under-review':
      return 1;
    case 'resolved':
      return 2;
    case 'closed':
      return 3;
    default:
      return 0;
  }
};

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(String(value || '').trim());

const getSessionUserId = (req) => req?.session?.user?._id || null;

const toDisputeCard = (dispute) => {
  const uiStatus = dbStatusToUiStatus[dispute.status] || 'open';
  const tx = dispute.transactionId && typeof dispute.transactionId === 'object' ? dispute.transactionId : null;

  return {
    _id: String(dispute._id),
    disputeId: String(dispute._id),
    transactionId: tx?._id ? String(tx._id) : (dispute.transactionId ? String(dispute.transactionId) : 'N/A'),
    amount: Number(tx?.amount || 0),
    merchantName: tx?.merchant ? String(tx.merchant) : 'N/A',
    reason: dispute.subject,
    subject: dispute.subject,
    description: dispute.description,
    status: uiStatus,
    priority: dispute.priority,
    additionalInfo: dispute.additionalInfo || '',
    submittedDate: dispute.createdAt,
    lastUpdated: dispute.updatedAt,
    timeline: (dispute.timeline || []).map((item, index, arr) => ({
      event: item.action,
      date: item.at,
      status: index === arr.length - 1 ? 'current' : 'completed',
    })),
  };
};

const toTimelineForDetail = (timeline = []) =>
  timeline.map((item) => ({
    actor: item.by === 'user' ? 'you' : item.by === 'admin' ? 'zeno' : 'system',
    title: String(item.action || 'Update').replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase()),
    time: new Date(item.at || Date.now()).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    content: item.by === 'user' ? 'You added an update to this case.' : 'Case updated by the support team.',
  }));

exports.getDisputesPage = async (req, res) => {
  try {
    const userId = getSessionUserId(req);
    if (!userId || !isValidObjectId(userId)) {
      return res.status(401).json({ success: false, message: 'Unauthorized', data: null });
    }

    const { status, search, dateFrom, dateTo } = req.query;

    const query = {
      userId,
    };

    if (status && status !== 'all') {
      query.status = uiStatusToDbStatus[status] || status;
    }

    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    if (search) {
      query.$or = [
        { subject: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
      ];

      if (isValidObjectId(search)) {
        query.$or.push({ _id: new mongoose.Types.ObjectId(search) });
        query.$or.push({ transactionId: new mongoose.Types.ObjectId(search) });
      }
    }

    const disputes = await Dispute.find(query)
      .populate('transactionId')
      .sort({ createdAt: -1 })
      .lean();

    const disputeCards = disputes.map(toDisputeCard);

    res.render('disputes', {
      pageTitle: 'My Disputes - ZenoPay',
      disputes: disputeCards,
      filters: { status, search, dateFrom, dateTo }
    });
  } catch (error) {
    console.error('Error loading disputes:', error);
    return res.status(500).json({ success: false, message: 'Failed to load disputes', data: null });
  }
};

exports.getDisputes = async (req, res) => {
  try {
    const userId = getSessionUserId(req);
    if (!userId || !isValidObjectId(userId)) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const disputes = await Dispute.find({ userId })
      .sort({ createdAt: -1 });

    return res.json({ success: true, disputes });
  } catch (error) {
    console.error('Error fetching disputes:', error);
    return res.status(500).json({ success: false, message: 'Failed to load disputes' });
  }
};

exports.getDisputeDetail = async (req, res) => {
  try {
    const userId = getSessionUserId(req);
    if (!userId || !isValidObjectId(userId)) {
      return res.status(401).json({ success: false, message: 'Unauthorized', data: null });
    }

    const { disputeId } = req.params;
    const format = req.query.format || '';

    if (!isValidObjectId(disputeId)) {
      return res.status(400).json({ success: false, message: 'Invalid dispute ID', data: null });
    }

    const disputeDoc = await Dispute.findOne({
      _id: disputeId,
      userId,
    })
      .populate('transactionId')
      .lean();

    const dispute = disputeDoc ? toDisputeCard(disputeDoc) : null;

    if (!dispute) {
      if (format === 'json' || req.accepts('json')) {
        return res.status(404).json({ success: false, message: 'Dispute not found', data: null });
      }
      return res.status(404).send('Dispute not found');
    }

    if (format === 'json' || req.accepts('json')) {
      return res.json({ success: true, message: 'Dispute fetched successfully', dispute, data: dispute });
    }

    const statusMeta = getStatusMeta(dispute.status || 'open');
    const createdAt = dispute.submittedDate || new Date();
    const expectedResolution = new Date(createdAt);
    expectedResolution.setDate(expectedResolution.getDate() + 14);

    const evidence = dispute.evidence?.length
      ? dispute.evidence
      : [
          { filename: 'payment_receipt.pdf', uploadDate: new Date('2026-02-16'), size: '1.2 MB', type: 'pdf' },
          { filename: 'chat_screenshot.png', uploadDate: new Date('2026-02-17'), size: '600 KB', type: 'image' },
        ];

    const timeline = toTimelineForDetail(disputeDoc.timeline || []);

    const transaction = {
      id: dispute.transactionId || 'N/A',
      amount: dispute.amount || 15000,
      date: (disputeDoc.transactionId?.createdAt
        ? new Date(disputeDoc.transactionId.createdAt)
        : new Date()
      ).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
      }),
      type: disputeDoc.transactionId?.type || 'N/A',
      from: 'You',
      to: dispute.merchantName || 'N/A',
      reference: disputeDoc.transactionId?.reference || `DSP-${String(disputeDoc._id).slice(-8).toUpperCase()}`,
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
    return res.status(500).json({ success: false, message: 'Failed to load dispute', data: null });
  }
};

exports.submitDispute = async (req, res) => {
  try {
    const userId = getSessionUserId(req);
    if (!userId || !isValidObjectId(userId)) {
      return res.status(401).json({ success: false, message: 'Unauthorized', data: null });
    }

    const {
      transactionId,
      subject,
      reason,
      description,
      priority,
    } = req.body;

    const disputeSubject = String(subject || reason || '').trim();

    if (!disputeSubject || !description) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all required fields',
        data: null,
      });
    }

    if (transactionId && !isValidObjectId(transactionId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid transaction ID',
        data: null,
      });
    }

    const dispute = await Dispute.create({
      userId,
      transactionId: transactionId || null,
      subject: disputeSubject,
      description,
      priority: ['low', 'medium', 'high'].includes(priority) ? priority : 'medium',
      timeline: [{ action: 'opened', by: 'user', at: new Date() }],
    });

    res.json({
      success: true,
      disputeId: String(dispute._id),
      message: 'Dispute submitted successfully',
      data: dispute,
    });
  } catch (error) {
    console.error('Error submitting dispute:', error);
    return res.status(500).json({ success: false, message: 'Failed to submit dispute', data: null });
  }
};

exports.addDisputeInformation = async (req, res) => {
  try {
    const userId = getSessionUserId(req);
    if (!userId || !isValidObjectId(userId)) {
      return res.status(401).json({ success: false, message: 'Unauthorized', data: null });
    }

    const disputeId = req.params?.disputeId || req.body?.disputeId;
    const info = req.body?.info || req.body?.message;

    if (!isValidObjectId(disputeId)) {
      return res.status(400).json({ success: false, message: 'Invalid dispute ID', data: null });
    }

    if (!String(info || '').trim()) {
      return res.status(400).json({ success: false, message: 'Info is required', data: null });
    }

    const dispute = await Dispute.findOneAndUpdate(
      { _id: disputeId, userId },
      {
        $set: { additionalInfo: String(info).trim() },
        $push: { timeline: { action: 'info_added', by: 'user', at: new Date() } },
      },
      { new: true }
    );

    if (!dispute) {
      return res.status(404).json({ success: false, message: 'Dispute not found', data: null });
    }

    res.json({
      success: true,
      message: 'Information added successfully',
      dispute,
      data: dispute,
    });
  } catch (error) {
    console.error('Error adding information:', error);
    return res.status(500).json({ success: false, message: 'Failed to add information', data: null });
  }
};

exports.withdrawDispute = async (req, res) => {
  try {
    const userId = getSessionUserId(req);
    if (!userId || !isValidObjectId(userId)) {
      return res.status(401).json({ success: false, message: 'Unauthorized', data: null });
    }

    const disputeId = req.params?.disputeId || req.body?.disputeId;

    if (!isValidObjectId(disputeId)) {
      return res.status(400).json({ success: false, message: 'Invalid dispute ID', data: null });
    }

    const dispute = await Dispute.findOneAndUpdate(
      { _id: disputeId, userId, status: 'open' },
      {
        $set: { status: 'rejected' },
        $push: { timeline: { action: 'withdrawn', by: 'user', at: new Date() } },
      },
      { new: true }
    );

    if (!dispute) {
      return res.status(404).json({ success: false, message: 'Not found or already closed', data: null });
    }

    res.json({
      success: true,
      message: 'Dispute withdrawn successfully',
      dispute,
      data: dispute,
    });
  } catch (error) {
    console.error('Error withdrawing dispute:', error);
    return res.status(500).json({ success: false, message: 'Failed to withdraw dispute', data: null });
  }
};
