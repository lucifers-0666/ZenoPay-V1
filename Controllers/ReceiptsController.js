// Payment Receipts Controller
const ZenoPayUser = require('../Models/ZenoPayUser');
const TransactionHistory = require('../Models/TransactionHistory');
const Receipt = require('../Models/Receipt');
const receiptPdfGenerator = require('../Services/receiptPdfGenerator');
const EmailService = require('../Services/EmailService');
const crypto = require('crypto');

const RECEIPT_ID_REGEX = /^ZP-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

const formatReceiptId = (raw = '') => {
  const cleaned = String(raw).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 14);
  if (cleaned.length <= 2) return cleaned;

  const body = cleaned.startsWith('ZP') ? cleaned.slice(2) : cleaned;
  const parts = [];
  for (let i = 0; i < body.length; i += 4) {
    parts.push(body.slice(i, i + 4));
  }
  return `ZP-${parts.join('-')}`.replace(/-$/, '');
};

const maskAccount = (value = '') => {
  const str = String(value || '').replace(/\s+/g, '');
  if (!str) return 'XXXX XXXX 0000';
  const last4 = str.slice(-4);
  return `XXXX XXXX ${last4.padStart(4, '0')}`;
};

const normalizeStatus = (status = '') => {
  const map = {
    success: 'COMPLETED',
    pending: 'PENDING',
    failed: 'FAILED'
  };
  return map[String(status).toLowerCase()] || String(status || 'UNKNOWN').toUpperCase();
};

const mapReceiptForVerification = (receipt) => {
  const totalAmount = Number(receipt.total_amount || 0);
  const fee = Number(receipt.fee || 0);
  const gst = Number((fee * 0.18).toFixed(2));
  const netAmount = Number((totalAmount - fee - gst).toFixed(2));
  const transactionDate = receipt.transaction_date ? new Date(receipt.transaction_date) : new Date();

  return {
    receiptId: receipt.receipt_number,
    sender: {
      name: receipt.sender_name || 'N/A',
      account: maskAccount(receipt.sender_id)
    },
    recipient: {
      name: receipt.recipient_name || 'N/A',
      account: maskAccount(receipt.recipient_id)
    },
    amount: totalAmount,
    fee,
    gst,
    netAmount,
    currency: 'INR',
    method: receipt.payment_method || 'ZenoPay Wallet',
    status: normalizeStatus(receipt.status),
    transactionDate,
    reference: receipt.transaction_hash || `REF${String(receipt._id).slice(-9).toUpperCase()}`,
    securityHash: crypto
      .createHash('sha256')
      .update(`${receipt.receipt_number}:${receipt.transaction_hash || ''}:${transactionDate.toISOString()}`)
      .digest('hex')
      .slice(0, 12)
  };
};

// GET /receipts - Main receipts page
exports.getReceiptsPage = async (req, res) => {
  try {
    console.log('[Receipts] Page requested');
    const userId = req.session?.user?.ZenoPayID || 'demo-user';
    console.log('[Receipts] User ID:', userId);

    // Get receipt statistics
    let stats = {
      totalReceipts: 0,
      totalAmount: 0,
      sentCount: 0,
      receivedCount: 0
    };

    if (userId !== 'demo-user') {
      try {
        const receipts = await Receipt.find({ user_id: userId, status: 'success' });
        stats.totalReceipts = receipts.length;
        stats.totalAmount = receipts.reduce((sum, r) => sum + r.total_amount, 0);
        stats.sentCount = receipts.filter(r => r.transaction_type === 'sent').length;
        stats.receivedCount = receipts.filter(r => r.transaction_type === 'received').length;
      } catch (error) {
        console.error('[Receipts] Error calculating stats:', error);
      }
    } else {
      // Demo stats
      stats = {
        totalReceipts: 24,
        totalAmount: 8450.00,
        sentCount: 15,
        receivedCount: 9
      };
    }

    console.log('[Receipts] Rendering page with stats');
    res.render('receipts', {
      pageTitle: 'Payment Receipts - ZenoPay',
      user: req.session?.user || { FullName: 'Demo User', ZenoPayID: 'demo-user' },
      receipts: [],
      stats: stats
    });
  } catch (error) {
    console.error('[Receipts] CRITICAL ERROR:', error);
    return res.status(500).render('error-500', {
      pageTitle: 'Server Error - ZenoPay',
      errorId: `ERR-${Date.now().toString(36).toUpperCase()}`,
    });
  }
};

// GET /api/receipts - Fetch all receipts for user
exports.getReceipts = async (req, res) => {
  try {
    const userId = req.session?.user?.ZenoPayID || 'demo-user';
    const { page = 1, limit = 10, type, date_from, date_to, search, status } = req.query;

    // Build query
    const query = { user_id: userId };
    
    if (type && type !== 'all') {
      query.transaction_type = type;
    }
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (date_from || date_to) {
      query.transaction_date = {};
      if (date_from) query.transaction_date.$gte = new Date(date_from);
      if (date_to) query.transaction_date.$lte = new Date(date_to);
    }
    
    if (search) {
      query.$or = [
        { receipt_number: new RegExp(search, 'i') },
        { recipient_name: new RegExp(search, 'i') },
        { sender_name: new RegExp(search, 'i') }
      ];
    }

    // Fetch receipts with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const receipts = await Receipt.find(query)
      .sort({ transaction_date: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .lean();

    const total = await Receipt.countDocuments(query);

    res.json({
      success: true,
      data: receipts,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / parseInt(limit)),
        total_items: total,
        items_per_page: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('[Receipts] Error fetching receipts:', error);
    res.status(500).json({ success: false, message: 'Error fetching receipts' });
  }
};

// GET /api/receipts/:id - Fetch specific receipt details
exports.getReceiptDetail = async (req, res) => {
  try {
    const userId = req.session?.user?.ZenoPayID || 'demo-user';
    const { id } = req.params;

    const receipt = await Receipt.findOne({
      _id: id,
      user_id: userId
    }).populate('transaction_id');

    if (!receipt) {
      return res.status(404).json({ success: false, message: 'Receipt not found' });
    }

    res.json({ success: true, data: receipt });
  } catch (error) {
    console.error('[Receipts] Error fetching receipt detail:', error);
    res.status(500).json({ success: false, message: 'Error fetching receipt details' });
  }
};

// GET /api/receipts/transaction/:transaction_id - Get receipt for specific transaction
exports.getReceiptByTransaction = async (req, res) => {
  try {
    const userId = req.session?.user?.ZenoPayID || 'demo-user';
    const { transaction_id } = req.params;

    let receipt = await Receipt.findOne({
      transaction_id: transaction_id,
      user_id: userId
    });

    // If receipt doesn't exist, generate it
    if (!receipt) {
      const transaction = await TransactionHistory.findById(transaction_id);
      
      if (!transaction) {
        return res.status(404).json({ success: false, message: 'Transaction not found' });
      }

      receipt = await Receipt.createFromTransaction(transaction, userId);
    }

    res.json({ success: true, data: receipt });
  } catch (error) {
    console.error('[Receipts] Error fetching/generating receipt:', error);
    res.status(500).json({ success: false, message: 'Error processing receipt' });
  }
};

// POST /api/receipts/:id/download - Download receipt as PDF
exports.downloadReceiptPDF = async (req, res) => {
  try {
    const userId = req.session?.user?.ZenoPayID || 'demo-user';
    const { id } = req.params;

    const receipt = await Receipt.findOne({
      _id: id,
      user_id: userId
    });

    if (!receipt) {
      return res.status(404).json({ success: false, message: 'Receipt not found' });
    }

    // Generate PDF if not already generated
    if (!receipt.pdf_url) {
      const pdfUrl = await receiptPdfGenerator.generateReceiptPDF(receipt);
      receipt.pdf_url = pdfUrl;
      await receipt.save();
    }

    res.json({ success: true, pdf_url: receipt.pdf_url });
  } catch (error) {
    console.error('[Receipts] Error generating PDF:', error);
    res.status(500).json({ success: false, message: 'Error generating PDF' });
  }
};

// POST /api/receipts/:id/email - Email receipt to user
exports.emailReceipt = async (req, res) => {
  try {
    const userId = req.session?.user?.ZenoPayID || 'demo-user';
    const { id } = req.params;
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email address is required' });
    }

    const receipt = await Receipt.findOne({
      _id: id,
      user_id: userId
    });

    if (!receipt) {
      return res.status(404).json({ success: false, message: 'Receipt not found' });
    }

    // Generate PDF if not already generated
    if (!receipt.pdf_url) {
      const pdfUrl = await receiptPdfGenerator.generateReceiptPDF(receipt);
      receipt.pdf_url = pdfUrl;
      await receipt.save();
    }

    // Send email
    const emailService = new EmailService();
    await emailService.sendEmail({
      to: email,
      subject: `ZenoPay Receipt - ${receipt.receipt_number}`,
      html: `
        <h2>Your ZenoPay Receipt</h2>
        <p>Dear Customer,</p>
        <p>Please find attached your payment receipt for transaction ${receipt.receipt_number}.</p>
        <p><strong>Transaction Details:</strong></p>
        <ul>
          <li>Receipt Number: ${receipt.receipt_number}</li>
          <li>Amount: $${receipt.total_amount.toFixed(2)}</li>
          <li>Date: ${new Date(receipt.transaction_date).toLocaleDateString()}</li>
          <li>Status: ${receipt.status}</li>
        </ul>
        <p>Thank you for using ZenoPay!</p>
      `,
      attachments: [
        {
          filename: `Receipt_${receipt.receipt_number}.pdf`,
          path: receipt.pdf_url
        }
      ]
    });

    res.json({ success: true, message: 'Receipt sent successfully' });
  } catch (error) {
    console.error('[Receipts] Error emailing receipt:', error);
    res.status(500).json({ success: false, message: 'Error sending email' });
  }
};

// GET /api/receipts/search - Search receipts
exports.searchReceipts = async (req, res) => {
  try {
    const userId = req.session?.user?.ZenoPayID || 'demo-user';
    const { q, receipt_number, amount, recipient } = req.query;

    const query = { user_id: userId };
    const orConditions = [];

    if (q) {
      orConditions.push(
        { receipt_number: new RegExp(q, 'i') },
        { recipient_name: new RegExp(q, 'i') },
        { sender_name: new RegExp(q, 'i') },
        { description: new RegExp(q, 'i') }
      );
    }

    if (receipt_number) {
      orConditions.push({ receipt_number: new RegExp(receipt_number, 'i') });
    }

    if (recipient) {
      orConditions.push({ recipient_name: new RegExp(recipient, 'i') });
    }

    if (amount) {
      query.total_amount = parseFloat(amount);
    }

    if (orConditions.length > 0) {
      query.$or = orConditions;
    }

    const receipts = await Receipt.find(query)
      .sort({ transaction_date: -1 })
      .limit(20)
      .lean();

    res.json({ success: true, data: receipts });
  } catch (error) {
    console.error('[Receipts] Error searching receipts:', error);
    res.status(500).json({ success: false, message: 'Error searching receipts' });
  }
};

// GET /verify-receipt/:receipt_number - Public receipt verification
exports.verifyReceipt = async (req, res) => {
  try {
    res.render('receipt-verification', {
      pageTitle: 'Receipt Verification - ZenoPay',
      prefilledReceiptId: formatReceiptId(req.params.receipt_number || '')
    });
  } catch (error) {
    console.error('[Receipts] Error verifying receipt:', error);
    res.status(500).render('error-500');
  }
};

// GET /receipt/verify?id=XXX - Public verification page with optional query prefill
exports.getReceiptVerificationPage = async (req, res) => {
  try {
    const queryId = req.query?.id || '';

    return res.render('receipt-verification', {
      pageTitle: 'Receipt Verification - ZenoPay',
      prefilledReceiptId: formatReceiptId(queryId)
    });
  } catch (error) {
    console.error('[Receipts] Error loading verification page:', error);
    res.status(500).render('error-500');
  }
};

// GET /api/receipt/verify/:receiptId - Public API to verify receipt authenticity
exports.verifyReceiptApi = async (req, res) => {
  try {
    const formattedId = formatReceiptId(req.params.receiptId || '');

    if (!RECEIPT_ID_REGEX.test(formattedId)) {
      return res.status(400).json({
        verified: false,
        reason: 'Receipt ID format is invalid',
        code: 'INVALID_RECEIPT_FORMAT'
      });
    }

    const receipt = await Receipt.findOne({
      receipt_number: { $regex: `^${formattedId}$`, $options: 'i' }
    }).lean();

    if (!receipt || receipt.verification_status === 'failed') {
      return res.status(404).json({
        verified: false,
        reason: 'Receipt not found',
        code: 'RECEIPT_NOT_FOUND'
      });
    }

    return res.json({
      verified: true,
      receipt: mapReceiptForVerification(receipt)
    });
  } catch (error) {
    console.error('[Receipts] Error in verifyReceiptApi:', error);
    res.status(500).json({
      verified: false,
      reason: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
};

// POST /api/receipts/bulk-download - Download multiple receipts as ZIP
exports.downloadBulkReceipts = async (req, res) => {
  try {
    const { receiptIds } = req.body;
    
    if (!receiptIds || !Array.isArray(receiptIds) || receiptIds.length === 0) {
      return res.status(400).json({ success: false, message: 'No receipts selected' });
    }
    
    // TODO: Generate ZIP file with all receipts
    res.json({
      success: true,
      message: 'Bulk download started',
      downloadUrl: `/downloads/receipts-bulk-${Date.now()}.zip`
    });
  } catch (error) {
    console.error('[Receipts] Error downloading bulk receipts:', error);
    res.status(500).json({ success: false, message: 'Failed to download receipts' });
  }
};
