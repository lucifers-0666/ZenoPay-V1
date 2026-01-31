const mongoose = require('mongoose');

const contactSubmissionSchema = new mongoose.Schema({
  user_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'ZenoPayUser', 
    default: null 
  },
  
  // Contact Information
  name: { 
    type: String, 
    required: true, 
    trim: true,
    minlength: 2,
    maxlength: 100
  },
  email: { 
    type: String, 
    required: true, 
    lowercase: true,
    trim: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  phone: { 
    type: String, 
    default: null,
    trim: true
  },
  
  // Message Details
  subject: { 
    type: String, 
    required: true,
    enum: [
      'General Inquiry',
      'Technical Support',
      'Account Issues',
      'Payment Problems',
      'Feature Request',
      'Bug Report',
      'Partnership Inquiry',
      'Billing Question',
      'Security Concern',
      'Other'
    ]
  },
  message: { 
    type: String, 
    required: true,
    minlength: 10,
    maxlength: 2000
  },
  
  // Priority & Status
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: { 
    type: String, 
    enum: ['new', 'read', 'in_progress', 'replied', 'closed'],
    default: 'new'
  },
  
  // Attachments
  attachments: [{ 
    filename: String,
    originalname: String,
    mimetype: String,
    size: Number,
    url: String,
    uploaded_at: { type: Date, default: Date.now }
  }],
  
  // Tracking
  ip_address: { type: String, default: null },
  user_agent: { type: String, default: null },
  referrer: { type: String, default: null },
  
  // Admin Actions
  assigned_to: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'ZenoPayUser',
    default: null 
  },
  admin_notes: [{ 
    note: String,
    added_by: { type: mongoose.Schema.Types.ObjectId, ref: 'ZenoPayUser' },
    added_at: { type: Date, default: Date.now }
  }],
  
  // Reply Details
  reply_message: { type: String, default: null },
  replied_at: { type: Date, default: null },
  replied_by: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'ZenoPayUser',
    default: null 
  },
  
  // Timestamps
  submitted_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  closed_at: { type: Date, default: null }
});

// Indexes
contactSubmissionSchema.index({ email: 1 });
contactSubmissionSchema.index({ status: 1, submitted_at: -1 });
contactSubmissionSchema.index({ user_id: 1, submitted_at: -1 });
contactSubmissionSchema.index({ subject: 1 });
contactSubmissionSchema.index({ priority: 1 });

// Update timestamp on save
contactSubmissionSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  
  if (this.isModified('status')) {
    if (this.status === 'closed' && !this.closed_at) {
      this.closed_at = Date.now();
    }
  }
  
  next();
});

// Static method to get submission stats
contactSubmissionSchema.statics.getStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
  
  const total = await this.countDocuments();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayCount = await this.countDocuments({ submitted_at: { $gte: today } });
  
  const statusCounts = {};
  stats.forEach(stat => {
    statusCounts[stat._id] = stat.count;
  });
  
  return {
    total,
    today: todayCount,
    new: statusCounts.new || 0,
    read: statusCounts.read || 0,
    in_progress: statusCounts.in_progress || 0,
    replied: statusCounts.replied || 0,
    closed: statusCounts.closed || 0
  };
};

// Auto-assign priority based on keywords
contactSubmissionSchema.methods.autoAssignPriority = function() {
  const urgentKeywords = ['urgent', 'emergency', 'asap', 'immediately', 'critical', 'cannot access', 'locked out', 'fraud', 'unauthorized'];
  const highKeywords = ['problem', 'issue', 'error', 'failed', 'not working', 'broken', 'help'];
  
  const textToCheck = (this.subject + ' ' + this.message).toLowerCase();
  
  if (urgentKeywords.some(keyword => textToCheck.includes(keyword))) {
    this.priority = 'urgent';
  } else if (highKeywords.some(keyword => textToCheck.includes(keyword))) {
    this.priority = 'high';
  } else {
    this.priority = 'medium';
  }
};

// Generate ticket number
contactSubmissionSchema.virtual('ticket_number').get(function() {
  const date = new Date(this.submitted_at);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const id = this._id.toString().slice(-6).toUpperCase();
  return `ZP-${year}${month}-${id}`;
});

contactSubmissionSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('ContactSubmission', contactSubmissionSchema);
