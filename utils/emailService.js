const EmailService = require("../Services/EmailService");

const getAppUrl = () => {
  return String(process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
};

const sanitizeName = (name = "") => {
  const trimmed = String(name || "").trim();
  return trimmed || "there";
};

const sendOTP = async ({ name, email, otpCode }) => {
  const safeName = sanitizeName(name);

  const subject = "Your ZenoPay Email Verification OTP";
  const html = `
    <div style="font-family:Inter,Arial,sans-serif;color:#111827;line-height:1.6;max-width:640px;margin:0 auto;padding:20px;">
      <h2 style="margin:0 0 12px;">Verify your email address</h2>
      <p>Hi ${safeName},</p>
      <p>Use this One-Time Password (OTP) to verify your ZenoPay account:</p>
      <div style="margin:18px 0;padding:14px 16px;border-radius:10px;background:#eff6ff;border:1px solid #bfdbfe;display:inline-block;">
        <span style="font-size:28px;letter-spacing:6px;font-weight:700;color:#1d4ed8;">${otpCode}</span>
      </div>
      <p>This OTP expires in 10 minutes.</p>
      <p style="color:#6b7280;font-size:13px;">If you did not create this account, you can safely ignore this email.</p>
    </div>
  `;

  const text = `Your ZenoPay OTP is ${otpCode}. It expires in 10 minutes.`;

  return EmailService.sendEmail({
    to: email,
    subject,
    html,
    text,
  });
};

const sendWelcomeEmail = async (user) => {
  const safeName = sanitizeName(user?.name || user?.FullName || user?.Name);
  const toEmail = user?.email || user?.Email;
  const dashboardUrl = `${getAppUrl()}/dashboard`;

  const subject = "Welcome to ZenoPay — Your wallet is ready!";
  const html = `
    <div style="margin:0;padding:0;background-color:#f5f7fb;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f5f7fb;padding:28px 12px;">
        <tr>
          <td align="center">
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:640px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e5e7eb;">
              <tr>
                <td style="background:#1a1a2e;padding:22px 28px;text-align:center;">
                  <div style="font-size:30px;line-height:1;font-weight:800;color:#ffffff;letter-spacing:0.3px;">ZenoPay</div>
                </td>
              </tr>

              <tr>
                <td style="padding:30px 28px 14px 28px;">
                  <h1 style="margin:0 0 14px 0;font-size:28px;line-height:1.2;color:#111827;">Welcome aboard, ${safeName}! 🎉</h1>
                  <p style="margin:0 0 14px 0;font-size:16px;color:#374151;">Your ZenoPay wallet is ready. Here's what you can do:</p>

                  <ul style="padding-left:18px;margin:0 0 24px 0;color:#374151;font-size:15px;line-height:1.8;">
                    <li><strong>Send Money</strong> instantly</li>
                    <li><strong>Receive Payments</strong> with ease</li>
                    <li><strong>Track Transactions</strong> in real time</li>
                  </ul>

                  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:6px 0 18px 0;">
                    <tr>
                      <td align="center" bgcolor="#4361ee" style="border-radius:10px;">
                        <a href="${dashboardUrl}" style="display:inline-block;padding:14px 28px;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;">Go to Dashboard</a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <tr>
                <td style="padding:0 28px 26px 28px;">
                  <p style="margin:0;font-size:13px;color:#6b7280;">If you didn't create this account, please ignore this email.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  `;

  const text = `Welcome aboard, ${safeName}! Your ZenoPay wallet is ready. You can send money, receive payments, and track transactions. Go to Dashboard: ${dashboardUrl}. If you didn't create this account, please ignore this email.`;

  return EmailService.sendEmail({
    to: toEmail,
    subject,
    html,
    text,
  });
};

module.exports = {
  sendOTP,
  sendWelcomeEmail,
};
