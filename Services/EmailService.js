const nodemailer = require("nodemailer");
module.exports = require("./EmailService");
            
            <center>
              <a href="${
                process.env.APP_URL || "http://localhost:3000"
              }/login" class="button">Login to Your Account</a>
            </center>
            
            <p style="margin-top: 30px; color: #666; font-size: 14px;">
              If you didn't create this account, please contact our support team immediately.
            </p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} ZenoPay. All rights reserved.</p>
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail(email, "ZenoPay - Registration Successful", html);
  }

  // Format Aadhaar
  formatAadhar(num) {
    const digits = num.replace(/\D/g, "");
    return digits.replace(/(\d{4})(\d{4})(\d{4})/, "$1 $2 $3");
  }
}

module.exports = new EmailService();
