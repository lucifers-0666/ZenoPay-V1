const nodemailer = require("nodemailer");

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: "wd0ashok@gmail.com",
        pass: "dabw ngtd ayby ofbb",
      },
    });
  }

  async sendEmail(to, subject, html) {
    try {
      await this.transporter.sendMail({
        from: `"Govt Banking Portal" <wd0ashok@gmail.com>`,
        to,
        subject,
        html,
      });
    } catch (err) {
      console.error("Email Error:", err.message);
    }
  }

  // 1. Aadhaar Registration Email
  async sendAadhaarRegistrationEmail(email, fullName, aadharNumber, dob, gender, address, password) {
    // ... (Existing implementation kept brief for this specific update, assuming it exists)
    const html = `<h1>Welcome ${fullName}</h1><p>Aadhaar: ${aadharNumber}</p>`; // Placeholder for full template
    await this.sendEmail(email, "Aadhaar Registration", html);
  }

  // 2. Gateway Payment OTP Email (NEW)
  async sendPaymentOtp(email, fullName, otp) {
    const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; background-color: #f4f6f9; padding: 40px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="background-color: #1e40af; padding: 20px; text-align: center; color: white;">
                <h1 style="margin: 0;">GovBank Verify</h1>
            </div>
            <div style="padding: 30px;">
                <p style="color: #555; font-size: 16px;">Dear <strong>${fullName}</strong>,</p>
                <p style="color: #555;">To authorize your payment and access your bank accounts, please use the following One-Time Password (OTP):</p>
                
                <div style="background: #eff6ff; border: 2px dashed #1e40af; border-radius: 8px; padding: 15px; text-align: center; margin: 25px 0;">
                    <span style="font-size: 32px; font-weight: bold; color: #1e40af; letter-spacing: 5px;">${otp}</span>
                </div>
                
                <p style="color: #888; font-size: 13px;">This OTP is valid for 5 minutes. Do not share this with anyone.</p>
            </div>
        </div>
    </body>
    </html>
    `;
    await this.sendEmail(email, "GovBank Payment Verification OTP", html);
  }
}

module.exports = new EmailService();