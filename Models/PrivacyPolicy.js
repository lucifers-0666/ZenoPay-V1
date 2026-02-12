const mongoose = require("mongoose");

const PrivacyPolicySectionSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  order: {
    type: Number,
    required: true
  }
}, { _id: false });

const PrivacyPolicySchema = new mongoose.Schema({
  version: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    // Format: "1.0", "1.1", "2.0", etc.
  },
  
  sections: [PrivacyPolicySectionSchema],
  
  publishedDate: {
    type: Date,
    default: null
  },
  
  effectiveDate: {
    type: Date,
    required: true
  },
  
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  
  isCurrent: {
    type: Boolean,
    default: false,
    index: true
  },
  
  changeSummary: {
    type: String,
    default: ""
  },
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "AdminUser",
    required: false
  },
  
  status: {
    type: String,
    enum: ["draft", "published", "archived"],
    default: "draft",
    index: true
  },
  
  // SEO Meta fields
  metaTitle: {
    type: String,
    default: "Privacy Policy - ZenoPay"
  },
  
  metaDescription: {
    type: String,
    default: "Learn how ZenoPay collects, uses, and protects your personal data."
  }
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

// Index for querying current published policy
PrivacyPolicySchema.index({ isCurrent: 1, status: 1 });

// Pre-save middleware to update lastUpdated
PrivacyPolicySchema.pre('save', function() {
  this.lastUpdated = new Date();
});

// Static method to get current published policy
PrivacyPolicySchema.statics.getCurrentPolicy = async function() {
  return await this.findOne({ 
    isCurrent: true, 
    status: "published" 
  }).sort({ publishedDate: -1 });
};

// Static method to get all published policies (archive)
PrivacyPolicySchema.statics.getArchive = async function() {
  return await this.find({ 
    status: "published" 
  }).sort({ publishedDate: -1 }).select('version publishedDate effectiveDate changeSummary');
};

// Static method to publish a policy
PrivacyPolicySchema.statics.publishPolicy = async function(policyId) {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Set all other policies to not current
    await this.updateMany(
      { isCurrent: true },
      { isCurrent: false },
      { session }
    );
    
    // Publish the selected policy
    const policy = await this.findByIdAndUpdate(
      policyId,
      { 
        status: "published",
        isCurrent: true,
        publishedDate: new Date()
      },
      { new: true, session }
    );
    
    await session.commitTransaction();
    return policy;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

// Instance method to archive this policy
PrivacyPolicySchema.methods.archive = async function() {
  this.status = "archived";
  this.isCurrent = false;
  return await this.save();
};

const PrivacyPolicy = mongoose.model("PrivacyPolicy", PrivacyPolicySchema);

module.exports = PrivacyPolicy;
