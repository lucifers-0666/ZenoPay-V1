const PrivacyPolicy = require("../Models/PrivacyPolicy");
const UserConsent = require("../Models/UserConsent");
const PDFDocument = require('pdfkit');

// GET Current Privacy Policy Page
const getPrivacyPolicy = async (req, res) => {
  try {
    const policy = await PrivacyPolicy.getCurrentPolicy();
    
    if (!policy) {
      console.warn("⚠️  No privacy policy found in database");
      return res.status(404).render("error-404", {
        pageTitle: "Privacy Policy Not Found",
        message: "Privacy policy is not currently available. Please contact support."
      });
    }
    
    // Check if user has accepted this version
    let hasAccepted = false;
    if (req.session && req.session.user && req.session.user._id) {
      try {
        hasAccepted = await UserConsent.hasUserAccepted(
          req.session.user._id,
          policy.version,
          'privacy'
        );
      } catch (consentError) {
        console.error("Error checking consent:", consentError);
        hasAccepted = false;
      }
    }
    
    console.log(`✅ Privacy policy loaded - Version: ${policy.version}, User: ${req.session?.user?._id ? 'logged in' : 'guest'}, Accepted: ${hasAccepted}`);
    
    res.render("privacy-policy", {
      pageTitle: policy.metaTitle || "Privacy Policy - ZenoPay",
      metaDescription: policy.metaDescription || "Learn how ZenoPay protects your data",
      policy,
      hasAccepted,
      isPreview: false,
      user: req.session?.user || null,
      isLoggedIn: !!req.session?.user  // Add this for header partial
    });
  } catch (error) {
    console.error("❌ Error loading privacy policy:", error);
    res.status(500).render("error-500", {
      pageTitle: "Error",
      message: "An error occurred while loading the privacy policy. Please try again later."
    });
  }
};

// GET Specific Version of Privacy Policy
const getPrivacyPolicyVersion = async (req, res) => {
  try {
    const { version } = req.params;
    
    const policy = await PrivacyPolicy.findOne({ 
      version,
      status: "published"
    });
    
    if (!policy) {
      return res.status(404).render("error-404", {
        pageTitle: "Privacy Policy Version Not Found",
        message: `Privacy policy version ${version} not found.`
      });
    }
    
    // Check if this is the current version
    const currentPolicy = await PrivacyPolicy.getCurrentPolicy();
    const isCurrentVersion = currentPolicy && currentPolicy.version === version;
    
    // Check if user has accepted this version
    let hasAccepted = false;
    if (req.session.user) {
      hasAccepted = await UserConsent.hasUserAccepted(
        req.session.user._id,
        policy.version,
        'privacy'
      );
    }
    
    res.render("privacy-policy", {
      pageTitle: `Privacy Policy v${version} - ZenoPay`,
      metaDescription: policy.metaDescription,
      policy,
      hasAccepted,
      isCurrentVersion,
      isArchive: !isCurrentVersion,
      isPreview: false,
      user: req.session?.user || null,
      isLoggedIn: !!req.session?.user  // Add this for header partial
    });
  } catch (error) {
    console.error("Error loading privacy policy version:", error);
    res.status(500).send("Error loading privacy policy");
  }
};

// GET Privacy Policy Archive (list of all versions)
const getPrivacyPolicyArchive = async (req, res) => {
  try {
    const policies = await PrivacyPolicy.getArchive();
    const currentPolicy = await PrivacyPolicy.getCurrentPolicy();
    
    res.render("privacy-policy-archive", {
      pageTitle: "Privacy Policy Archive - ZenoPay",
      policies,
      currentPolicy,
      user: req.session?.user || null,
      isLoggedIn: !!req.session?.user  // Add this for header partial
    });
  } catch (error) {
    console.error("Error loading privacy policy archive:", error);
    res.status(500).send("Error loading archive");
  }
};

// POST Accept Privacy Policy (Record User Consent)
const acceptPrivacyPolicy = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ 
        success: false, 
        message: "User must be logged in to accept policy" 
      });
    }
    
    const { version } = req.body;
    
    // Verify the version exists and is current
    const policy = await PrivacyPolicy.findOne({ version, status: "published" });
    
    if (!policy) {
      return res.status(404).json({ 
        success: false, 
        message: "Policy version not found" 
      });
    }
    
    // Check if already accepted
    const alreadyAccepted = await UserConsent.hasUserAccepted(
      req.session.user._id,
      version,
      'privacy'
    );
    
    if (alreadyAccepted) {
      return res.json({ 
        success: true, 
        message: "You have already accepted this version" 
      });
    }
    
    // Parse user agent for device info
    const userAgent = req.headers['user-agent'] || '';
    const deviceInfo = parseUserAgent(userAgent);
    
    // Record consent
    await UserConsent.recordConsent({
      userId: req.session.user._id,
      policyVersion: version,
      policyType: 'privacy',
      consentMethod: 'explicit',
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: userAgent,
      deviceInfo: deviceInfo
    });
    
    res.json({ 
      success: true, 
      message: "Privacy policy acceptance recorded" 
    });
  } catch (error) {
    console.error("Error accepting privacy policy:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error recording acceptance: " + error.message 
    });
  }
};

// GET Compare Two Privacy Policy Versions
const comparePrivacyPolicyVersions = async (req, res) => {
  try {
    const { v1, v2 } = req.query;
    
    if (!v1 || !v2) {
      return res.status(400).render("error-404", {
        pageTitle: "Invalid Comparison",
        message: "Please provide two version numbers to compare."
      });
    }
    
    const policy1 = await PrivacyPolicy.findOne({ version: v1, status: "published" });
    const policy2 = await PrivacyPolicy.findOne({ version: v2, status: "published" });
    
    if (!policy1 || !policy2) {
      return res.status(404).render("error-404", {
        pageTitle: "Version Not Found",
        message: "One or both policy versions not found."
      });
    }
    
    res.render("privacy-policy-compare", {
      pageTitle: `Compare Privacy Policy v${v1} vs v${v2} - ZenoPay`,
      policy1,
      policy2,
      user: req.session?.user || null,
      isLoggedIn: !!req.session?.user  // Add this for header partial
    });
  } catch (error) {
    console.error("Error comparing versions:", error);
    res.status(500).send("Error comparing versions");
  }
};

// GET Download Privacy Policy as PDF
const downloadPrivacyPolicyPDF = async (req, res) => {
  try {
    const { version } = req.query;
    
    let policy;
    if (version) {
      policy = await PrivacyPolicy.findOne({ version, status: "published" });
    } else {
      policy = await PrivacyPolicy.getCurrentPolicy();
    }
    
    if (!policy) {
      return res.status(404).send("Policy not found");
    }
    
    // Create PDF
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 60, right: 60 }
    });
    
    // Set response headers
    const filename = `ZenoPay-Privacy-Policy-v${policy.version}-${new Date().toISOString().split('T')[0]}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    // Pipe PDF to response
    doc.pipe(res);
    
    // Add watermark
    doc.fontSize(60)
       .fillColor('#6366f1', 0.1)
       .text('ZenoPay', 150, 350, { align: 'center' });
    
    // Cover page
    doc.fillColor('#000000', 1)
       .fontSize(32)
       .font('Helvetica-Bold')
       .text('Privacy Policy', { align: 'center' });
    
    doc.moveDown(1);
    doc.fontSize(14)
       .font('Helvetica')
       .text(`Version ${policy.version}`, { align: 'center' });
    
    doc.moveDown(0.5);
    doc.fontSize(12)
       .text(`Effective Date: ${policy.effectiveDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, { align: 'center' });
    
    if (policy.publishedDate) {
      doc.fontSize(12)
         .text(`Last Updated: ${policy.publishedDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, { align: 'center' });
    }
    
    doc.moveDown(2);
    doc.fontSize(10)
       .fillColor('#666666')
       .text('Official Document', { align: 'center' });
    
    // Table of Contents
    doc.addPage();
    doc.fillColor('#000000')
       .fontSize(20)
       .font('Helvetica-Bold')
       .text('Table of Contents', { underline: true });
    
    doc.moveDown(1);
    doc.fontSize(12)
       .font('Helvetica');
    
    policy.sections.forEach((section, index) => {
      doc.text(`${section.id}. ${section.title}`, { 
        indent: 20,
        continued: false 
      });
      doc.moveDown(0.5);
    });
    
    // Content sections
    policy.sections.forEach((section, index) => {
      doc.addPage();
      
      // Section number badge
      doc.fontSize(16)
         .font('Helvetica-Bold')
         .fillColor('#6366f1')
         .text(`Section ${section.id}`);
      
      doc.moveDown(0.5);
      
      // Section title
      doc.fontSize(18)
         .fillColor('#000000')
         .text(section.title);
      
      doc.moveDown(1);
      
      // Section content (strip HTML tags for PDF)
      const plainText = section.content
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"');
      
      doc.fontSize(11)
         .font('Helvetica')
         .fillColor('#333333')
         .text(plainText, {
           align: 'justify',
           lineGap: 3
         });
    });
    
    // Footer on each page
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      
      doc.fontSize(8)
         .fillColor('#999999')
         .text(
           `ZenoPay Privacy Policy v${policy.version} | Page ${i + 1} of ${pages.count}`,
           50,
           doc.page.height - 40,
           { align: 'center' }
         );
    }
    
    // Finalize PDF
    doc.end();
  } catch (error) {
    console.error("Error generating PDF:", error);
    if (!res.headersSent) {
      res.status(500).send("Error generating PDF");
    }
  }
};

// Helper function to parse user agent
function parseUserAgent(userAgent) {
  const deviceInfo = {
    browser: 'Unknown',
    os: 'Unknown',
    device: 'Desktop'
  };
  
  // Detect browser
  if (userAgent.includes('Chrome')) deviceInfo.browser = 'Chrome';
  else if (userAgent.includes('Firefox')) deviceInfo.browser = 'Firefox';
  else if (userAgent.includes('Safari')) deviceInfo.browser = 'Safari';
  else if (userAgent.includes('Edge')) deviceInfo.browser = 'Edge';
  else if (userAgent.includes('Opera')) deviceInfo.browser = 'Opera';
  
  // Detect OS
  if (userAgent.includes('Windows')) deviceInfo.os = 'Windows';
  else if (userAgent.includes('Mac')) deviceInfo.os = 'macOS';
  else if (userAgent.includes('Linux')) deviceInfo.os = 'Linux';
  else if (userAgent.includes('Android')) deviceInfo.os = 'Android';
  else if (userAgent.includes('iOS')) deviceInfo.os = 'iOS';
  
  // Detect device type
  if (userAgent.includes('Mobile')) deviceInfo.device = 'Mobile';
  else if (userAgent.includes('Tablet')) deviceInfo.device = 'Tablet';
  
  return deviceInfo;
}

module.exports = {
  getPrivacyPolicy,
  getPrivacyPolicyVersion,
  getPrivacyPolicyArchive,
  acceptPrivacyPolicy,
  comparePrivacyPolicyVersions,
  downloadPrivacyPolicyPDF
};
