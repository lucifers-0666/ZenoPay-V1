/**
 * Enhanced Email Service with Support for Multiple Providers
 * Supports Nodemailer with SMTP, SendGrid, and Mailgun
 */

const nodemailer = require("nodemailer");
const axios = require("axios");

class EnhancedEmailService {
  constructor() {
    this.provider = process.env.EMAIL_PROVIDER || "smtp";
    
    if (this.provider === "smtp") {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      });
    }

    this.sendGridKey = process.env.SENDGRID_API_KEY || "";
    this.mailgunDomain = process.env.MAILGUN_DOMAIN || "";
    this.mailgunKey = process.env.MAILGUN_API_KEY || "";
    this.fromEmail = process.env.EMAIL_FROM || "noreply@zenopay.com";
    this.fromName = process.env.EMAIL_FROM_NAME || "ZenoPay";
  }

  /**
   * Send email using configured provider
   */
  async sendEmail(to, subject, html, text = "", attachments = []) {
    try {
      if (this.provider === "sendgrid") {
        return await this.sendViasendGrid(to, subject, html, text);
      } else if (this.provider === "mailgun") {
        return await this.sendViaMailgun(to, subject, html, text);
      } else {
        return await this.sendViaSMTP(to, subject, html, text, attachments);
      }
    } catch (error) {
      console.error("Email service error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send via SMTP (Nodemailer)
   */
  async sendViaSMTP(to, subject, html, text = "", attachments = []) {
    try {
      const mailOptions = {
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, ""),
        attachments,
      };

      const result = await this.transporter.sendMail(mailOptions);

      return {
        success: true,
        messageId: result.messageId,
        provider: "smtp",
      };
    } catch (error) {
      console.error("SMTP error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send via SendGrid API
   */
  async sendViaendGrid(to, subject, html, text = "") {
    try {
      const response = await axios.post(
        "https://api.sendgrid.com/v3/mail/send",
        {
          personalizations: [
            {
              to: [{ email: to }],
              subject,
            },
          ],
          from: {
            email: this.fromEmail,
            name: this.fromName,
          },
          content: [
            {
              type: "text/html",
              value: html,
            },
            {
              type: "text/plain",
              value: text || html.replace(/<[^>]*>/g, ""),
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${this.sendGridKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      return {
        success: true,
        messageId: response.headers["x-message-id"],
        provider: "sendgrid",
      };
    } catch (error) {
      console.error("SendGrid error:", error);
      return {
        success: false,
        error: error.response?.data?.errors?.[0]?.message || error.message,
      };
    }
  }

  /**
   * Send via Mailgun API
   */
  async sendViaMailgun(to, subject, html, text = "") {
    try {
      const auth = Buffer.from(`api:${this.mailgunKey}`).toString("base64");

      const response = await axios.post(
        `https://api.mailgun.net/v3/${this.mailgunDomain}/messages`,
        new URLSearchParams({
          from: `${this.fromName} <noreply@${this.mailgunDomain}>`,
          to,
          subject,
          html,
          text: text || html.replace(/<[^>]*>/g, ""),
        }),
        {
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      return {
        success: true,
        messageId: response.data.id,
        provider: "mailgun",
      };
    } catch (error) {
      console.error("Mailgun error:", error);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  /**
   * Send OTP email
   */
  async sendOTPEmail(email, fullName, otp) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Your ZenoPay OTP</h2>
        <p>Hi ${fullName},</p>
        <p>Your One-Time Password (OTP) is:</p>
        <h1 style="text-align: center; letter-spacing: 5px; color: #007bff;">${otp}</h1>
        <p style="color: #666;">This OTP is valid for 10 minutes. Do not share this with anyone.</p>
        <hr />
        <p style="color: #999; font-size: 12px;">
          If you didn't request this OTP, please ignore this email.
        </p>
      </div>
    `;

    return await this.sendEmail(email, "Your ZenoPay OTP", html);
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email, fullName, resetLink) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Reset Your Password</h2>
        <p>Hi ${fullName},</p>
        <p>We received a request to reset your password. Click the button below to reset it:</p>
        <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">
          Reset Password
        </a>
        <p style="color: #666; margin-top: 20px;">If the button doesn't work, copy and paste this link in your browser:<br/>
        ${resetLink}</p>
        <p style="color: #999; font-size: 12px;">
          This link will expire in 24 hours. If you didn't request this, please ignore this email.
        </p>
      </div>
    `;

    return await this.sendEmail(email, "Reset Your Password", html);
  }

  /**
   * Send transaction notification
   */
  async sendTransactionEmail(email, fullName, transaction) {
    const transactionDate = new Date(transaction.date).toLocaleDateString();
    const icon = transaction.type === "sent" ? "📤" : "📥";

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>${icon} Transaction Receipt</h2>
        <p>Hi ${fullName},</p>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px;">
          <p><strong>Transaction Type:</strong> ${transaction.type === "sent" ? "Money Sent" : "Money Received"}</p>
          <p><strong>Amount:</strong> ₹${transaction.amount}</p>
          <p><strong>Recipient/Sender:</strong> ${transaction.recipientName}</p>
          <p><strong>Date:</strong> ${transactionDate}</p>
          <p><strong>Reference:</strong> ${transaction.reference}</p>
          <p><strong>Status:</strong> <span style="color: green;">${transaction.status}</span></p>
        </div>
        <p style="color: #666; margin-top: 20px;">
          Thank you for using ZenoPay. For any queries, contact our support team.
        </p>
      </div>
    `;

    return await this.sendEmail(
      email,
      `${icon} Transaction Receipt - ₹${transaction.amount}`,
      html
    );
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(email, fullName, zenoPayId) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to ZenoPay! 🎉</h2>
        <p>Hi ${fullName},</p>
        <p>Thank you for joining ZenoPay. Your account has been successfully created.</p>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px;">
          <p><strong>Your ZenoPay ID:</strong> <span style="font-family: monospace; color: #007bff;">${zenoPayId}</span></p>
        </div>
        <h3>What you can do with ZenoPay:</h3>
        <ul>
          <li>Send and receive money instantly</li>
          <li>Pay using QR codes</li>
          <li>Request money from friends and family</li>
          <li>Track all your transactions</li>
          <li>Store and manage multiple payment methods</li>
        </ul>
        <p>
          <a href="https://zenopay.me" style="color: #007bff; text-decoration: none;">
            Get Started →
          </a>
        </p>
      </div>
    `;

    return await this.sendEmail(email, "Welcome to ZenoPay!", html);
  }

  /**
   * Send merchant approval email
   */
  async sendMerchantApprovalEmail(email, merchantName) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>🎉 Your Merchant Account Approved!</h2>
        <p>Hi ${merchantName},</p>
        <p>Great news! Your merchant account has been approved by our team.</p>
        <p>You can now:</p>
        <ul>
          <li>Accept payments from customers</li>
          <li>Generate payment QR codes</li>
          <li>Access your merchant dashboard</li>
          <li>View transaction reports and analytics</li>
          <li>Manage your payouts and settlements</li>
        </ul>
        <a href="https://merchant.zenopay.me/dashboard" style="display: inline-block; padding: 10px 20px; background-color: #28a745; color: white; text-decoration: none; border-radius: 5px;">
          Go to Dashboard
        </a>
      </div>
    `;

    return await this.sendEmail(email, "Your Merchant Account is Approved!", html);
  }

  /**
   * Test email configuration
   */
  async testConnection() {
    try {
      if (this.provider === "smtp") {
        await this.transporter.verify();
        return {
          success: true,
          message: "SMTP connection successful",
          provider: "smtp",
        };
      } else if (this.provider === "sendgrid") {
        const response = await axios.get("https://api.sendgrid.com/v3/accounts", {
          headers: {
            Authorization: `Bearer ${this.sendGridKey}`,
          },
        });

        return {
          success: response.status === 200,
          message: "SendGrid connection successful",
          provider: "sendgrid",
        };
      } else if (this.provider === "mailgun") {
        const auth = Buffer.from(`api:${this.mailgunKey}`).toString("base64");
        const response = await axios.get(
          `https://api.mailgun.net/v3/${this.mailgunDomain}`,
          {
            headers: {
              Authorization: `Basic ${auth}`,
            },
          }
        );

        return {
          success: response.status === 200,
          message: "Mailgun connection successful",
          provider: "mailgun",
        };
      }
    } catch (error) {
      console.error("Test connection error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

module.exports = new EnhancedEmailService();
