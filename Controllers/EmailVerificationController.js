const ZenoPayDetails = require("../Models/ZenoPayUser");
const crypto = require("crypto");
const emailService = require("../Services/EmailService");

/**
 * Email Verification Controller
 * Handles email verification flow for ZenoPay users
 */

// Generate verification token
const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Send verification email
const sendVerificationEmail = async (user, token) => {
  try {
    const verificationUrl = `${process.env.APP_URL || 'http://localhost:3000'}/verify-email/${token}`;
    
    const emailContent = {
      to: user.Email,
      subject: 'Verify Your ZenoPay Email Address',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #374151; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #3B82F6, #8B5CF6); padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0; }
            .header h1 { color: white; margin: 0; font-size: 28px; }
            .content { background: white; padding: 40px 30px; border: 1px solid #E5E7EB; }
            .button { display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #3B82F6, #8B5CF6); color: white; text-decoration: none; border-radius: 12px; font-weight: 600; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #6B7280; font-size: 14px; }
            .security-note { background: #EFF6FF; padding: 16px; border-radius: 8px; margin-top: 20px; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Verify Your Email</h1>
            </div>
            <div class="content">
              <p>Hi ${user.FullName},</p>
              <p>Thank you for registering with ZenoPay! To complete your registration and access all features, please verify your email address.</p>
              <p style="text-align: center;">
                <a href="${verificationUrl}" class="button">Verify Email Address</a>
              </p>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #3B82F6;">${verificationUrl}</p>
              <div class="security-note">
                <strong>🔒 Security Note:</strong> This verification link will expire in 24 hours. If you didn't create a ZenoPay account, please ignore this email.
              </div>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} ZenoPay. All rights reserved.</p>
              <p>Need help? Contact us at support@zenopay.com</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    // Try to use existing email service
    if (emailService && emailService.sendEmail) {
      await emailService.sendEmail(emailContent);
    } else {
      console.log('Email service not configured. Verification URL:', verificationUrl);
    }

    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    return false;
  }
};

// Display verification page based on token
const getVerifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.render('verify-email', {
        status: 'error',
        message: 'No verification token provided.',
        email: null,
        pageTitle: 'Email Verification - ZenoPay'
      });
    }

    // Find user with this verification token
    const user = await ZenoPayDetails.findOne({
      EmailVerificationToken: token,
      EmailVerificationExpiry: { $gt: Date.now() }
    });

    if (!user) {
      // Check if token exists but expired
      const expiredUser = await ZenoPayDetails.findOne({
        EmailVerificationToken: token
      });

      if (expiredUser) {
        return res.render('verify-email', {
          status: 'expired',
          message: 'This verification link has expired.',
          email: expiredUser.Email,
          pageTitle: 'Email Verification - ZenoPay'
        });
      }

      // Token doesn't exist or already used
      return res.render('verify-email', {
        status: 'error',
        message: 'Invalid or already used verification token.',
        email: null,
        pageTitle: 'Email Verification - ZenoPay'
      });
    }

    // Check if already verified
    if (user.EmailVerified) {
      return res.render('verify-email', {
        status: 'success',
        message: 'Your email has already been verified.',
        email: user.Email,
        pageTitle: 'Email Verification - ZenoPay'
      });
    }

    // Verify the email
    user.EmailVerified = true;
    user.EmailVerifiedAt = new Date();
    user.EmailVerificationToken = undefined;
    user.EmailVerificationExpiry = undefined;
    await user.save();

    // Render success page
    return res.render('verify-email', {
      status: 'success',
      message: 'Your email has been successfully verified!',
      email: user.Email,
      pageTitle: 'Email Verification - ZenoPay'
    });

  } catch (error) {
    console.error('Email verification error:', error);
    return res.render('verify-email', {
      status: 'error',
      message: 'An error occurred during verification. Please try again later.',
      email: null,
      pageTitle: 'Email Verification - ZenoPay'
    });
  }
};

// Resend verification email (API endpoint)
const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required'
      });
    }

    // Find user
    const user = await ZenoPayDetails.findOne({ Email: email.toLowerCase() });

    if (!user) {
      // Don't reveal if user exists for security
      return res.status(200).json({
        success: true,
        message: 'If an account exists with this email, a verification link has been sent.'
      });
    }

    // Check if already verified
    if (user.EmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'This email address is already verified.'
      });
    }

    // Generate new token
    const token = generateVerificationToken();
    user.EmailVerificationToken = token;
    user.EmailVerificationExpiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    await user.save();

    // Send email
    const emailSent = await sendVerificationEmail(user, token);

    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification email. Please try again later.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Verification email sent successfully. Please check your inbox.'
    });

  } catch (error) {
    console.error('Resend verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred. Please try again later.'
    });
  }
};

// Check verification status (API endpoint)
const checkVerificationStatus = async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required'
      });
    }

    const user = await ZenoPayDetails.findOne({ Email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.status(200).json({
      success: true,
      verified: user.EmailVerified || false,
      verifiedAt: user.EmailVerifiedAt || null
    });

  } catch (error) {
    console.error('Check verification status error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred'
    });
  }
};

module.exports = {
  getVerifyEmail,
  resendVerificationEmail,
  checkVerificationStatus,
  sendVerificationEmail,
  generateVerificationToken
};
