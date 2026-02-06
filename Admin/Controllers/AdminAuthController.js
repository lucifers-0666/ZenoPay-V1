const ZenoPayUser = require("../../Models/ZenoPayUser");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const emailService = require("../../Services/EmailService");
const speakeasy = require("speakeasy");
const QRCode = require("qrcode");

// Store reset tokens in database (using MongoDB) - in production, use sessions
const resetTokens = new Map();

// GET Admin Login Page
const getLogin = (req, res) => {
  let successMessage = null;
  
  // Check for password reset success
  if (req.query.reset === 'success') {
    successMessage = 'Password reset successful! You can now login with your new password.';
  }
  
  res.render("auth/admin-authentication", {
    pageTitle: "ZenoPay Admin Login",
    error: null,
    success: successMessage,
  });
};

// POST Admin Login with proper password hashing
const postLogin = async (req, res) => {
  try {
    const { zenoPayId, password } = req.body;

    // Validate input
    if (!zenoPayId || !password) {
      return res.render("auth/admin-authentication", {
        pageTitle: "ZenoPay Admin Login",
        error: "Admin ID/Email and Password are required",
      });
    }

    // Find admin user by ZenoPayID or Email
    const adminUser = await ZenoPayUser.findOne({
      $or: [
        { ZenoPayID: zenoPayId },
        { Email: zenoPayId }
      ],
      Role: "admin",
    });

    if (!adminUser) {
      return res.render("auth/admin-authentication", {
        pageTitle: "ZenoPay Admin Login",
        error: "Invalid credentials or insufficient privileges",
      });
    }

    // Verify password using bcrypt
    const isPasswordValid = await bcrypt.compare(password, adminUser.Password);
    if (!isPasswordValid) {
      return res.render("auth/admin-authentication", {
        pageTitle: "ZenoPay Admin Login",
        error: "Invalid credentials",
      });
    }

    // Create session
    req.session.isLoggedIn = true;
    req.session.user = {
      ZenoPayID: adminUser.ZenoPayID,
      FullName: adminUser.FullName,
      Email: adminUser.Email,
      Role: adminUser.Role,
      ImagePath: adminUser.ImagePath,
    };

    // Redirect to admin dashboard
    res.redirect("/admin/dashboard");
  } catch (error) {
    console.error("Admin login error:", error);
    res.render("auth/admin-authentication", {
      pageTitle: "ZenoPay Admin Login",
      error: "An error occurred. Please try again.",
    });
  }
};

// Admin Logout
const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.redirect("/admin/dashboard");
    }
    res.redirect("/admin/login");
  });
};

// GET Forgot Password Page
const getForgotPassword = (req, res) => {
  res.render("auth/admin-password-recovery", {
    pageTitle: "Admin Password Reset - ZenoPay",
    error: null,
    success: null,
    email: "",
    showSuccess: false,
  });
};

// POST Forgot Password - Send Reset Link
const postForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.render("auth/admin-password-recovery", {
        pageTitle: "Admin Password Reset - ZenoPay",
        error: "Email address is required",
        success: null,
        email: "",
        showSuccess: false,
      });
    }

    // Find admin user by email
    const adminUser = await ZenoPayUser.findOne({
      Email: email,
      Role: "admin",
    });

    // Always show success message (security best practice)
    // Don't reveal if email exists in system
    if (!adminUser) {
      return res.render("auth/admin-password-recovery", {
        pageTitle: "Admin Password Reset - ZenoPay",
        error: null,
        success: null,
        email: email,
        showSuccess: true,
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = Date.now() + 15 * 60 * 1000; // 15 minutes

    // Store token (in production, save to database)
    resetTokens.set(resetToken, {
      email: adminUser.Email,
      zenoPayId: adminUser.ZenoPayID,
      expiry: resetTokenExpiry,
    });

    // Create reset link
    const resetLink = `${req.protocol}://${req.get("host")}/admin/reset-password/${resetToken}`;

    // Send email
    await sendPasswordResetEmail(
      adminUser.Email,
      adminUser.FullName,
      resetLink,
      resetToken
    );

    // Show success screen
    res.render("auth/admin-password-recovery", {
      pageTitle: "Admin Password Reset - ZenoPay",
      error: null,
      success: null,
      email: email,
      showSuccess: true,
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.render("auth/admin-password-recovery", {
      pageTitle: "Admin Password Reset - ZenoPay",
      error: "An error occurred. Please try again later.",
      success: null,
      email: req.body.email || "",
      showSuccess: false,
    });
  }
};

// GET Reset Password Page (with token)
const getResetPassword = (req, res) => {
  const { token } = req.params;

  // Verify token exists and is not expired
  const tokenData = resetTokens.get(token);

  if (!tokenData || tokenData.expiry < Date.now()) {
    return res.render("auth/admin-password-reset", {
      pageTitle: "Reset Password - ZenoPay Admin",
      error: "Invalid or expired reset link. Please request a new one.",
      token: null,
      validToken: false,
    });
  }

  res.render("auth/admin-password-reset", {
    pageTitle: "Reset Password - ZenoPay Admin",
    error: null,
    success: null,
    token: token,
    validToken: true,
  });
};

// POST Reset Password
const postResetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    // Verify token
    const tokenData = resetTokens.get(token);

    if (!tokenData || tokenData.expiry < Date.now()) {
      return res.render("auth/admin-password-reset", {
        pageTitle: "Reset Password - ZenoPay Admin",
        error: "Invalid or expired reset link. Please request a new one.",
        success: null,
        token: null,
        validToken: false,
      });
    }

    // Validate passwords
    if (!password || !confirmPassword) {
      return res.render("auth/admin-password-reset", {
        pageTitle: "Reset Password - ZenoPay Admin",
        error: "All fields are required",
        success: null,
        token: token,
        validToken: true,
      });
    }

    if (password !== confirmPassword) {
      return res.render("auth/admin-password-reset", {
        pageTitle: "Reset Password - ZenoPay Admin",
        error: "Passwords do not match",
        success: null,
        token: token,
        validToken: true,
      });
    }

    if (password.length < 8) {
      return res.render("auth/admin-password-reset", {
        pageTitle: "Reset Password - ZenoPay Admin",
        error: "Password must be at least 8 characters long",
        success: null,
        token: token,
        validToken: true,
      });
    }

    // Update password with bcrypt hashing
    const adminUser = await ZenoPayUser.findOne({
      Email: tokenData.email,
      Role: "admin",
    });

    if (!adminUser) {
      return res.render("auth/admin-password-reset", {
        pageTitle: "Reset Password - ZenoPay Admin",
        error: "Admin account not found",
        success: null,
        token: token,
        validToken: true,
      });
    }

    // Hash password with bcrypt (10 salt rounds)
    const hashedPassword = await bcrypt.hash(password, 10);
    adminUser.Password = hashedPassword;
    await adminUser.save();

    // Delete used token
    resetTokens.delete(token);

    // Send confirmation email
    await sendPasswordChangedEmail(adminUser.Email, adminUser.FullName);

    // Redirect to login with success message
    req.session.passwordResetSuccess = true;
    res.redirect("/admin/login?reset=success");
  } catch (error) {
    console.error("Reset password error:", error);
    res.render("auth/admin-password-reset", {
      pageTitle: "Reset Password - ZenoPay Admin",
      error: "An error occurred. Please try again.",
      success: null,
      token: req.params.token,
      validToken: true,
    });
  }
};

// Helper function to send password reset email
async function sendPasswordResetEmail(email, fullName, resetLink, token) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
          background-color: #f4f4f4;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background: white;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, #0EA5E9 0%, #06B6D4 100%);
          padding: 40px 30px;
          text-align: center;
          color: white;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 700;
        }
        .content {
          padding: 40px 30px;
        }
        .greeting {
          font-size: 18px;
          font-weight: 600;
          color: #0F172A;
          margin-bottom: 20px;
        }
        .message {
          font-size: 15px;
          color: #475569;
          margin-bottom: 30px;
          line-height: 1.6;
        }
        .button-container {
          text-align: center;
          margin: 35px 0;
        }
        .reset-button {
          display: inline-block;
          padding: 16px 40px;
          background: linear-gradient(135deg, #0EA5E9 0%, #06B6D4 100%);
          color: white;
          text-decoration: none;
          border-radius: 12px;
          font-weight: 700;
          font-size: 16px;
          letter-spacing: 0.5px;
          box-shadow: 0 4px 12px rgba(14, 165, 233, 0.4);
        }
        .reset-button:hover {
          box-shadow: 0 6px 16px rgba(14, 165, 233, 0.5);
        }
        .info-box {
          background: #FEF3C7;
          border-left: 4px solid #F59E0B;
          padding: 16px 20px;
          margin: 25px 0;
          border-radius: 8px;
        }
        .info-box p {
          margin: 8px 0;
          font-size: 14px;
          color: #92400E;
        }
        .info-box strong {
          color: #78350F;
        }
        .alternative {
          background: #F8FAFC;
          padding: 20px;
          border-radius: 8px;
          margin: 25px 0;
        }
        .alternative p {
          margin: 8px 0;
          font-size: 13px;
          color: #64748B;
        }
        .link-code {
          background: white;
          padding: 12px;
          border: 1px solid #E2E8F0;
          border-radius: 6px;
          font-family: 'Courier New', monospace;
          font-size: 12px;
          word-break: break-all;
          color: #0EA5E9;
          margin-top: 10px;
        }
        .footer {
          background: #F8FAFC;
          padding: 30px;
          text-align: center;
          border-top: 1px solid #E2E8F0;
        }
        .footer p {
          margin: 8px 0;
          font-size: 13px;
          color: #64748B;
        }
        .security-notice {
          background: #FEE2E2;
          border-left: 4px solid #EF4444;
          padding: 16px 20px;
          margin: 25px 0;
          border-radius: 8px;
        }
        .security-notice p {
          margin: 8px 0;
          font-size: 14px;
          color: #991B1B;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 Password Reset Request</h1>
        </div>
        
        <div class="content">
          <p class="greeting">Hello ${fullName},</p>
          
          <p class="message">
            We received a request to reset your admin password for your ZenoPay account. 
            Click the button below to create a new password:
          </p>
          
          <div class="button-container">
            <a href="${resetLink}" class="reset-button">Reset Password</a>
          </div>
          
          <div class="info-box">
            <p><strong>⏱️ Important:</strong></p>
            <p>• This link will expire in <strong>15 minutes</strong></p>
            <p>• The link can only be used once</p>
            <p>• For security, you'll need to create a strong password</p>
          </div>
          
          <div class="alternative">
            <p><strong>Can't click the button?</strong></p>
            <p>Copy and paste this link into your browser:</p>
            <div class="link-code">${resetLink}</div>
          </div>
          
          <div class="security-notice">
            <p><strong>🛡️ Didn't request this?</strong></p>
            <p>If you didn't request a password reset, please ignore this email or contact support immediately. 
            Your password will remain unchanged.</p>
          </div>
        </div>
        
        <div class="footer">
          <p><strong>ZenoPay Admin Portal</strong></p>
          <p>This is an automated message, please do not reply.</p>
          <p style="color: #94A3B8; font-size: 12px; margin-top: 20px;">
            © ${new Date().getFullYear()} ZenoPay. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  await emailService.sendEmail(
    email,
    "Reset Your Admin Password - ZenoPay",
    html
  );
}

// Helper function to send password changed confirmation email
async function sendPasswordChangedEmail(email, fullName) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
          background-color: #f4f4f4;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background: white;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, #10B981 0%, #059669 100%);
          padding: 40px 30px;
          text-align: center;
          color: white;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 700;
        }
        .content {
          padding: 40px 30px;
        }
        .success-icon {
          text-align: center;
          font-size: 60px;
          margin-bottom: 20px;
        }
        .greeting {
          font-size: 18px;
          font-weight: 600;
          color: #0F172A;
          margin-bottom: 20px;
          text-align: center;
        }
        .message {
          font-size: 15px;
          color: #475569;
          margin-bottom: 30px;
          line-height: 1.6;
          text-align: center;
        }
        .info-box {
          background: #DBEAFE;
          border-left: 4px solid #0EA5E9;
          padding: 16px 20px;
          margin: 25px 0;
          border-radius: 8px;
        }
        .info-box p {
          margin: 8px 0;
          font-size: 14px;
          color: #0C4A6E;
        }
        .security-notice {
          background: #FEE2E2;
          border-left: 4px solid #EF4444;
          padding: 16px 20px;
          margin: 25px 0;
          border-radius: 8px;
        }
        .security-notice p {
          margin: 8px 0;
          font-size: 14px;
          color: #991B1B;
        }
        .footer {
          background: #F8FAFC;
          padding: 30px;
          text-align: center;
          border-top: 1px solid #E2E8F0;
        }
        .footer p {
          margin: 8px 0;
          font-size: 13px;
          color: #64748B;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Password Successfully Changed</h1>
        </div>
        
        <div class="content">
          <div class="success-icon">✓</div>
          
          <p class="greeting">Hello ${fullName},</p>
          
          <p class="message">
            Your admin password has been successfully changed.<br>
            You can now sign in with your new password.
          </p>
          
          <div class="info-box">
            <p><strong>📋 Details:</strong></p>
            <p>• Password changed at: ${new Date().toLocaleString()}</p>
            <p>• Account: ${email}</p>
            <p>• Role: Admin</p>
          </div>
          
          <div class="security-notice">
            <p><strong>🛡️ Didn't make this change?</strong></p>
            <p>If you didn't change your password, please contact our support team immediately. 
            Your account may have been compromised.</p>
          </div>
        </div>
        
        <div class="footer">
          <p><strong>ZenoPay Admin Portal</strong></p>
          <p>This is an automated message, please do not reply.</p>
          <p style="color: #94A3B8; font-size: 12px; margin-top: 20px;">
            © ${new Date().getFullYear()} ZenoPay. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  await emailService.sendEmail(
    email,
    "Password Changed Successfully - ZenoPay Admin",
    html
  );
}

// ============ 2FA SETUP METHODS ============

// GET 2FA Setup Page
const get2FASetup = (req, res) => {
    res.render("auth/admin-two-factor-setup", {
    pageTitle: "Setup Two-Factor Authentication - ZenoPay Admin",
  });
};

// POST Generate 2FA Secret and QR Code
const generate2FA = async (req, res) => {
  try {
    const userId = req.session.user?.ZenoPayID || "admin";

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `ZenoPay Admin (${userId})`,
      issuer: "ZenoPay",
      length: 32,
    });

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    // Generate backup codes
    const backupCodes = [];
    for (let i = 0; i < 8; i++) {
      const code = crypto.randomBytes(4).toString("hex").toUpperCase();
      backupCodes.push(code);
    }

    // Store secret temporarily (in production, save to database)
    twoFactorSecrets.set(userId, {
      secret: secret.base32,
      backupCodes: backupCodes,
      verified: false,
    });

    res.json({
      success: true,
      secret: secret.base32,
      qrCode: qrCodeUrl,
      backupCodes: backupCodes,
    });
  } catch (error) {
    console.error("2FA generation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate 2FA data",
    });
  }
};

// POST Verify 2FA Code
const verify2FA = async (req, res) => {
  try {
    const { code, secret } = req.body;
    const userId = req.session.user?.ZenoPayID || "admin";

    if (!code || !secret) {
      return res.status(400).json({
        success: false,
        message: "Code and secret are required",
      });
    }

    // Verify the token
    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: "base32",
      token: code,
      window: 2, // Allow 2 time steps before and after
    });

    if (verified) {
      // Mark as verified
      const data = twoFactorSecrets.get(userId);
      if (data) {
        data.verified = true;
        twoFactorSecrets.set(userId, data);
      }

      // TODO: In production, save to database
      // Update user record with 2FA enabled and backup codes

      res.json({
        success: true,
        message: "2FA enabled successfully",
      });
    } else {
      res.json({
        success: false,
        message: "Invalid verification code",
      });
    }
  } catch (error) {
    console.error("2FA verification error:", error);
    res.status(500).json({
      success: false,
      message: "Verification failed",
    });
  }
};

module.exports = {
  getLogin,
  postLogin,
  logout,
  getForgotPassword,
  postForgotPassword,
  getResetPassword,
  postResetPassword,
  get2FASetup,
  generate2FA,
  verify2FA,
};

