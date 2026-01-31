/**
 * Contact Controller
 * Handles contact form submission
 */

const nodemailer = require('nodemailer');

// Submit contact form
const submitContactForm = async (req, res) => {
  try {
    const { fullName, email, phone, subject, message, priority } = req.body;
    
    // Validate required fields
    if (!fullName || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all required fields'
      });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }
    
    // Generate ticket number
    const ticketNumber = 'ZP-' + Date.now().toString(36).toUpperCase();
    
    // TODO: Save to database
    // Example:
    // const contactSubmission = new ContactSubmission({
    //   ticketNumber,
    //   fullName,
    //   email,
    //   phone,
    //   subject,
    //   message,
    //   priority: priority || 'low',
    //   status: 'pending',
    //   createdAt: new Date()
    // });
    // await contactSubmission.save();
    
    // TODO: Send confirmation email to user
    // TODO: Send notification email to support team
    
    // Log the submission
    console.log('Contact form submitted:', {
      ticketNumber,
      fullName,
      email,
      subject,
      priority: priority || 'low',
      timestamp: new Date().toISOString()
    });
    
    res.json({
      success: true,
      message: 'Your message has been sent successfully',
      ticketNumber
    });
    
  } catch (error) {
    console.error('Error submitting contact form:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit contact form. Please try again.'
    });
  }
};

module.exports = {
  submitContactForm
};
