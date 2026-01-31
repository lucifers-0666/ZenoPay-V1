const ContactSubmission = require('../Models/ContactSubmission');
const ZenoPayUser = require('../Models/ZenoPayUser');
const EmailService = require('../Services/EmailService');
const multer = require('multer');
const path = require('path');

// ============================================
// FILE UPLOAD CONFIGURATION
// ============================================
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'public/Uploads/contact-attachments/');
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'contact-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, JPG, and PNG files are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { 
    fileSize: 5 * 1024 * 1024, // 5MB max per file
    files: 3 // Max 3 files
  },
  fileFilter: fileFilter
});

// ============================================
// GET CONTACT PAGE
// ============================================
const getContactPage = async (req, res) => {
  try {
    const user = req.session?.user || null;
    
    res.render('contact', {
      pageTitle: 'Contact Us - ZenoPay',
      user: user,
      isLoggedIn: !!user
    });
  } catch (error) {
    console.error('[Contact] Error loading contact page:', error);
    res.status(500).render('error-500', { message: 'Failed to load contact page' });
  }
};

// ============================================
// SUBMIT CONTACT FORM (API)
// ============================================
const submitContactForm = async (req, res) => {
  try {
    const { name, email, phone, subject, message, priority } = req.body;
    
    // Validation
    if (!name || name.trim().length < 2 || name.trim().length > 100) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name must be between 2 and 100 characters' 
      });
    }
    
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Valid email address is required' 
      });
    }
    
    if (!subject) {
      return res.status(400).json({ 
        success: false, 
        message: 'Subject is required' 
      });
    }
    
    if (!message || message.trim().length < 10 || message.trim().length > 2000) {
      return res.status(400).json({ 
        success: false, 
        message: 'Message must be between 10 and 2000 characters' 
      });
    }
    
    // Get user if logged in
    const user = req.session?.user;
    
    // Process attachments if any
    const attachments = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        attachments.push({
          filename: file.filename,
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          url: `/Uploads/contact-attachments/${file.filename}`
        });
      });
    }
    
    // Create submission
    const submission = new ContactSubmission({
      user_id: user?.user_id || null,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || null,
      subject,
      message: message.trim(),
      priority: priority || 'medium',
      attachments,
      ip_address: req.ip || req.connection.remoteAddress,
      user_agent: req.get('user-agent'),
      referrer: req.get('referer')
    });
    
    // Auto-assign priority based on content
    submission.autoAssignPriority();
    
    await submission.save();
    
    console.log('[Contact] New submission created:', submission.ticket_number);
    
    // Send confirmation email to user
    try {
      await EmailService.sendEmail({
        to: email,
        subject: `We received your message - Ticket #${submission.ticket_number}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">Thank You for Contacting ZenoPay</h1>
            </div>
            <div style="padding: 30px; background: #f9fafb;">
              <p style="font-size: 16px; color: #1a202c;">Hi ${name},</p>
              <p style="font-size: 16px; color: #1a202c;">
                We've received your message and our team will review it shortly. Here are the details:
              </p>
              <div style="background: white; border-radius: 12px; padding: 20px; margin: 20px 0; border-left: 4px solid #667eea;">
                <p style="margin: 8px 0;"><strong>Ticket Number:</strong> ${submission.ticket_number}</p>
                <p style="margin: 8px 0;"><strong>Subject:</strong> ${subject}</p>
                <p style="margin: 8px 0;"><strong>Priority:</strong> ${submission.priority.toUpperCase()}</p>
                <p style="margin: 8px 0;"><strong>Submitted:</strong> ${new Date(submission.submitted_at).toLocaleString()}</p>
              </div>
              <p style="font-size: 16px; color: #1a202c;">
                ${submission.priority === 'urgent' || submission.priority === 'high' 
                  ? 'Our team will respond to your high-priority request within 4 hours.' 
                  : 'We typically respond within 24 hours.'}
              </p>
              <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
                If you need immediate assistance, please call us at <strong>+91-1800-ZENOPAY</strong>
              </p>
            </div>
            <div style="padding: 20px; text-align: center; background: #1a202c; color: white;">
              <p style="margin: 0; font-size: 14px;">© 2026 ZenoPay. All rights reserved.</p>
            </div>
          </div>
        `
      });
    } catch (emailError) {
      console.error('[Contact] Failed to send confirmation email:', emailError);
      // Don't fail the submission if email fails
    }
    
    // Send notification email to support team
    try {
      await EmailService.sendEmail({
        to: 'support@zenopay.com',
        subject: `New ${submission.priority.toUpperCase()} Priority Support Ticket: ${subject}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1a202c;">New Support Ticket Received</h2>
            <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin: 20px 0;">
              <p><strong>Ticket:</strong> ${submission.ticket_number}</p>
              <p><strong>From:</strong> ${name} (${email})</p>
              <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
              <p><strong>Subject:</strong> ${subject}</p>
              <p><strong>Priority:</strong> <span style="color: ${submission.priority === 'urgent' ? '#ef4444' : submission.priority === 'high' ? '#f59e0b' : '#3b82f6'}">${submission.priority.toUpperCase()}</span></p>
              <p><strong>Message:</strong></p>
              <div style="background: white; padding: 15px; border-radius: 8px; white-space: pre-wrap;">${message}</div>
              ${attachments.length > 0 ? `<p><strong>Attachments:</strong> ${attachments.length} file(s)</p>` : ''}
            </div>
            <a href="${process.env.BASE_URL || 'http://localhost:3000'}/admin/contact/${submission._id}" 
               style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">
              View Ticket
            </a>
          </div>
        `
      });
    } catch (emailError) {
      console.error('[Contact] Failed to send notification email:', emailError);
    }
    
    res.json({
      success: true,
      submission_id: submission._id,
      ticket_number: submission.ticket_number,
      message: 'Thank you for contacting us! We will respond soon.'
    });
    
  } catch (error) {
    console.error('[Contact] Error submitting form:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to submit contact form. Please try again.' 
    });
  }
};

// ============================================
// GET ALL SUBMISSIONS (Admin Only)
// ============================================
const getAllSubmissions = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      priority,
      date_from, 
      date_to,
      search 
    } = req.query;
    
    // Build query
    const query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (priority) {
      query.priority = priority;
    }
    
    if (date_from || date_to) {
      query.submitted_at = {};
      if (date_from) query.submitted_at.$gte = new Date(date_from);
      if (date_to) query.submitted_at.$lte = new Date(date_to);
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await ContactSubmission.countDocuments(query);
    
    const submissions = await ContactSubmission.find(query)
      .populate('user_id', 'name email')
      .populate('replied_by', 'name email')
      .sort({ submitted_at: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .lean();
    
    // Get stats
    const stats = await ContactSubmission.getStats();
    
    res.json({
      success: true,
      submissions,
      stats,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      }
    });
    
  } catch (error) {
    console.error('[Contact] Error fetching submissions:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch submissions' 
    });
  }
};

// ============================================
// GET SUBMISSION BY ID (Admin Only)
// ============================================
const getSubmissionById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const submission = await ContactSubmission.findById(id)
      .populate('user_id', 'name email phone')
      .populate('replied_by', 'name email')
      .populate('assigned_to', 'name email')
      .populate('admin_notes.added_by', 'name email')
      .lean();
    
    if (!submission) {
      return res.status(404).json({ 
        success: false, 
        message: 'Submission not found' 
      });
    }
    
    // Mark as read if status is 'new'
    if (submission.status === 'new') {
      await ContactSubmission.findByIdAndUpdate(id, { status: 'read' });
      submission.status = 'read';
    }
    
    res.json({
      success: true,
      submission
    });
    
  } catch (error) {
    console.error('[Contact] Error fetching submission:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch submission' 
    });
  }
};

// ============================================
// UPDATE SUBMISSION STATUS (Admin Only)
// ============================================
const updateSubmissionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const admin = req.session?.user;
    
    if (!status) {
      return res.status(400).json({ 
        success: false, 
        message: 'Status is required' 
      });
    }
    
    const validStatuses = ['new', 'read', 'in_progress', 'replied', 'closed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid status' 
      });
    }
    
    const updateData = { status };
    
    if (notes && admin) {
      updateData.$push = {
        admin_notes: {
          note: notes,
          added_by: admin.user_id,
          added_at: Date.now()
        }
      };
    }
    
    const submission = await ContactSubmission.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate('user_id', 'name email');
    
    if (!submission) {
      return res.status(404).json({ 
        success: false, 
        message: 'Submission not found' 
      });
    }
    
    console.log('[Contact] Submission status updated:', submission.ticket_number, status);
    
    res.json({
      success: true,
      message: 'Status updated successfully',
      submission
    });
    
  } catch (error) {
    console.error('[Contact] Error updating status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update status' 
    });
  }
};

// ============================================
// REPLY TO SUBMISSION (Admin Only)
// ============================================
const replyToSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    const { reply_message } = req.body;
    const admin = req.session?.user || { user_id: 'admin', name: 'Support Team' };
    
    if (!reply_message || reply_message.trim().length < 10) {
      return res.status(400).json({ 
        success: false, 
        message: 'Reply message must be at least 10 characters' 
      });
    }
    
    const submission = await ContactSubmission.findById(id);
    
    if (!submission) {
      return res.status(404).json({ 
        success: false, 
        message: 'Submission not found' 
      });
    }
    
    // Update submission
    submission.reply_message = reply_message.trim();
    submission.replied_at = Date.now();
    submission.replied_by = admin.user_id;
    submission.status = 'replied';
    
    await submission.save();
    
    console.log('[Contact] Reply sent for ticket:', submission.ticket_number);
    
    // Send reply email to user
    try {
      await EmailService.sendEmail({
        to: submission.email,
        subject: `Re: ${submission.subject} - Ticket #${submission.ticket_number}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">ZenoPay Support Team</h1>
            </div>
            <div style="padding: 30px; background: #f9fafb;">
              <p style="font-size: 16px; color: #1a202c;">Hi ${submission.name},</p>
              <p style="font-size: 16px; color: #1a202c;">
                Thank you for your patience. Here's our response to your inquiry:
              </p>
              <div style="background: white; border-radius: 12px; padding: 20px; margin: 20px 0; border-left: 4px solid #667eea;">
                <p style="margin: 8px 0;"><strong>Ticket Number:</strong> ${submission.ticket_number}</p>
                <p style="margin: 8px 0;"><strong>Original Subject:</strong> ${submission.subject}</p>
              </div>
              <div style="background: #e0e7ff; border-radius: 12px; padding: 20px; margin: 20px 0;">
                <p style="margin: 0 0 10px 0;"><strong>Your Message:</strong></p>
                <p style="margin: 0; color: #4b5563; white-space: pre-wrap;">${submission.message}</p>
              </div>
              <div style="background: white; border-radius: 12px; padding: 20px; margin: 20px 0; border-left: 4px solid #10b981;">
                <p style="margin: 0 0 10px 0;"><strong>Our Response:</strong></p>
                <p style="margin: 0; color: #1a202c; white-space: pre-wrap;">${reply_message}</p>
              </div>
              <p style="font-size: 16px; color: #1a202c;">
                If you have any further questions, please don't hesitate to reply to this email or create a new support ticket.
              </p>
              <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
                Best regards,<br>
                <strong>ZenoPay Support Team</strong>
              </p>
            </div>
            <div style="padding: 20px; text-align: center; background: #1a202c; color: white;">
              <p style="margin: 0; font-size: 14px;">© 2026 ZenoPay. All rights reserved.</p>
            </div>
          </div>
        `
      });
    } catch (emailError) {
      console.error('[Contact] Failed to send reply email:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Reply saved but failed to send email notification'
      });
    }
    
    res.json({
      success: true,
      message: 'Reply sent successfully',
      submission
    });
    
  } catch (error) {
    console.error('[Contact] Error sending reply:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send reply' 
    });
  }
};

module.exports = {
  getContactPage,
  submitContactForm,
  getAllSubmissions,
  getSubmissionById,
  updateSubmissionStatus,
  replyToSubmission,
  upload // Export multer middleware
};
