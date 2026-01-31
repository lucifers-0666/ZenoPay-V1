// Monthly Statements Controller
const ZenoPayUser = require('../Models/ZenoPayUser');
const TransactionHistory = require('../Models/TransactionHistory');
const Statement = require('../Models/Statement');
const pdfGenerator = require('../Services/pdfGenerator');
const EmailService = require('../Services/EmailService');

// Helper function to calculate current month stats
async function calculateCurrentMonthStats(userId) {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const user = await ZenoPayUser.findOne({ ZenoPayID: userId });
    if (!user || !user.BankDetails || !user.BankDetails.AccountNumber) {
      return null;
    }

    const userAccountNumber = user.BankDetails.AccountNumber;

    const transactions = await TransactionHistory.find({
      TransactionTime: { $gte: startOfMonth, $lte: endOfMonth },
      $or: [
        { SenderAccountNumber: userAccountNumber },
        { ReceiverAccountNumber: userAccountNumber }
      ]
    });

    let totalSent = 0;
    let totalReceived = 0;
    let sentCount = 0;
    let receivedCount = 0;
    let feesPaid = 0;

    transactions.forEach(txn => {
      const amount = parseFloat(txn.Amount.toString());
      const fee = txn.TransactionFee ? parseFloat(txn.TransactionFee.toString()) : 0;

      if (txn.SenderAccountNumber === userAccountNumber) {
        totalSent += amount;
        sentCount++;
        feesPaid += fee;
      } else {
        totalReceived += amount;
        receivedCount++;
      }
    });

    return {
      totalSpent: totalSent + feesPaid,
      moneySent: { amount: totalSent, count: sentCount },
      moneyReceived: { amount: totalReceived, count: receivedCount },
      feesPaid
    };
  } catch (error) {
    console.error('Error in calculateCurrentMonthStats:', error);
    return null;
  }
}

// Helper function to get month name
function getMonthName(month) {
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
                 'July', 'August', 'September', 'October', 'November', 'December'];
  return months[month - 1];
}

exports.getStatementsPage = async (req, res) => {
  try {
    console.log('[Statements] Page requested');
    
    // Temporary: Authentication disabled for design testing
    // Use demo user or show empty state
    const userId = req.session?.user?.ZenoPayID || 'demo-user';
    console.log('[Statements] User ID:', userId);
    
    // Calculate current month stats (only if real user)
    let currentMonthStats = null;
    if (userId !== 'demo-user') {
      try {
        console.log('[Statements] Calculating stats for user');
        currentMonthStats = await calculateCurrentMonthStats(userId);
      } catch (error) {
        console.error('[Statements] Error calculating stats:', error);
      }
    }

    console.log('[Statements] Rendering page with stats:', currentMonthStats ? 'real data' : 'demo data');
    
    res.render('statements', {
      pageTitle: 'Monthly Statements - ZenoPay',
      user: req.session?.user || { FullName: 'Demo User', ZenoPayID: 'demo-user' },
      isLoggedIn: !!req.session?.user,
      currentMonthStats: currentMonthStats || {
        totalSpent: 3250.00,
        moneySent: { amount: 3250.00, count: 28 },
        moneyReceived: { amount: 4800.00, count: 17 },
        feesPaid: 32.50
      }
    });
  } catch (error) {
    console.error('[Statements] CRITICAL ERROR:', error);
    res.status(500).render('error-500');
  }
};

// GET /api/statements - Fetch all statements for user
exports.getStatements = async (req, res) => {
  try {
    // Temporary: Authentication disabled for design testing
    const userId = req.session.user?.ZenoPayID || 'demo-user';
    const { page = 1, limit = 10, year, status } = req.query;

    // Build query
    const query = { user_id: userId };
    if (year) query.year = parseInt(year);
    if (status) query.status = status;

    // Fetch statements with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const statements = await Statement.find(query)
      .sort({ year: -1, month: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .lean();

    const total = await Statement.countDocuments(query);

    // Format statements for frontend
    const formattedStatements = statements.map(stmt => ({
      id: stmt._id,
      statement_month: stmt.statement_month,
      period: {
        start: stmt.statement_period_start,
        end: stmt.statement_period_end
      },
      total_transactions: stmt.total_transactions,
      total_sent: parseFloat(stmt.total_amount_sent.toString()),
      total_received: parseFloat(stmt.total_amount_received.toString()),
      fees: parseFloat(stmt.fees_charged.toString()),
      opening_balance: parseFloat(stmt.opening_balance.toString()),
      closing_balance: parseFloat(stmt.closing_balance.toString()),
      status: stmt.status,
      generated_at: stmt.generated_at,
      pdf_url: stmt.pdf_url
    }));

    res.json({
      success: true,
      statements: formattedStatements,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching statements:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch statements' });
  }
};

// GET /api/statements/:id - Get specific statement details
exports.getStatementDetail = async (req, res) => {
  try {
    // Temporary: Authentication disabled for design testing
    const userId = req.session.user?.ZenoPayID || 'demo-user';
    const { id } = req.params;

    const statement = await Statement.findOne({ _id: id, user_id: userId }).lean();

    if (!statement) {
      return res.status(404).json({ success: false, message: 'Statement not found' });
    }

    // Fetch transactions for this period
    const user = await ZenoPayUser.findOne({ ZenoPayID: userId });
    const userAccountNumber = user.BankDetails?.AccountNumber;

    const transactions = await TransactionHistory.find({
      TransactionTime: {
        $gte: statement.statement_period_start,
        $lte: statement.statement_period_end
      },
      $or: [
        { SenderAccountNumber: userAccountNumber },
        { ReceiverAccountNumber: userAccountNumber }
      ]
    }).sort({ TransactionTime: -1 }).lean();

    // Format transactions
    const formattedTransactions = transactions.map(txn => {
      const isSent = txn.SenderAccountNumber === userAccountNumber;
      const amount = parseFloat(txn.Amount.toString());
      const fee = txn.TransactionFee ? parseFloat(txn.TransactionFee.toString()) : 0;

      return {
        id: txn.TransactionID,
        date: txn.TransactionTime,
        type: isSent ? 'sent' : 'received',
        description: isSent 
          ? `Transfer to ${txn.ReceiverHolderName}`
          : `Transfer from ${txn.SenderHolderName}`,
        amount: isSent ? -amount : amount,
        fee: isSent ? fee : 0,
        status: txn.TransactionStatus || 'completed',
        balance: isSent 
          ? parseFloat(txn.SenderBalanceAfter.toString())
          : parseFloat(txn.ReceiverBalanceAfter.toString())
      };
    });

    // Calculate insights
    const sentTransactions = formattedTransactions.filter(t => t.type === 'sent');
    const receivedTransactions = formattedTransactions.filter(t => t.type === 'received');
    
    const insights = {
      averageTransaction: transactions.length > 0 
        ? (parseFloat(statement.total_amount_sent.toString()) + parseFloat(statement.total_amount_received.toString())) / transactions.length
        : 0,
      largestTransaction: Math.max(...transactions.map(t => parseFloat(t.Amount.toString())), 0),
      sentCount: sentTransactions.length,
      receivedCount: receivedTransactions.length
    };

    // Generate daily volume chart data
    const dailyVolume = [];
    const daysInMonth = new Date(statement.year, statement.month, 0).getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dayStart = new Date(statement.year, statement.month - 1, day, 0, 0, 0);
      const dayEnd = new Date(statement.year, statement.month - 1, day, 23, 59, 59);
      
      const dayTransactions = transactions.filter(t => {
        const txnDate = new Date(t.TransactionTime);
        return txnDate >= dayStart && txnDate <= dayEnd;
      });

      const dayTotal = dayTransactions.reduce((sum, t) => sum + parseFloat(t.Amount.toString()), 0);
      
      dailyVolume.push({
        day,
        amount: dayTotal,
        count: dayTransactions.length
      });
    }

    res.json({
      success: true,
      statement: {
        ...statement,
        total_sent: parseFloat(statement.total_amount_sent.toString()),
        total_received: parseFloat(statement.total_amount_received.toString()),
        fees: parseFloat(statement.fees_charged.toString()),
        opening_balance: parseFloat(statement.opening_balance.toString()),
        closing_balance: parseFloat(statement.closing_balance.toString()),
        transactions: formattedTransactions,
        insights,
        chartData: { dailyVolume }
      }
    });
  } catch (error) {
    console.error('Error loading statement detail:', error);
    res.status(500).json({ success: false, message: 'Failed to load statement' });
  }
};

// POST /api/statements/generate - Generate statement for specific period
exports.generateStatement = async (req, res) => {
  try {
    // Temporary: Authentication disabled for design testing
    const userId = req.session.user?.ZenoPayID || 'demo-user';
    const { month, year, start_date, end_date } = req.body;

    let periodStart, periodEnd, statementMonth, statementYear, statementMonthName;

    if (month && year) {
      // Monthly statement
      statementYear = parseInt(year);
      statementMonth = parseInt(month);
      statementMonthName = `${getMonthName(statementMonth)} ${statementYear}`;
      periodStart = new Date(statementYear, statementMonth - 1, 1);
      periodEnd = new Date(statementYear, statementMonth, 0, 23, 59, 59);
    } else if (start_date && end_date) {
      // Custom date range
      periodStart = new Date(start_date);
      periodEnd = new Date(end_date);
      statementMonthName = `${periodStart.toLocaleDateString()} - ${periodEnd.toLocaleDateString()}`;
      statementYear = periodStart.getFullYear();
      statementMonth = periodStart.getMonth() + 1;
    } else {
      return res.status(400).json({ success: false, message: 'Invalid period specified' });
    }

    // Check if statement already exists
    const existingStatement = await Statement.findOne({
      user_id: userId,
      statement_period_start: periodStart,
      statement_period_end: periodEnd
    });

    if (existingStatement) {
      return res.json({
        success: true,
        message: 'Statement already exists',
        statement_id: existingStatement._id,
        status: existingStatement.status
      });
    }

    // Fetch user and transactions
    const user = await ZenoPayUser.findOne({ ZenoPayID: userId });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const userAccountNumber = user.BankDetails?.AccountNumber;

    const transactions = await TransactionHistory.find({
      TransactionTime: { $gte: periodStart, $lte: periodEnd },
      $or: [
        { SenderAccountNumber: userAccountNumber },
        { ReceiverAccountNumber: userAccountNumber }
      ]
    }).sort({ TransactionTime: 1 });

    // Calculate totals
    let totalSent = 0;
    let totalReceived = 0;
    let feesCharged = 0;
    let sentCount = 0;
    let receivedCount = 0;

    transactions.forEach(txn => {
      const amount = parseFloat(txn.Amount.toString());
      const fee = txn.TransactionFee ? parseFloat(txn.TransactionFee.toString()) : 0;

      if (txn.SenderAccountNumber === userAccountNumber) {
        totalSent += amount;
        feesCharged += fee;
        sentCount++;
      } else {
        totalReceived += amount;
        receivedCount++;
      }
    });

    // Calculate opening balance (from first transaction)
    let openingBalance = 0;
    if (transactions.length > 0) {
      const firstTxn = transactions[0];
      if (firstTxn.SenderAccountNumber === userAccountNumber) {
        openingBalance = parseFloat(firstTxn.SenderBalanceBefore.toString());
      } else {
        openingBalance = parseFloat(firstTxn.ReceiverBalanceBefore.toString());
      }
    }

    // Calculate closing balance
    const closingBalance = openingBalance + totalReceived - totalSent - feesCharged;

    // Create statement
    const statement = new Statement({
      user_id: userId,
      statement_month: statementMonthName,
      statement_period_start: periodStart,
      statement_period_end: periodEnd,
      total_transactions: transactions.length,
      total_amount_sent: totalSent,
      total_amount_received: totalReceived,
      fees_charged: feesCharged,
      opening_balance: openingBalance,
      closing_balance: closingBalance,
      month: statementMonth,
      year: statementYear,
      status: 'processing',
      transaction_breakdown: {
        sent_count: sentCount,
        received_count: receivedCount,
        total_debits: totalSent,
        total_credits: totalReceived
      }
    });

    await statement.save();

    // Generate PDF asynchronously
    setImmediate(async () => {
      try {
        const pdfResult = await pdfGenerator.generateStatementPDF(
          statement,
          user,
          transactions.map(t => ({ ...t, userAccountNumber }))
        );

        statement.pdf_url = pdfResult.url;
        statement.status = 'ready';
        await statement.save();
      } catch (error) {
        console.error('Error generating PDF:', error);
        statement.status = 'failed';
        await statement.save();
      }
    });

    res.json({
      success: true,
      message: 'Statement generation started',
      statement_id: statement._id,
      status: 'processing'
    });
  } catch (error) {
    console.error('Error generating statement:', error);
    res.status(500).json({ success: false, message: 'Failed to generate statement' });
  }
};

// GET /api/statements/:id/download - Download statement PDF
exports.downloadStatementPDF = async (req, res) => {
  try {
    // Temporary: Authentication disabled for design testing
    const userId = req.session.user?.ZenoPayID || 'demo-user';
    const { id } = req.params;

    const statement = await Statement.findOne({ _id: id, user_id: userId });

    if (!statement) {
      return res.status(404).json({ success: false, message: 'Statement not found' });
    }

    if (statement.status !== 'ready' || !statement.pdf_url) {
      return res.status(400).json({ 
        success: false, 
        message: 'Statement PDF is not ready yet',
        status: statement.status 
      });
    }

    res.json({
      success: true,
      download_url: statement.pdf_url,
      filename: `ZenoPay_Statement_${statement.statement_month.replace(/\s/g, '_')}.pdf`
    });
  } catch (error) {
    console.error('Error downloading PDF:', error);
    res.status(500).json({ success: false, message: 'Failed to download PDF' });
  }
};

// GET /api/statements/:id/transactions - Get transactions for statement
exports.getStatementTransactions = async (req, res) => {
  try {
    // Temporary: Authentication disabled for design testing
    const userId = req.session.user?.ZenoPayID || 'demo-user';
    const { id } = req.params;
    const { page = 1, limit = 50, type } = req.query;

    const statement = await Statement.findOne({ _id: id, user_id: userId });

    if (!statement) {
      return res.status(404).json({ success: false, message: 'Statement not found' });
    }

    const user = await ZenoPayUser.findOne({ ZenoPayID: userId });
    const userAccountNumber = user.BankDetails?.AccountNumber;

    let query = {
      TransactionTime: {
        $gte: statement.statement_period_start,
        $lte: statement.statement_period_end
      },
      $or: [
        { SenderAccountNumber: userAccountNumber },
        { ReceiverAccountNumber: userAccountNumber }
      ]
    };

    // Filter by type if specified
    if (type === 'sent') {
      query = { ...query, SenderAccountNumber: userAccountNumber };
      delete query.$or;
    } else if (type === 'received') {
      query = { ...query, ReceiverAccountNumber: userAccountNumber };
      delete query.$or;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const transactions = await TransactionHistory.find(query)
      .sort({ TransactionTime: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .lean();

    const total = await TransactionHistory.countDocuments(query);

    const formattedTransactions = transactions.map(txn => {
      const isSent = txn.SenderAccountNumber === userAccountNumber;
      return {
        id: txn.TransactionID,
        date: txn.TransactionTime,
        type: isSent ? 'sent' : 'received',
        description: isSent 
          ? `To: ${txn.ReceiverHolderName}`
          : `From: ${txn.SenderHolderName}`,
        amount: parseFloat(txn.Amount.toString()),
        fee: txn.TransactionFee ? parseFloat(txn.TransactionFee.toString()) : 0,
        status: txn.TransactionStatus || 'completed'
      };
    });

    res.json({
      success: true,
      transactions: formattedTransactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching statement transactions:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch transactions' });
  }
};

// POST /api/statements/:id/email - Email statement to user
exports.emailStatement = async (req, res) => {
  try {
    // Temporary: Authentication disabled for design testing
    const userId = req.session.user?.ZenoPayID || 'demo-user';
    const { id } = req.params;

    const statement = await Statement.findOne({ _id: id, user_id: userId });

    if (!statement) {
      return res.status(404).json({ success: false, message: 'Statement not found' });
    }

    if (statement.status !== 'ready' || !statement.pdf_url) {
      return res.status(400).json({ 
        success: false, 
        message: 'Statement is not ready to be emailed' 
      });
    }

    const user = await ZenoPayUser.findOne({ ZenoPayID: userId });

    // Send email with PDF attachment
    await EmailService.sendEmail({
      to: user.Email,
      subject: `Your ZenoPay Statement - ${statement.statement_month}`,
      html: `
        <h2>Your ZenoPay Statement is Ready</h2>
        <p>Dear ${user.FullName},</p>
        <p>Your statement for ${statement.statement_month} is attached to this email.</p>
        <p><strong>Statement Summary:</strong></p>
        <ul>
          <li>Total Transactions: ${statement.total_transactions}</li>
          <li>Opening Balance: $${parseFloat(statement.opening_balance.toString()).toFixed(2)}</li>
          <li>Closing Balance: $${parseFloat(statement.closing_balance.toString()).toFixed(2)}</li>
        </ul>
        <p>Thank you for using ZenoPay!</p>
      `,
      attachments: [
        {
          filename: `ZenoPay_Statement_${statement.statement_month.replace(/\s/g, '_')}.pdf`,
          path: statement.pdf_url
        }
      ]
    });

    res.json({
      success: true,
      message: `Statement emailed to ${user.Email}`
    });
  } catch (error) {
    console.error('Error emailing statement:', error);
    res.status(500).json({ success: false, message: 'Failed to email statement' });
  }
};
