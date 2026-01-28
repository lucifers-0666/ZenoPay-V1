// Support Center Controller
const ZenoPayUser = require('../Models/ZenoPayUser');

// Mock data for help categories and articles
const helpCategories = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: 'fa-rocket',
    description: 'Learn the basics of using ZenoPay',
    articleCount: 12
  },
  {
    id: 'account-security',
    title: 'Account & Security',
    icon: 'fa-shield-halved',
    description: 'Keep your account safe and secure',
    articleCount: 18
  },
  {
    id: 'payments-transactions',
    title: 'Payments & Transactions',
    icon: 'fa-money-bill-transfer',
    description: 'Send, receive, and manage payments',
    articleCount: 24
  },
  {
    id: 'verification-kyc',
    title: 'Verification & KYC',
    icon: 'fa-id-card',
    description: 'Complete your identity verification',
    articleCount: 8
  },
  {
    id: 'technical-issues',
    title: 'Technical Issues',
    icon: 'fa-wrench',
    description: 'Troubleshoot common problems',
    articleCount: 15
  },
  {
    id: 'billing-fees',
    title: 'Billing & Fees',
    icon: 'fa-receipt',
    description: 'Understand pricing and charges',
    articleCount: 10
  }
];

const popularArticles = [
  {
    id: 1,
    title: 'How to send money to friends and family',
    excerpt: 'Learn how to quickly send money using ZenoPay with just an email or phone number.',
    readTime: '3 min read',
    views: 15420,
    helpful: 1234
  },
  {
    id: 2,
    title: 'Setting up two-factor authentication',
    excerpt: 'Secure your account with an extra layer of protection using 2FA.',
    readTime: '5 min read',
    views: 12850,
    helpful: 982
  },
  {
    id: 3,
    title: 'Understanding transaction fees',
    excerpt: 'Learn about our transparent fee structure and when charges apply.',
    readTime: '4 min read',
    views: 11200,
    helpful: 856
  },
  {
    id: 4,
    title: 'Completing KYC verification',
    excerpt: 'Step-by-step guide to verifying your identity and unlocking full features.',
    readTime: '6 min read',
    views: 9800,
    helpful: 745
  },
  {
    id: 5,
    title: 'What to do if a payment fails',
    excerpt: 'Troubleshoot failed payments and learn how to resolve common issues.',
    readTime: '4 min read',
    views: 8600,
    helpful: 623
  }
];

const contactOptions = [
  {
    id: 'live-chat',
    title: 'Live Chat',
    description: 'Chat with our support team',
    icon: 'fa-comments',
    status: 'online',
    responseTime: 'Avg. response: 2 minutes',
    available: true
  },
  {
    id: 'email',
    title: 'Email Support',
    description: 'Send us an email',
    icon: 'fa-envelope',
    email: 'support@zenopay.com',
    responseTime: 'Avg. response: 24 hours'
  },
  {
    id: 'phone',
    title: 'Phone Support',
    description: 'Call us directly',
    icon: 'fa-phone',
    phone: '+1 (800) 123-4567',
    hours: 'Mon-Fri, 9 AM - 6 PM EST'
  },
  {
    id: 'ticket',
    title: 'Submit a Ticket',
    description: 'Create a support request',
    icon: 'fa-ticket',
    responseTime: 'Avg. response: 12 hours',
    link: '/report-issue'
  }
];

const systemStatus = {
  status: 'operational', // operational, degraded, outage
  message: 'All Systems Operational',
  lastChecked: new Date(),
  services: [
    { name: 'Payment Processing', status: 'operational' },
    { name: 'API Services', status: 'operational' },
    { name: 'Mobile App', status: 'operational' },
    { name: 'Web Dashboard', status: 'operational' }
  ]
};

exports.getSupportCenter = async (req, res) => {
  try {
    res.render('support-center', {
      pageTitle: 'Support Center - ZenoPay',
      helpCategories,
      popularArticles,
      contactOptions,
      systemStatus
    });
  } catch (error) {
    console.error('Error loading support center:', error);
    res.status(500).send('Error loading support center');
  }
};

// Search help articles
exports.searchHelpArticles = async (req, res) => {
  try {
    const { query } = req.query;
    
    // Mock search results
    const results = popularArticles.filter(article =>
      article.title.toLowerCase().includes(query.toLowerCase()) ||
      article.excerpt.toLowerCase().includes(query.toLowerCase())
    );
    
    res.json({ success: true, results });
  } catch (error) {
    console.error('Error searching articles:', error);
    res.status(500).json({ success: false, message: 'Search failed' });
  }
};

// Get category articles
exports.getCategoryArticles = async (req, res) => {
  try {
    const { categoryId } = req.params;
    
    // Find category
    const category = helpCategories.find(cat => cat.id === categoryId);
    
    if (!category) {
      return res.status(404).send('Category not found');
    }
    
    // Mock articles for category
    const articles = popularArticles.slice(0, category.articleCount);
    
    res.json({ success: true, category, articles });
  } catch (error) {
    console.error('Error loading category:', error);
    res.status(500).json({ success: false, message: 'Failed to load category' });
  }
};

// Initialize live chat
exports.initiateLiveChat = async (req, res) => {
  try {
    const zenoPayId = req.session.user?.ZenoPayID || "ZP-DEMO2024";
    const user = await ZenoPayUser.findOne({ ZenoPayID: zenoPayId });
    
    // Mock chat initialization
    const chatSession = {
      sessionId: 'CHAT-' + Date.now(),
      status: 'connecting',
      estimatedWaitTime: '2 minutes',
      user: {
        name: user?.Name || 'Guest',
        email: user?.Email || ''
      }
    };
    
    res.json({ success: true, chatSession });
  } catch (error) {
    console.error('Error initiating chat:', error);
    res.status(500).json({ success: false, message: 'Failed to start chat' });
  }
};
