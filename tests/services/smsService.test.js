/**
 * SMS Service Tests
 */

const smsService = require("../../Services/smsService");

describe("SMS Service", () => {
  describe("sendOTP", () => {
    it("should send OTP via preferred service", async () => {
      const result = await smsService.sendOTP("9999999999", "123456", "twilio");

      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
    });

    it("should handle invalid phone numbers", async () => {
      const result = await smsService.sendOTP("invalid", "123456");

      expect(result.success).toBeDefined();
    });
  });

  describe("sendTransactionNotification", () => {
    it("should send sent transaction notification", async () => {
      const result = await smsService.sendTransactionNotification(
        "9999999999",
        "sent",
        1000,
        "John Doe"
      );

      expect(result).toBeDefined();
    });

    it("should send received transaction notification", async () => {
      const result = await smsService.sendTransactionNotification(
        "9999999999",
        "received",
        500,
        "Jane Smith"
      );

      expect(result).toBeDefined();
    });

    it("should send pending transaction notification", async () => {
      const result = await smsService.sendTransactionNotification(
        "9999999999",
        "pending",
        750,
        "Bob Johnson"
      );

      expect(result).toBeDefined();
    });
  });

  describe("sendSecurityAlert", () => {
    it("should send login alert", async () => {
      const result = await smsService.sendSecurityAlert("9999999999", "login");

      expect(result).toBeDefined();
    });

    it("should send password change alert", async () => {
      const result = await smsService.sendSecurityAlert("9999999999", "passwordChange");

      expect(result).toBeDefined();
    });

    it("should send suspicious activity alert", async () => {
      const result = await smsService.sendSecurityAlert(
        "9999999999",
        "suspiciousActivity"
      );

      expect(result).toBeDefined();
    });
  });

  describe("testConnection", () => {
    it("should test service connection", async () => {
      const result = await smsService.testConnection("twilio");

      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
    });

    it("should handle missing credentials", async () => {
      // Temporarily clear credentials
      const originalSid = smsService.twilioAccountSid;
      smsService.twilioAccountSid = "";

      const result = await smsService.testConnection("twilio");

      expect(result.success).toBe(false);
      expect(result.error).toContain("credentials");

      // Restore credentials
      smsService.twilioAccountSid = originalSid;
    });
  });
});
