const nodemailer = require("nodemailer");

class EmailService {
  constructor() {
    this.transporter = null;
  }

  getTransporter() {
    if (this.transporter) return this.transporter;

    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 587);
    const secure = String(process.env.SMTP_SECURE || "false").toLowerCase() === "true";
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASSWORD || process.env.SMTP_PASS;

    if (!host || !user || !pass) {
      return null;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });

    return this.transporter;
  }

  // Supports both signatures:
  // sendEmail(to, subject, html)
  // sendEmail({ to, subject, html, text })
  async sendEmail(toOrPayload, subjectArg, htmlArg) {
    const payload =
      typeof toOrPayload === "object" && toOrPayload !== null
        ? toOrPayload
        : { to: toOrPayload, subject: subjectArg, html: htmlArg };

    const transporter = this.getTransporter();
    if (!transporter) {
      console.warn("[EmailService] SMTP not configured. Email skipped.");
      return { sent: false, skipped: true };
    }

    const fromName = process.env.EMAIL_FROM_NAME || "ZenoPay";
    const fromEmail = process.env.EMAIL_FROM || process.env.SMTP_USER;

    try {
      await transporter.sendMail({
        from: `${fromName} <${fromEmail}>`,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
      });
      return { sent: true };
    } catch (err) {
      console.error("Email Error:", err.message);
      return { sent: false, error: err };
    }
  }

  async sendAadhaarRegistrationEmail(email, fullName, aadharNumber, dob, gender, address, password) {
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;line-height:1.6;color:#333;">
        <h2>Aadhaar Registration Successful</h2>
        <p>Dear ${fullName}, your Aadhaar profile was created successfully.</p>
        <p><strong>Aadhaar:</strong> ${this.formatAadhar(aadharNumber)}</p>
        <p><strong>DOB:</strong> ${dob} | <strong>Gender:</strong> ${gender}</p>
        <p><strong>Address:</strong> ${address}</p>
        <p><strong>Password:</strong> ${password}</p>
      </div>
    `;

    return this.sendEmail(email, "UIDAI - Aadhaar Registration Successful", html);
  }

  async sendZenoPayRegistrationEmail(email, fullName, zenoPayID) {
    const loginUrl = `${process.env.APP_URL || "http://localhost:3000"}/login`;
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;line-height:1.6;color:#333;">
        <h2>Welcome to ZenoPay</h2>
        <p>Hi ${fullName}, your account has been created successfully.</p>
        <p><strong>ZenoPay ID:</strong> ${zenoPayID}</p>
        <p><a href="${loginUrl}">Login to your account</a></p>
      </div>
    `;

    return this.sendEmail(email, "ZenoPay - Registration Successful", html);
  }

  formatAadhar(num) {
    const digits = String(num || "").replace(/\D/g, "");
    return digits.replace(/(\d{4})(\d{4})(\d{4})/, "$1 $2 $3");
  }
}

module.exports = new EmailService();
