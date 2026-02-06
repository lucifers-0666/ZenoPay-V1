/**
 * SMS Service Integration
 * Supports Twilio and AWS SNS
 */

const axios = require("axios");

class SMSService {
  constructor() {
    this.twilioAccountSid = process.env.TWILIO_ACCOUNT_SID || "";
    this.twilioAuthToken = process.env.TWILIO_AUTH_TOKEN || "";
    this.twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER || "";
    this.awsRegion = process.env.AWS_REGION || "us-east-1";
  }

  /**
   * Send OTP via Twilio
   */
  async sendOTPViaTwilio(phoneNumber, otp) {
    try {
      const message = `Your ZenoPay OTP is: ${otp}. Do not share this with anyone.`;

      const response = await axios.post(
        `https://api.twilio.com/2010-04-01/Accounts/${this.twilioAccountSid}/Messages.json`,
        new URLSearchParams({
          From: this.twilioPhoneNumber,
          To: `+91${phoneNumber}`, // Add country code for India
          Body: message,
        }),
        {
          auth: {
            username: this.twilioAccountSid,
            password: this.twilioAuthToken,
          },
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      return {
        success: true,
        messageId: response.data.sid,
        status: response.data.status,
      };
    } catch (error) {
      console.error("Twilio SMS error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send SMS via Twilio (Generic message)
   */
  async sendSMSViaTwilio(phoneNumber, message) {
    try {
      const response = await axios.post(
        `https://api.twilio.com/2010-04-01/Accounts/${this.twilioAccountSid}/Messages.json`,
        new URLSearchParams({
          From: this.twilioPhoneNumber,
          To: `+91${phoneNumber}`,
          Body: message,
        }),
        {
          auth: {
            username: this.twilioAccountSid,
            password: this.twilioAuthToken,
          },
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      return {
        success: true,
        messageId: response.data.sid,
        status: response.data.status,
      };
    } catch (error) {
      console.error("Twilio SMS error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send SMS via AWS SNS
   */
  async sendSMSViaSNS(phoneNumber, message) {
    try {
      const AWS = require("aws-sdk");
      const sns = new AWS.SNS({ region: this.awsRegion });

      const params = {
        Message: message,
        PhoneNumber: `+91${phoneNumber}`,
      };

      const result = await sns.publish(params).promise();

      return {
        success: true,
        messageId: result.MessageId,
      };
    } catch (error) {
      console.error("AWS SNS error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send OTP - Determines best service
   */
  async sendOTP(phoneNumber, otp, preferredService = "twilio") {
    try {
      if (preferredService === "twilio" || !process.env.AWS_REGION) {
        return await this.sendOTPViaTwilio(phoneNumber, otp);
      }

      return await this.sendSMSViaSNS(
        phoneNumber,
        `Your ZenoPay OTP is: ${otp}. Do not share this with anyone.`
      );
    } catch (error) {
      console.error("Send OTP error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send transaction notification
   */
  async sendTransactionNotification(phoneNumber, transactionType, amount, recipientName) {
    try {
      let message = "";

      if (transactionType === "sent") {
        message = `You have sent ₹${amount} to ${recipientName}. Reference: ZP${Date.now()}`;
      } else if (transactionType === "received") {
        message = `You have received ₹${amount} from ${recipientName}. Reference: ZP${Date.now()}`;
      } else if (transactionType === "pending") {
        message = `Your payment of ₹${amount} to ${recipientName} is pending. Please check your app for updates.`;
      }

      return await this.sendSMSViaTwilio(phoneNumber, message);
    } catch (error) {
      console.error("Send notification error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send security alert
   */
  async sendSecurityAlert(phoneNumber, alertType) {
    try {
      const messages = {
        login: "A new login to your ZenoPay account was detected. If this wasn't you, change your password immediately.",
        passwordChange: "Your ZenoPay password was changed successfully.",
        suspiciousActivity: "Suspicious activity detected on your account. Please secure your account.",
      };

      const message = messages[alertType] || "Security alert on your ZenoPay account.";

      return await this.sendSMSViaTwilio(phoneNumber, message);
    } catch (error) {
      console.error("Send alert error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Test SMS service connection
   */
  async testConnection(service = "twilio") {
    try {
      if (service === "twilio") {
        if (!this.twilioAccountSid || !this.twilioAuthToken) {
          return {
            success: false,
            error: "Twilio credentials not configured",
          };
        }

        // Test with a simple API call
        const response = await axios.get(
          `https://api.twilio.com/2010-04-01/Accounts/${this.twilioAccountSid}.json`,
          {
            auth: {
              username: this.twilioAccountSid,
              password: this.twilioAuthToken,
            },
          }
        );

        return {
          success: true,
          message: "Twilio connection successful",
          accountName: response.data.friendly_name,
        };
      }

      return {
        success: false,
        error: "Unknown service",
      };
    } catch (error) {
      console.error("Test connection error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

module.exports = new SMSService();
