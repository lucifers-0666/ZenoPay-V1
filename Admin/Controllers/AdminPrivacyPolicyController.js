const PrivacyPolicy = require("../../Models/PrivacyPolicy");
const UserConsent = require("../../Models/UserConsent");
const ZenoPayUser = require("../../Models/ZenoPayUser");
const EmailService = require("../../Services/EmailService");

// GET Admin Privacy Policy Management Dashboard
const getPrivacyPolicyDashboard = async (req, res) => {
  try {
    const policies = await PrivacyPolicy.find()
      .sort({ createdAt: -1 })
      .select('version status publishedDate effectiveDate changeSummary isCurrent createdAt');
    
    const currentPolicy = await PrivacyPolicy.getCurrentPolicy();
    
    // Get acceptance stats for current policy
    let acceptanceCount = 0;
    let totalUsers = 0;
    
    if (currentPolicy) {
      acceptanceCount = await UserConsent.getAcceptanceCount(currentPolicy.version, 'privacy');
      totalUsers = await ZenoPayUser.countDocuments({ Role: 'user' });
    }
    
    res.locals.adminPage = "privacy";
    res.render("admin/privacy-policy-management", {
      user: req.session.user,
      pageTitle: "Privacy Policy Management - Admin",
      page: "privacy",
      adminPage: "privacy",
      policies,
      currentPolicy,
      acceptanceCount,
      totalUsers,
      acceptancePercentage: totalUsers > 0 ? ((acceptanceCount / totalUsers) * 100).toFixed(1) : 0
    });
  } catch (error) {
    console.error("Privacy Policy Dashboard Error:", error);
    res.status(500).send("Error loading privacy policy dashboard");
  }
};

// GET Create New Privacy Policy Version Form
const getCreatePolicyForm = async (req, res) => {
  try {
    // Get the latest version to suggest next version number
    const latestPolicy = await PrivacyPolicy.findOne()
      .sort({ createdAt: -1 })
      .select('version');
    
    let suggestedVersion = "1.0";
    if (latestPolicy) {
      const parts = latestPolicy.version.split(".");
      const major = parseInt(parts[0]);
      const minor = parseInt(parts[1]);
      suggestedVersion = `${major}.${minor + 1}`;
    }
    
    // Default sections template
    const defaultSections = [
      { id: 1, title: "Introduction & Overview", content: "", order: 1 },
      { id: 2, title: "Information We Collect", content: "", order: 2 },
      { id: 3, title: "How We Collect Information", content: "", order: 3 },
      { id: 4, title: "How We Use Your Information", content: "", order: 4 },
      { id: 5, title: "Information Sharing & Disclosure", content: "", order: 5 },
      { id: 6, title: "Data Security Measures", content: "", order: 6 },
      { id: 7, title: "Data Retention & Deletion", content: "", order: 7 },
      { id: 8, title: "Your Rights & Choices", content: "", order: 8 },
      { id: 9, title: "Cookies & Tracking Technologies", content: "", order: 9 },
      { id: 10, title: "Third-Party Links & Services", content: "", order: 10 },
      { id: 11, title: "International Data Transfers", content: "", order: 11 },
      { id: 12, title: "Children's Privacy", content: "", order: 12 },
      { id: 13, title: "Marketing Communications", content: "", order: 13 },
      { id: 14, title: "Changes to Privacy Policy", content: "", order: 14 },
      { id: 15, title: "Contact & Data Protection Officer", content: "", order: 15 }
    ];
    
    res.locals.adminPage = "privacy";
    res.render("admin/privacy-policy-editor", {
      user: req.session.user,
      pageTitle: "Create Privacy Policy - Admin",
      page: "privacy",
      adminPage: "privacy",
      policy: null,
      suggestedVersion,
      defaultSections,
      isEdit: false
    });
  } catch (error) {
    console.error("Error loading create form:", error);
    res.status(500).send("Error loading form");
  }
};

// POST Create New Privacy Policy Version
const createPolicy = async (req, res) => {
  try {
    const { version, effectiveDate, changeSummary, sections, metaTitle, metaDescription } = req.body;
    
    // Parse sections if it's a JSON string
    let parsedSections = sections;
    if (typeof sections === 'string') {
      parsedSections = JSON.parse(sections);
    }
    
    // Check if version already exists
    const existingPolicy = await PrivacyPolicy.findOne({ version });
    if (existingPolicy) {
      return res.status(400).json({ 
        success: false, 
        message: "Version already exists" 
      });
    }
    
    const policy = new PrivacyPolicy({
      version,
      sections: parsedSections,
      effectiveDate: new Date(effectiveDate),
      changeSummary,
      metaTitle: metaTitle || "Privacy Policy - ZenoPay",
      metaDescription: metaDescription || "Learn how ZenoPay collects, uses, and protects your personal data.",
      createdBy: req.session.user?._id,
      status: "draft"
    });
    
    await policy.save();
    
    res.json({ 
      success: true, 
      message: "Privacy policy draft created successfully",
      policyId: policy._id
    });
  } catch (error) {
    console.error("Error creating policy:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error creating policy: " + error.message 
    });
  }
};

// GET Edit Privacy Policy Form
const getEditPolicyForm = async (req, res) => {
  try {
    const policy = await PrivacyPolicy.findById(req.params.id);
    
    if (!policy) {
      return res.status(404).send("Policy not found");
    }
    
    // Can only edit drafts
    if (policy.status !== "draft") {
      return res.redirect("/admin/privacy-policy?error=Can only edit draft policies");
    }
    
    res.locals.adminPage = "privacy";
    res.render("admin/privacy-policy-editor", {
      user: req.session.user,
      pageTitle: "Edit Privacy Policy - Admin",
      page: "privacy",
      adminPage: "privacy",
      policy,
      suggestedVersion: policy.version,
      defaultSections: policy.sections,
      isEdit: true
    });
  } catch (error) {
    console.error("Error loading edit form:", error);
    res.status(500).send("Error loading form");
  }
};

// PUT Update Privacy Policy
const updatePolicy = async (req, res) => {
  try {
    const { version, effectiveDate, changeSummary, sections, metaTitle, metaDescription } = req.body;
    
    const policy = await PrivacyPolicy.findById(req.params.id);
    
    if (!policy) {
      return res.status(404).json({ 
        success: false, 
        message: "Policy not found" 
      });
    }
    
    // Can only update drafts
    if (policy.status !== "draft") {
      return res.status(400).json({ 
        success: false, 
        message: "Can only update draft policies" 
      });
    }
    
    // Parse sections if it's a JSON string
    let parsedSections = sections;
    if (typeof sections === 'string') {
      parsedSections = JSON.parse(sections);
    }
    
    policy.version = version;
    policy.effectiveDate = new Date(effectiveDate);
    policy.changeSummary = changeSummary;
    policy.sections = parsedSections;
    policy.metaTitle = metaTitle || policy.metaTitle;
    policy.metaDescription = metaDescription || policy.metaDescription;
    
    await policy.save();
    
    res.json({ 
      success: true, 
      message: "Privacy policy updated successfully" 
    });
  } catch (error) {
    console.error("Error updating policy:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error updating policy: " + error.message 
    });
  }
};

// POST Publish Privacy Policy
const publishPolicy = async (req, res) => {
  try {
    const policy = await PrivacyPolicy.publishPolicy(req.params.id);
    
    if (!policy) {
      return res.status(404).json({ 
        success: false, 
        message: "Policy not found" 
      });
    }
    
    // Send notification emails to all users (async, don't wait)
    notifyUsersOfPolicyUpdate(policy).catch(err => {
      console.error("Error sending policy update notifications:", err);
    });
    
    res.json({ 
      success: true, 
      message: "Privacy policy published successfully and users will be notified" 
    });
  } catch (error) {
    console.error("Error publishing policy:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error publishing policy: " + error.message 
    });
  }
};

// DELETE Privacy Policy (drafts only)
const deletePolicy = async (req, res) => {
  try {
    const policy = await PrivacyPolicy.findById(req.params.id);
    
    if (!policy) {
      return res.status(404).json({ 
        success: false, 
        message: "Policy not found" 
      });
    }
    
    // Can only delete drafts
    if (policy.status !== "draft") {
      return res.status(400).json({ 
        success: false, 
        message: "Can only delete draft policies" 
      });
    }
    
    await PrivacyPolicy.findByIdAndDelete(req.params.id);
    
    res.json({ 
      success: true, 
      message: "Privacy policy draft deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting policy:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error deleting policy: " + error.message 
    });
  }
};

// POST Archive Privacy Policy
const archivePolicy = async (req, res) => {
  try {
    const policy = await PrivacyPolicy.findById(req.params.id);
    
    if (!policy) {
      return res.status(404).json({ 
        success: false, 
        message: "Policy not found" 
      });
    }
    
    await policy.archive();
    
    res.json({ 
      success: true, 
      message: "Privacy policy archived successfully" 
    });
  } catch (error) {
    console.error("Error archiving policy:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error archiving policy: " + error.message 
    });
  }
};

// GET Preview Privacy Policy
const previewPolicy = async (req, res) => {
  try {
    const policy = await PrivacyPolicy.findById(req.params.id);
    
    if (!policy) {
      return res.status(404).send("Policy not found");
    }
    
    res.render("privacy-policy", {
      pageTitle: policy.metaTitle,
      policy,
      hasAccepted: true, // Admins preview as if accepted
      isPreview: true,
      user: req.session?.user || null,
      isLoggedIn: !!req.session?.user  // Add this for header partial
    });
  } catch (error) {
    console.error("Error previewing policy:", error);
    res.status(500).send("Error previewing policy");
  }
};

// GET Version Comparison
const compareVersions = async (req, res) => {
  try {
    const { v1, v2 } = req.query;
    
    const policy1 = await PrivacyPolicy.findOne({ version: v1 });
    const policy2 = await PrivacyPolicy.findOne({ version: v2 });
    
    if (!policy1 || !policy2) {
      return res.status(404).json({ 
        success: false, 
        message: "One or both versions not found" 
      });
    }
    
    res.json({
      success: true,
      policy1: {
        version: policy1.version,
        publishedDate: policy1.publishedDate,
        sections: policy1.sections
      },
      policy2: {
        version: policy2.version,
        publishedDate: policy2.publishedDate,
        sections: policy2.sections
      }
    });
  } catch (error) {
    console.error("Error comparing versions:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error comparing versions: " + error.message 
    });
  }
};

// GET Consent Analytics
const getConsentAnalytics = async (req, res) => {
  try {
    const { version } = req.params;
    
    const policy = await PrivacyPolicy.findOne({ version });
    
    if (!policy) {
      return res.status(404).json({ 
        success: false, 
        message: "Policy version not found" 
      });
    }
    
    const acceptanceCount = await UserConsent.getAcceptanceCount(version, 'privacy');
    const totalUsers = await ZenoPayUser.countDocuments({ Role: 'user' });
    
    // Get acceptance timeline
    const acceptanceTimeline = await UserConsent.aggregate([
      {
        $match: {
          policyVersion: version,
          policyType: 'privacy'
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$consentDate" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Get consent methods breakdown
    const consentMethods = await UserConsent.aggregate([
      {
        $match: {
          policyVersion: version,
          policyType: 'privacy'
        }
      },
      {
        $group: {
          _id: "$consentMethod",
          count: { $sum: 1 }
        }
      }
    ]);
    
    res.json({
      success: true,
      version,
      acceptanceCount,
      totalUsers,
      acceptancePercentage: totalUsers > 0 ? ((acceptanceCount / totalUsers) * 100).toFixed(1) : 0,
      acceptanceTimeline,
      consentMethods
    });
  } catch (error) {
    console.error("Error getting consent analytics:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error getting analytics: " + error.message 
    });
  }
};

// Helper function to notify users of policy update
async function notifyUsersOfPolicyUpdate(policy) {
  try {
    // Get all active users
    const users = await ZenoPayUser.find({ 
      Role: 'user',
      Email: { $exists: true, $ne: null }
    }).select('Email FullName');
    
    // Send emails in batches to avoid overwhelming the email service
    const batchSize = 50;
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      
      const emailPromises = batch.map(user => {
        return EmailService.sendEmail({
          to: user.Email,
          subject: "Important: ZenoPay Privacy Policy Updated",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #6366f1;">Privacy Policy Update</h2>
              <p>Dear ${user.FullName},</p>
              <p>We want to inform you that we have updated our Privacy Policy. This update is effective as of ${policy.effectiveDate.toLocaleDateString()}.</p>
              ${policy.changeSummary ? `<p><strong>What Changed:</strong><br>${policy.changeSummary}</p>` : ''}
              <p>We encourage you to review the updated policy to understand how we collect, use, and protect your information.</p>
              <div style="margin: 30px 0;">
                <a href="${process.env.APP_URL || 'https://zenopay.com'}/privacy-policy" 
                   style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Review Privacy Policy
                </a>
              </div>
              <p>If you have any questions or concerns, please contact us at privacy@zenopay.com.</p>
              <p style="color: #666; font-size: 12px; margin-top: 30px;">
                This is an important legal notification. You cannot unsubscribe from these emails.
              </p>
            </div>
          `
        }).catch(err => {
          console.error(`Failed to send email to ${user.Email}:`, err);
        });
      });
      
      await Promise.all(emailPromises);
      
      // Small delay between batches
      if (i + batchSize < users.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log(`Privacy policy update notifications sent to ${users.length} users`);
  } catch (error) {
    console.error("Error in notifyUsersOfPolicyUpdate:", error);
    throw error;
  }
}

module.exports = {
  getPrivacyPolicyDashboard,
  getCreatePolicyForm,
  createPolicy,
  getEditPolicyForm,
  updatePolicy,
  publishPolicy,
  deletePolicy,
  archivePolicy,
  previewPolicy,
  compareVersions,
  getConsentAnalytics
};
