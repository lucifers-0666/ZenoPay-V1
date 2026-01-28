// Payment Receipts Controller
const ZenoPayUser = require('../Models/ZenoPayUser');
const TransactionHistory = require('../Models/TransactionHistory');

// Mock receipts data
const mockReceipts = [
  {
    receiptId: 'RCP-20250127001',
    transactionId: 'TXN-20250127890',
    date: new Date('2025-01-27T14:30:00'),
    recipientName: 'John Doe',
    recipientEmail: 'john@example.com',
    senderName: 'Demo User',
    senderEmail: 'demo@zenopay.com',
    amount: 150.00,
    type: 'sent',
    paymentMethod: { type: 'card', last4: '4242', brand: 'Visa' },
    status: 'completed',
    transactionFee: 1.50,
    netAmount: 148.50,
    description: 'Payment for services',
    referenceNumber: 'REF-ABC123'
  },
  {
    receiptId: 'RCP-20250126002',
    transactionId: 'TXN-20250126567',
    date: new Date('2025-01-26T10:15:00'),
    recipientName: 'Demo User',
    recipientEmail: 'demo@zenopay.com',
    senderName: 'Jane Smith',
    senderEmail: 'jane@example.com',
    amount: 500.00,
    type: 'received',
    paymentMethod: { type: 'bank', name: 'Chase Bank' },
    status: 'completed',
    transactionFee: 0,
    netAmount: 500.00,
    description: 'Invoice payment',
    referenceNumber: 'REF-XYZ789'
  },
  {
    receiptId: 'RCP-20250125003',
    transactionId: 'TXN-20250125234',
    date: new Date('2025-01-25T16:45:00'),
    recipientName: 'Store ABC',
    recipientEmail: 'store@abc.com',
    senderName: 'Demo User',
    senderEmail: 'demo@zenopay.com',
    amount: 89.99,
    type: 'sent',
    paymentMethod: { type: 'card', last4: '1234', brand: 'Mastercard' },
    status: 'refunded',
    transactionFee: 0.90,
    netAmount: 0,
    refundDate: new Date('2025-01-26'),
    refundAmount: 89.99,
    description: 'Product purchase',
    referenceNumber: 'REF-DEF456'
  }
];

exports.getReceiptsPage = async (req, res) => {
  try {
    const { type, status, dateFrom, dateTo, search } = req.query;
    
    let receipts = [...mockReceipts];
    
    // Apply filters
    if (type) {
      receipts = receipts.filter(r => r.type === type);
    }
    
    if (status) {
      receipts = receipts.filter(r => r.status === status);
    }
    
    if (search) {
      receipts = receipts.filter(r =>
        r.transactionId.includes(search) ||
        r.recipientName.toLowerCase().includes(search.toLowerCase()) ||
        r.senderName.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    res.render('receipts', {
      pageTitle: 'Payment Receipts - ZenoPay',
      receipts,
      filters: { type, status, dateFrom, dateTo, search }
    });
  } catch (error) {
    console.error('Error loading receipts:', error);
    res.status(500).send('Error loading receipts');
  }
};

exports.getReceiptDetail = async (req, res) => {
  try {
    const { receiptId } = req.params;
    
    const receipt = mockReceipts.find(r => r.receiptId === receiptId);
    
    if (!receipt) {
      return res.status(404).json({ success: false, message: 'Receipt not found' });
    }
    
    res.json({ success: true, receipt });
  } catch (error) {
    console.error('Error loading receipt:', error);
    res.status(500).json({ success: false, message: 'Failed to load receipt' });
  }
};

exports.downloadReceiptPDF = async (req, res) => {
  try {
    const { receiptId } = req.params;
    
    // TODO: Generate PDF receipt
    res.json({
      success: true,
      message: 'PDF download started',
      downloadUrl: `/downloads/receipt-${receiptId}.pdf`
    });
  } catch (error) {
    console.error('Error downloading receipt:', error);
    res.status(500).json({ success: false, message: 'Failed to download receipt' });
  }
};

exports.emailReceipt = async (req, res) => {
  try {
    const { receiptId } = req.params;
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email required' });
    }
    
    // TODO: Send email with receipt
    console.log(`Emailing receipt ${receiptId} to ${email}`);
    
    res.json({
      success: true,
      message: 'Receipt emailed successfully'
    });
  } catch (error) {
    console.error('Error emailing receipt:', error);
    res.status(500).json({ success: false, message: 'Failed to email receipt' });
  }
};

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
    console.error('Error downloading bulk receipts:', error);
    res.status(500).json({ success: false, message: 'Failed to download receipts' });
  }
};
