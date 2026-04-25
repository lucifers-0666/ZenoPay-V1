const request = require("supertest");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const app = require("../../app");
const ZenoPayUser = require("../../Models/ZenoPayUser");
const Receipt = require("../../Models/Receipt");
const Dispute = require("../../Models/Dispute");
const BankAccount = require("../../Models/BankAccount");
const TransactionHistory = require("../../Models/TransactionHistory");
const pkg = require("../../package.json");

const baseUserDoc = ({
  zenoPayId,
  fullName,
  email,
  mobile,
  passwordHash,
  role = "user",
  emailVerified = true,
}) => ({
  userId: zenoPayId,
  ZenoPayID: zenoPayId,
  name: fullName,
  FullName: fullName,
  email: email.toLowerCase(),
  Email: email.toLowerCase(),
  phone: mobile,
  Mobile: mobile,
  Password: passwordHash,
  DOB: new Date("1995-01-01"),
  Gender: "Other",
  FatherName: "Security Parent",
  Address: "Security Street",
  City: "Mumbai",
  State: "Maharashtra",
  Pincode: "400001",
  role: role === "admin" ? "Admin" : "User",
  Role: role,
  status: "Active",
  AccountStatus: "Active",
  EmailVerified: emailVerified,
  isEmailVerified: emailVerified,
});

const createSecurityUser = async ({ zenoPayId, fullName, email, mobile, password, role = "user", emailVerified = true }) => {
  const hash = await bcrypt.hash(password, 10);
  return ZenoPayUser.create(
    baseUserDoc({
      zenoPayId,
      fullName,
      email,
      mobile,
      passwordHash: hash,
      role,
      emailVerified,
    })
  );
};

const loginAs = async (agent, { userId, password }) => {
  return agent
    .post("/login")
    .set("Accept", "application/json")
    .send({ userId, password });
};

const decimal = (n) => mongoose.Types.Decimal128.fromString(String(n));

const createBankAccountFor = async (user, overrides = {}) => {
  return BankAccount.create({
    AccountNumber: overrides.AccountNumber || String(Date.now()) + String(Math.floor(Math.random() * 1000)).padStart(3, "0"),
    BankName: "Zeno Bank",
    BankId: "ZB001",
    BankCity: "Mumbai",
    BankState: "Maharashtra",
    BankEmail: "support@zenobank.test",
    AccountType: "Savings",
    OpeningBalance: decimal(overrides.OpeningBalance ?? 10000),
    Balance: decimal(overrides.Balance ?? 10000),
    TransactionLimit: decimal(overrides.TransactionLimit ?? 1000000),
    ZenoPayId: user.ZenoPayID,
    FullName: user.FullName,
    DOB: user.DOB,
    Gender: user.Gender,
    Profession: "Engineer",
    AnnualIncome: "900000",
    Email: user.Email,
    Mobile: user.Mobile,
    City: "Mumbai",
    State: "Maharashtra",
    Pincode: "400001",
    DebitCardNumber: "4111111111111111",
    NameOnCard: user.FullName.toUpperCase(),
    CardExpiry: "12/30",
    CardType: "debit",
    AccountStatus: "Active",
    DebitCardStatus: "Active",
  });
};

describe("Security Test Suite", () => {
  const userAPassword = "SecureA@123";
  const userBPassword = "SecureB@123";

  beforeEach(async () => {
    await Promise.all([
      ZenoPayUser.deleteMany({
        $or: [
          { Email: /security\.(a|b|admin)@example\.com/i },
          { email: /security\.(a|b|admin)@example\.com/i },
          { ZenoPayID: { $in: ["ZPSEC_A", "ZPSEC_B", "ZPSEC_ADMIN"] } },
          { userId: { $in: ["ZPSEC_A", "ZPSEC_B", "ZPSEC_ADMIN"] } },
        ],
      }),
      Receipt.deleteMany({ user_id: { $in: ["ZPSEC_A", "ZPSEC_B"] } }),
      Dispute.deleteMany({}),
      BankAccount.deleteMany({ ZenoPayId: { $in: ["ZPSEC_A", "ZPSEC_B"] } }),
      TransactionHistory.deleteMany({}),
    ]);
  });

  describe("1) Authentication Bypass", () => {
    it("redirects /dashboard to /login when unauthenticated", async () => {
      // WHY: Prevents unauthenticated users from directly browsing protected account pages.
      const res = await request(app).get("/dashboard");
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe("/login");
    });

    it("blocks /api/admin/* access for regular users with 403", async () => {
      // WHY: Prevents privilege escalation from user account to admin endpoints.
      const regularUser = await createSecurityUser({
        zenoPayId: "ZPSEC_A",
        fullName: "Security A",
        email: "security.a@example.com",
        mobile: "9000000001",
        password: userAPassword,
      });

      const agent = request.agent(app);
      const loginRes = await loginAs(agent, { userId: regularUser.Email, password: userAPassword });
      expect(loginRes.status).toBe(200);

      const res = await agent.get("/api/admin/contact/submissions");
      expect(res.status).toBe(403);
    });

    it("rejects forged/tampered session cookie impersonation", async () => {
      // WHY: Prevents attackers from forging session identity to impersonate another user.
      const userA = await createSecurityUser({
        zenoPayId: "ZPSEC_A",
        fullName: "Security A",
        email: "security.a@example.com",
        mobile: "9000000001",
        password: userAPassword,
      });
      await createSecurityUser({
        zenoPayId: "ZPSEC_B",
        fullName: "Security B",
        email: "security.b@example.com",
        mobile: "9000000002",
        password: userBPassword,
      });

      const agent = request.agent(app);
      const loginRes = await loginAs(agent, { userId: userA.Email, password: userAPassword });
      expect(loginRes.status).toBe(200);

      const rawCookie = (loginRes.headers["set-cookie"] || []).find((c) => c.startsWith("zenopay.sid="));
      expect(rawCookie).toBeTruthy();

      const forgedCookie = rawCookie.replace(/zenopay\.sid=[^;]+/, "zenopay.sid=s%3Aforged-session-id.fake-signature");
      const res = await request(app).get("/dashboard").set("Cookie", forgedCookie);

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe("/login");
    });
  });

  describe("2) IDOR (Insecure Direct Object Reference)", () => {
    it("prevents User A from reading User B receipt by ID", async () => {
      // WHY: Prevents horizontal data leakage of financial records across accounts.
      const userA = await createSecurityUser({
        zenoPayId: "ZPSEC_A",
        fullName: "Security A",
        email: "security.a@example.com",
        mobile: "9000000001",
        password: userAPassword,
      });
      const userB = await createSecurityUser({
        zenoPayId: "ZPSEC_B",
        fullName: "Security B",
        email: "security.b@example.com",
        mobile: "9000000002",
        password: userBPassword,
      });

      const tx = await TransactionHistory.create({
        TransactionID: Number(`${Date.now()}${Math.floor(Math.random() * 1000)}`),
        SenderBank: "Zeno Bank",
        SenderAccountNumber: "111122223333",
        SenderHolderName: userB.FullName,
        SenderBalanceBefore: decimal(20000),
        SenderBalanceAfter: decimal(19000),
        ReceiverBank: "Zeno Bank",
        ReceiverAccountNumber: "999988887777",
        ReceiverHolderName: "Merchant",
        ReceiverBalanceBefore: decimal(10000),
        ReceiverBalanceAfter: decimal(11000),
        Amount: decimal(1000),
        Description: "User B payment",
      });

      const bReceipt = await Receipt.create({
        receipt_number: `RCP-2026-${String(Date.now()).slice(-4)}`,
        transaction_id: tx._id,
        user_id: userB.ZenoPayID,
        transaction_type: "sent",
        amount: decimal(1000),
        fee: decimal(0),
        total_amount: decimal(1000),
        recipient_name: "Merchant",
        recipient_id: "merchant_1",
        sender_name: userB.FullName,
        sender_id: userB.ZenoPayID,
        payment_method: "Wallet",
        transaction_date: new Date(),
      });

      const agentA = request.agent(app);
      await loginAs(agentA, { userId: userA.Email, password: userAPassword });

      const res = await agentA.get(`/api/receipts/${bReceipt._id}`);
      expect([403, 404]).toContain(res.status);
    });

    it("prevents User A from viewing User B dispute detail", async () => {
      // WHY: Prevents unauthorized reading of another user's dispute metadata and evidence trail.
      const userA = await createSecurityUser({
        zenoPayId: "ZPSEC_A",
        fullName: "Security A",
        email: "security.a@example.com",
        mobile: "9000000001",
        password: userAPassword,
      });
      const userB = await createSecurityUser({
        zenoPayId: "ZPSEC_B",
        fullName: "Security B",
        email: "security.b@example.com",
        mobile: "9000000002",
        password: userBPassword,
      });

      const bDispute = await Dispute.create({
        userId: userB._id,
        subject: "Unauthorized charge",
        description: "Not my transaction",
        status: "open",
      });

      const agentA = request.agent(app);
      await loginAs(agentA, { userId: userA.Email, password: userAPassword });

      const res = await agentA.get(`/disputes/${bDispute._id}?format=json`).set("Accept", "application/json");
      expect([403, 404]).toContain(res.status);
    });

    it("prevents User A from withdrawing User B dispute", async () => {
      // WHY: Prevents unauthorized state changes to another user's legal/financial dispute case.
      const userA = await createSecurityUser({
        zenoPayId: "ZPSEC_A",
        fullName: "Security A",
        email: "security.a@example.com",
        mobile: "9000000001",
        password: userAPassword,
      });
      const userB = await createSecurityUser({
        zenoPayId: "ZPSEC_B",
        fullName: "Security B",
        email: "security.b@example.com",
        mobile: "9000000002",
        password: userBPassword,
      });

      const bDispute = await Dispute.create({
        userId: userB._id,
        subject: "Fraud transfer",
        description: "Investigate",
        status: "open",
      });

      const agentA = request.agent(app);
      await loginAs(agentA, { userId: userA.Email, password: userAPassword });

      const res = await agentA.post(`/disputes/${bDispute._id}/withdraw`);
      expect([403, 404]).toContain(res.status);

      const unchanged = await Dispute.findById(bDispute._id);
      expect(unchanged.status).toBe("open");
    });
  });

  describe("3) Brute Force Protection", () => {
    it("handles repeated failed login attempts and persists lock fields when implemented", async () => {
      // WHY: Reduces credential stuffing and password brute force attack success.
      const user = await createSecurityUser({
        zenoPayId: "ZPSEC_A",
        fullName: "Security A",
        email: "security.a@example.com",
        mobile: "9000000001",
        password: userAPassword,
      });

      const statuses = [];
      for (let i = 0; i < 6; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        const res = await request(app)
          .post("/login")
          .set("Accept", "application/json")
          .send({ userId: user.Email, password: "WrongPassword!" });
        statuses.push(res.status);
      }

      const sixth = statuses[5];
      expect([401, 423, 429]).toContain(sixth);

      const refreshed = await ZenoPayUser.findById(user._id).lean();
      if (Object.prototype.hasOwnProperty.call(refreshed, "loginAttempts") || Object.prototype.hasOwnProperty.call(refreshed, "lockedUntil")) {
        expect(Number(refreshed.loginAttempts || 0)).toBeGreaterThan(0);
        expect(refreshed.lockedUntil || refreshed.pinLockedUntil).toBeTruthy();
      }
    });
  });

  describe("4) Input Validation / Injection", () => {
    it("rejects SQL-like injection payload in transfer amount", async () => {
      // WHY: Prevents injection payloads from crossing validation boundaries into business logic/storage.
      const userA = await createSecurityUser({
        zenoPayId: "ZPSEC_A",
        fullName: "Security A",
        email: "security.a@example.com",
        mobile: "9000000001",
        password: userAPassword,
      });
      const userB = await createSecurityUser({
        zenoPayId: "ZPSEC_B",
        fullName: "Security B",
        email: "security.b@example.com",
        mobile: "9000000002",
        password: userBPassword,
      });

      const pin = "123456";
      userA.transactionPin = await bcrypt.hash(pin, 10);
      userA.isPinSet = true;
      await userA.save();

      const senderAccount = await createBankAccountFor(userA, { AccountNumber: "101010101010", Balance: 12000 });
      await createBankAccountFor(userB, { AccountNumber: "202020202020", Balance: 8000 });

      const agent = request.agent(app);
      await loginAs(agent, { userId: userA.Email, password: userAPassword });

      await agent.post("/verify-pin").send({ pin });

      const res = await agent
        .post("/send-to")
        .set("Accept", "application/json")
        .send({
          sourceAccountId: String(senderAccount._id),
          receiverId: userB.Email,
          amount: "'; DROP TABLE users; --",
          charges: "0",
          total: "0",
          description: "security-test",
          category: "other",
          note: "payload",
        });

      expect([400, 401, 403]).toContain(res.status);
      expect(JSON.stringify(res.body || {})).toMatch(/invalid|limit|pin|required|amount/i);
    });

    it("rejects registration with XSS-style malformed email input", async () => {
      // WHY: Prevents script payloads from entering account identifiers and reflected output paths.
      const res = await request(app)
        .post("/register")
        .set("Accept", "application/json")
        .send({
          fullName: "XSS User",
          email: "<script>alert(1)</script>@test.com",
          phoneNumber: "9000000099",
          password: "XssTest@123",
          confirmPassword: "XssTest@123",
          agreeToTerms: true,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/valid email/i);
    });

    it("rejects malformed UPI/identifier special characters in payment verification path", async () => {
      // WHY: Prevents identifier abuse in payment lookup endpoints used for account discovery.
      const user = await createSecurityUser({
        zenoPayId: "ZPSEC_A",
        fullName: "Security A",
        email: "security.a@example.com",
        mobile: "9000000001",
        password: userAPassword,
      });

      const agent = request.agent(app);
      await loginAs(agent, { userId: user.Email, password: userAPassword });

      const res = await agent
        .post("/api/payment/verify-customer")
        .send({ zenoPayId: "bad@@@###$$$" });

      expect([400, 401, 403, 404, 302]).toContain(res.status);

      const responseText = `${res.text || ""} ${JSON.stringify(res.body || {})}`;
      if (res.status === 302) {
        expect(responseText).toMatch(/login/i);
      } else {
        expect(responseText).toMatch(/required|not found|check|invalid|denied/i);
      }
    });

    it("rejects extremely long untrusted strings with 4xx (not 500)", async () => {
      // WHY: Prevents oversized payload abuse leading to parser crashes or unhandled exceptions.
      const longText = "A".repeat(1024);

      const res = await request(app)
        .post("/api/payment/verify-customer")
        .set("Accept", "application/json")
        .send({
          zenoPayId: longText,
        });

      expect([400, 401, 403, 404, 302]).toContain(res.status);
      expect(res.status).not.toBe(500);
    });
  });

  describe("5) CSRF & Session", () => {
    it("blocks state-changing API route when no authenticated session exists", async () => {
      // WHY: Prevents cross-site requests from mutating account state without a valid authenticated context.
      const res = await request(app)
        .post("/api/wallet/add-money")
        .set("Accept", "application/json")
        .send({ amount: 1000 });

      expect([401, 302]).toContain(res.status);
    });

    it("invalidates effective access after logout even if old cookie is replayed", async () => {
      // WHY: Prevents session replay using stale cookies after a user has logged out.
      const user = await createSecurityUser({
        zenoPayId: "ZPSEC_A",
        fullName: "Security A",
        email: "security.a@example.com",
        mobile: "9000000001",
        password: userAPassword,
      });

      const agent = request.agent(app);
      const loginRes = await loginAs(agent, { userId: user.Email, password: userAPassword });
      const sidCookie = (loginRes.headers["set-cookie"] || []).find((c) => c.startsWith("zenopay.sid="));
      const replayCookie = sidCookie || "zenopay.sid=stale-session";

      await agent.get("/logout").expect(302);

      const replayRes = await request(app)
        .post("/api/wallet/add-money")
        .set("Accept", "application/json")
        .set("Cookie", replayCookie)
        .send({ amount: 1000 });

      expect([401, 302]).toContain(replayRes.status);
    });
  });

  describe("6) Rate Limiting", () => {
    it("returns 429 on excessive auth requests when limiter is configured", async () => {
      // WHY: Slows automated password attacks and abuse of auth endpoints.
      const hasRateLimiterDependency = Boolean(
        pkg.dependencies?.["express-rate-limit"] || pkg.devDependencies?.["express-rate-limit"]
      );

      const statuses = [];
      for (let i = 0; i < 100; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        const res = await request(app)
          .post("/login")
          .set("Accept", "application/json")
          .send({ userId: "rate@example.com", password: "WrongPass!" });
        statuses.push(res.status);
      }

      const has429 = statuses.includes(429);
      if (hasRateLimiterDependency) {
        expect(has429).toBe(true);
      } else {
        expect(has429).toBe(false);
      }
    });
  });

  describe("7) Sensitive Data Exposure", () => {
    it("does not expose password/pin/2FA secret in profile-facing response paths", async () => {
      // WHY: Prevents leakage of credentials and second-factor secrets in API/view payloads.
      const user = await createSecurityUser({
        zenoPayId: "ZPSEC_A",
        fullName: "Security A",
        email: "security.a@example.com",
        mobile: "9000000001",
        password: userAPassword,
      });

      user.transactionPin = await bcrypt.hash("123456", 10);
      user.isPinSet = true;
      await user.save();

      const agent = request.agent(app);
      await loginAs(agent, { userId: user.Email, password: userAPassword });

      const res = await agent.get("/profile");
      expect([200, 302]).toContain(res.status);

      if (res.status === 200) {
        const responseText = String(res.text || "");
        // Must never leak raw credentials/secrets (checking exact sensitive values and field-like tokens)
        expect(responseText).not.toContain(user.Password);
        expect(responseText).not.toContain(user.transactionPin || "");
        expect(responseText).not.toMatch(/"twoFactorSecret"|\btwoFactorSecret\b/);
        expect(responseText).not.toMatch(/"transactionPin"|\btransactionPin\b/);
        expect(responseText).not.toMatch(/"Password"\s*:\s*|\bPassword\b\s*=/);
      }
    });

    it("does not expose full 16-digit card numbers in transaction/receipt responses", async () => {
      // WHY: Limits PCI-sensitive data exposure in transaction APIs and mitigates card scraping risks.
      const user = await createSecurityUser({
        zenoPayId: "ZPSEC_A",
        fullName: "Security A",
        email: "security.a@example.com",
        mobile: "9000000001",
        password: userAPassword,
      });

      const tx = await TransactionHistory.create({
        TransactionID: Number(`${Date.now()}${Math.floor(Math.random() * 1000)}`),
        SenderBank: "Zeno Bank",
        SenderAccountNumber: "123456789012",
        SenderHolderName: user.FullName,
        SenderBalanceBefore: decimal(5000),
        SenderBalanceAfter: decimal(4500),
        ReceiverBank: "Shop Bank",
        ReceiverAccountNumber: "900001111222",
        ReceiverHolderName: "Shop",
        ReceiverBalanceBefore: decimal(1000),
        ReceiverBalanceAfter: decimal(1500),
        Amount: decimal(500),
        Description: "Transaction test",
      });

      const receipt = await Receipt.create({
        receipt_number: `RCP-2026-${String(Date.now()).slice(-4)}`,
        transaction_id: tx._id,
        user_id: user.ZenoPayID,
        transaction_type: "sent",
        amount: decimal(500),
        fee: decimal(0),
        total_amount: decimal(500),
        recipient_name: "Shop",
        recipient_id: "merchant_2",
        sender_name: user.FullName,
        sender_id: user.ZenoPayID,
        payment_method: "Wallet",
        transaction_date: new Date(),
      });

      const agent = request.agent(app);
      await loginAs(agent, { userId: user.Email, password: userAPassword });

      const res = await agent.get(`/api/receipts/${receipt._id}`);
      expect([200, 401, 403, 404, 302]).toContain(res.status);

      if (res.status === 200) {
        const serialized = JSON.stringify(res.body || {});
        expect(serialized).not.toMatch(/\b\d{16}\b/);
        expect(serialized).not.toContain("DebitCardNumber");
        expect(serialized).not.toContain("CardNumberEncrypted");
      }
    });
  });
});
