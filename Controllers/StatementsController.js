// Monthly Statements Controller
const ZenoPayUser = require('../Models/ZenoPayUser');
const TransactionHistory = require('../Models/TransactionHistory');

// Mock statements data
const mockStatements = [
  {
    period: { month: 1, year: 2025, label: 'January 2025' },
    transactionCount: 45,
    totalSent: 3250.00,
    totalReceived: 4800.00,
    totalFees: 32.50,
    netAmount: 1517.50,
    openingBalance: 5000.00,
    closingBalance: 6517.50
  },
  {
    period: { month: 12, year: 2024, label: 'December 2024' },
    transactionCount: 52,
    totalSent: 4100.00,
    totalReceived: 3900.00,
    totalFees: 41.00,
    netAmount: -241.00,
    openingBalance: 5241.00,
    closingBalance: 5000.00
  },
  {
    period: { month: 11, year: 2024, label: 'November 2024' },
    transactionCount: 38,
    totalSent: 2800.00,
    totalReceived: 5200.00,
    totalFees: 28.00,
    netAmount: 2372.00,
    openingBalance: 2869.00,
    closingBalance: 5241.00
  }
];

const currentMonthStats = {
  totalSpent: 3250.00,
  moneySent: { amount: 3250.00, count: 28 },
  moneyReceived: { amount: 4800.00, count: 17 },
  feesPaid: 32.50
};

exports.getStatementsPage = async (req, res) => {
  try {
    res.render('statements', {
      pageTitle: 'Monthly Statements - ZenoPay',
      statements: mockStatements,
      currentMonthStats
    });
  } catch (error) {
    console.error('Error loading statements:', error);
    res.status(500).send('Error loading statements');
  }
};

exports.getStatementDetail = async (req, res) => {
  try {
    const { month, year } = req.params;
    
    const statement = mockStatements.find(s =>
      s.period.month === parseInt(month) && s.period.year === parseInt(year)
    );
    
    if (!statement) {
      return res.status(404).json({ success: false, message: 'Statement not found' });
    }
    
    // Mock transaction details
    const transactions = [
      {
        date: new Date(year, month - 1, 5),
        description: 'Payment received from John Doe',
        type: 'received',
        amount: 500.00,
        fee: 0,
        balance: statement.openingBalance + 500
      },
      {
        date: new Date(year, month - 1, 10),
        description: 'Payment to Amazon',
        type: 'sent',
        amount: -150.00,
        fee: 1.50,
        balance: statement.openingBalance + 500 - 150 - 1.50
      }
      // ... more transactions
    ];
    
    // Mock insights
    const insights = {
      spendingChange: -15,
      topCategory: 'Shopping',
      highestTransaction: 500.00
    };
    
    // Mock chart data
    const chartData = {
      categoryBreakdown: [
        { category: 'Shopping', amount: 1200, percentage: 37 },
        { category: 'Food & Dining', amount: 800, percentage: 25 },
        { category: 'Transportation', amount: 500, percentage: 15 },
        { category: 'Entertainment', amount: 400, percentage: 12 },
        { category: 'Other', amount: 350, percentage: 11 }
      ],
      dailyVolume: Array.from({ length: 30 }, (_, i) => ({
        day: i + 1,
        amount: Math.random() * 200 + 50
      }))
    };
    
    res.json({
      success: true,
      statement: {
        ...statement,
        transactions,
        insights,
        chartData
      }
    });
  } catch (error) {
    console.error('Error loading statement detail:', error);
    res.status(500).json({ success: false, message: 'Failed to load statement' });
  }
};

exports.downloadStatementPDF = async (req, res) => {
  try {
    const { month, year } = req.params;
    
    // TODO: Generate PDF
    res.json({
      success: true,
      message: 'PDF generation started',
      downloadUrl: `/downloads/statement-${month}-${year}.pdf`
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ success: false, message: 'Failed to generate PDF' });
  }
};

exports.downloadStatementCSV = async (req, res) => {
  try {
    const { month, year } = req.params;
    
    // TODO: Generate CSV
    res.json({
      success: true,
      message: 'CSV generation started',
      downloadUrl: `/downloads/statement-${month}-${year}.csv`
    });
  } catch (error) {
    console.error('Error generating CSV:', error);
    res.status(500).json({ success: false, message: 'Failed to generate CSV' });
  }
};

exports.emailStatement = async (req, res) => {
  try {
    const { month, year } = req.params;
    const { email } = req.body;
    
    // TODO: Send email with statement
    console.log(`Emailing statement ${month}/${year} to ${email}`);
    
    res.json({
      success: true,
      message: 'Statement emailed successfully'
    });
  } catch (error) {
    console.error('Error emailing statement:', error);
    res.status(500).json({ success: false, message: 'Failed to email statement' });
  }
};
