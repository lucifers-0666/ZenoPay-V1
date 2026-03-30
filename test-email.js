const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

transporter.sendMail(
  {
    from: process.env.EMAIL_FROM,
    to: 'demo@example.com',
    subject: 'ZenoPay OTP Test',
    text: 'Your test OTP is: 123456',
  },
  (err, info) => {
    if (err) {
      console.log('❌ ERROR:', err.message);
      return;
    }

    console.log('✅ Email sent! Check your inbox.');
    if (info && info.messageId) {
      console.log('Message ID:', info.messageId);
    }
  }
);
