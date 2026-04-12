const request = require("supertest");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const app = require("../../app");
const ZenoPayUser = require("../../Models/ZenoPayUser");
const LoginHistory = require("../../Models/LoginHistory");
const emailService = require("../../Services/EmailService");
const { sendOTP, sendWelcomeEmail } = require("../../utils/emailService");

jest.mock("../../Services/EmailService", () => ({
  sendEmail: jest.fn().mockResolvedValue({ sent: true }),
}));

jest.mock("../../utils/emailService", () => ({
  sendOTP: jest.fn().mockResolvedValue({ sent: true }),
  sendWelcomeEmail: jest.fn().mockResolvedValue({ sent: true }),
}));

describe("Auth Controller", () => {
  const baseUser = {
    ZenoPayID: "ZPTEST001",
    FullName: "Auth Test User",
    Email: "auth-test@example.com",
    Mobile: "9876543210",
    Password: "Test@1234",
    DOB: new Date("1995-01-01"),
    Gender: "Male",
    FatherName: "Test Father",
    MotherName: "Test Mother",
    Address: "Test Address",
    City: "Test City",
    State: "Test State",
    Pincode: "123456",
    Role: "user",
    AccountStatus: "Active",
    EmailVerified: false,
    isEmailVerified: false,
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    await LoginHistory.deleteMany({});
  });

  afterEach(async () => {
    await ZenoPayUser.deleteMany({
      $or: [
        { Email: baseUser.Email },
        { email: baseUser.Email },
        { Mobile: baseUser.Mobile },
        { userId: baseUser.ZenoPayID },
        { ZenoPayID: baseUser.ZenoPayID },
        { Email: "verified-auth@example.com" },
        { email: "verified-auth@example.com" },
        { Mobile: "9000000001" },
        { ZenoPayID: "ZPTEST002" },
      ],
    });
  });

  const seedUser = async (overrides = {}) => {
    const passwordHash = await bcrypt.hash(overrides.Password || baseUser.Password, 10);
    const doc = new ZenoPayUser({
      ...baseUser,
      ...overrides,
      Password: passwordHash,
      Email: (overrides.Email || baseUser.Email).toLowerCase(),
      email: (overrides.email || overrides.Email || baseUser.Email).toLowerCase(),
      Mobile: overrides.Mobile || baseUser.Mobile,
      phone: overrides.phone || overrides.Mobile || baseUser.Mobile,
      Role: overrides.Role || baseUser.Role,
      role: overrides.role || "User",
      DOB: overrides.DOB || baseUser.DOB,
      Gender: overrides.Gender || baseUser.Gender,
      FatherName: overrides.FatherName || baseUser.FatherName,
      MotherName: overrides.MotherName || baseUser.MotherName,
      Address: overrides.Address || baseUser.Address,
      City: overrides.City || baseUser.City,
      State: overrides.State || baseUser.State,
      Pincode: overrides.Pincode || baseUser.Pincode,
      ZenoPayID: overrides.ZenoPayID || baseUser.ZenoPayID,
      FullName: overrides.FullName || baseUser.FullName,
      name: overrides.name || overrides.FullName || baseUser.FullName,
      isEmailVerified: overrides.isEmailVerified ?? baseUser.isEmailVerified,
      EmailVerified: overrides.EmailVerified ?? baseUser.EmailVerified,
      AccountStatus: overrides.AccountStatus || baseUser.AccountStatus,
      Status: overrides.Status,
    });

    await doc.save();
    return doc;
  };

  describe("POST /register", () => {
    it("registers a new user and sends OTP", async () => {
      const response = await request(app)
        .post("/register")
        .set("Accept", "application/json")
        .send({
          fullName: baseUser.FullName,
          email: baseUser.Email,
          phoneNumber: baseUser.Mobile,
          password: baseUser.Password,
          confirmPassword: baseUser.Password,
          agreeToTerms: true,
          referralCode: "",
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.redirect).toContain("/verify-email?email=");
      expect(sendOTP).toHaveBeenCalled();
      expect(sendWelcomeEmail).toHaveBeenCalled();

      const stored = await ZenoPayUser.findOne({ Email: baseUser.Email.toLowerCase() });
      expect(stored).toBeTruthy();
      expect(await bcrypt.compare(baseUser.Password, stored.Password)).toBe(true);
      expect(stored.emailOtp).toBeDefined();
      expect(stored.emailOtpExpiry).toBeDefined();
    });

    it("rejects duplicate email registrations", async () => {
      await seedUser({ isEmailVerified: true, EmailVerified: true });

      const response = await request(app)
        .post("/register")
        .set("Accept", "application/json")
        .send({
          fullName: "Another User",
          email: baseUser.Email,
          phoneNumber: "9999999999",
          password: baseUser.Password,
          confirmPassword: baseUser.Password,
          agreeToTerms: true,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/email already/i);
    });

    it("rejects duplicate phone registrations", async () => {
      await seedUser();

      const response = await request(app)
        .post("/register")
        .set("Accept", "application/json")
        .send({
          fullName: "Another User",
          email: "phone-dup@example.com",
          phoneNumber: baseUser.Mobile,
          password: baseUser.Password,
          confirmPassword: baseUser.Password,
          agreeToTerms: true,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/phone number already/i);
    });

    it("rejects invalid registration input", async () => {
      const response = await request(app)
        .post("/register")
        .set("Accept", "application/json")
        .send({
          fullName: "",
          email: "bad-email",
          phoneNumber: "123",
          password: "123",
          confirmPassword: "123",
          agreeToTerms: true,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBeTruthy();
    });
  });

  describe("POST /login", () => {
    it("logs in verified users and returns dashboard redirect", async () => {
      const user = await seedUser({
        Email: "verified-auth@example.com",
        Mobile: "9000000001",
        ZenoPayID: "ZPTEST002",
        FullName: "Verified User",
        isEmailVerified: true,
        EmailVerified: true,
      });

      const response = await request(app)
        .post("/login")
        .set("Accept", "application/json")
        .send({
          userId: user.Email,
          password: baseUser.Password,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.redirect).toBe("/dashboard");
      expect(sendOTP).not.toHaveBeenCalled();
      expect(await LoginHistory.countDocuments({ ZenoPayId: user.ZenoPayID })).toBe(1);
    });

    it("rejects invalid login credentials", async () => {
      await seedUser({ isEmailVerified: true, EmailVerified: true });

      const response = await request(app)
        .post("/login")
        .set("Accept", "application/json")
        .send({
          userId: baseUser.Email,
          password: "WrongPassword123",
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/invalid email\/zenopay id or password/i);
    });

    it("issues OTP and redirects to verify-email for unverified users", async () => {
      const user = await seedUser({
        Email: "unverified-auth@example.com",
        Mobile: "9000000001",
        ZenoPayID: "ZPTEST002",
        FullName: "Unverified User",
        isEmailVerified: false,
        EmailVerified: false,
      });

      const response = await request(app)
        .post("/login")
        .set("Accept", "application/json")
        .send({
          userId: user.Email,
          password: baseUser.Password,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.redirect).toContain("/verify-email?email=");
      expect(sendOTP).toHaveBeenCalled();

      const refreshed = await ZenoPayUser.findById(user._id);
      expect(refreshed.emailOtp).toBeDefined();
      expect(refreshed.emailOtpExpiry).toBeDefined();
    });
  });

  describe("POST /verify-email", () => {
    it("accepts a valid OTP and marks the user verified", async () => {
      const otp = "123456";
      const user = await seedUser({
        Email: "otp-auth@example.com",
        Mobile: "9000000001",
        ZenoPayID: "ZPTEST002",
        FullName: "OTP User",
        EmailVerified: false,
        isEmailVerified: false,
        emailOtp: await bcrypt.hash(otp, 10),
        emailOtpExpiry: new Date(Date.now() + 10 * 60 * 1000),
      });

      const agent = request.agent(app);
      const response = await agent
        .post("/verify-email")
        .send({ email: user.Email, otp })
        .expect(200);

      expect(response.text).toContain("Email verified successfully");

      const refreshed = await ZenoPayUser.findById(user._id);
      expect(refreshed.EmailVerified).toBe(true);
      expect(refreshed.isEmailVerified).toBe(true);
      expect(refreshed.emailOtp).toBeUndefined();
    });

    it("rejects an invalid OTP", async () => {
      await seedUser({
        Email: "otp-invalid@example.com",
        Mobile: "9000000001",
        ZenoPayID: "ZPTEST002",
        FullName: "OTP Invalid User",
        EmailVerified: false,
        isEmailVerified: false,
        emailOtp: await bcrypt.hash("654321", 10),
        emailOtpExpiry: new Date(Date.now() + 10 * 60 * 1000),
      });

      const response = await request(app)
        .post("/verify-email")
        .send({ email: "otp-invalid@example.com", otp: "111111" })
        .expect(400);

      expect(response.text).toContain("Invalid OTP");
    });
  });

  describe("POST /resend-otp", () => {
    it("resends OTP for an unverified account", async () => {
      await seedUser({
        Email: "resend-auth@example.com",
        Mobile: "9000000001",
        ZenoPayID: "ZPTEST002",
        FullName: "Resend User",
        EmailVerified: false,
        isEmailVerified: false,
      });

      const response = await request(app)
        .post("/resend-otp")
        .send({ email: "resend-auth@example.com" })
        .expect(200);

      expect(response.text).toContain("A new OTP has been sent");
      expect(sendOTP).toHaveBeenCalled();
    });
  });

  describe("GET /logout", () => {
    it("clears the user session and redirects to login", async () => {
      const agent = request.agent(app);
      const user = await seedUser({ isEmailVerified: true, EmailVerified: true });

      await agent
        .post("/login")
        .set("Accept", "application/json")
        .send({ userId: user.Email, password: baseUser.Password })
        .expect(200);

      const response = await agent.get("/logout").expect(302);
      expect(response.header.location).toBe("/login");
    });
  });
});
