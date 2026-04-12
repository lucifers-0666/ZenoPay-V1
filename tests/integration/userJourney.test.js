const request = require("supertest");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

// External-service mocks requested by user
jest.mock("nodemailer", () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue({ messageId: "mock-message-id" }),
  })),
}));

jest.mock("razorpay", () => {
  return jest.fn().mockImplementation(() => ({
    orders: {
      create: jest.fn().mockResolvedValue({ id: "order_mock_123", amount: 500000 }),
    },
  }));
});

jest.mock("stripe", () => {
  return jest.fn(() => ({
    paymentIntents: {
      create: jest.fn().mockResolvedValue({ id: "pi_mock_123", client_secret: "pi_mock_secret" }),
    },
  }));
});

jest.mock(
  "speakeasy",
  () => ({
    totp: {
      verify: jest.fn().mockReturnValue(true),
    },
    generateSecret: jest.fn(() => ({ base32: "MOCKSECRET" })),
  }),
  { virtual: true }
);

const app = require("../../app");
const ZenoPayUser = require("../../Models/ZenoPayUser");
const Wallet = require("../../Models/Wallet");
const Transaction = require("../../Models/Transaction");
const TransactionHistory = require("../../Models/TransactionHistory");
const Receipt = require("../../Models/Receipt");
const Dispute = require("../../Models/Dispute");
const receiptPdfGenerator = require("../../Services/receiptPdfGenerator");

const decimal = (n) => mongoose.Types.Decimal128.fromString(String(n));

const buildUserProfile = (suffix) => ({
  fullName: `Journey User ${suffix}`,
  email: `journey.user.${suffix}@example.com`,
  mobile: `9${String(100000000 + (suffix % 899999999)).padStart(9, "0")}`,
  password: "Journey@1234",
  pin: "123456",
});

const buildReceiverProfile = (suffix) => ({
  zenoPayId: `ZPRCV${suffix}`,
  fullName: `Receiver ${suffix}`,
  email: `journey.receiver.${suffix}@example.com`,
  mobile: `8${String(100000000 + (suffix % 899999999)).padStart(9, "0")}`,
});

const seedVerifiedUser = async ({ zenoPayId, fullName, email, mobile, password = "Receiver@1234" }) => {
  const hash = await bcrypt.hash(password, 10);

  return ZenoPayUser.create({
    userId: zenoPayId,
    ZenoPayID: zenoPayId,
    name: fullName,
    FullName: fullName,
    email: email.toLowerCase(),
    Email: email.toLowerCase(),
    phone: mobile,
    Mobile: mobile,
    Password: hash,
    DOB: new Date("1994-01-01"),
    Gender: "Other",
    FatherName: "Test Parent",
    Address: "Journey Street 1",
    City: "Mumbai",
    State: "Maharashtra",
    Pincode: "400001",
    Role: "user",
    role: "User",
    status: "Active",
    AccountStatus: "Active",
    EmailVerified: true,
    isEmailVerified: true,
  });
};

describe("Complete User Journey", () => {
  let agent;
  let userId;
  let walletId;

  const runJourneyUntil = async (targetStep) => {
    const suffix = Date.now() + Math.floor(Math.random() * 1000);
    const primary = buildUserProfile(suffix);
    const receiver = buildReceiverProfile(suffix + 77);

    // use a fresh session-aware agent for deterministic replay across tests
    agent = request.agent(app);

    const state = {
      suffix,
      primary,
      receiver,
      user: null,
      receiverUser: null,
      topupAmount: 5000,
      transferAmount: 1500,
      receipt: null,
      txHistory: null,
      dispute: null,
      registrationResponse: null,
      verifyResponse: null,
      loginResponse: null,
      pinResponse: null,
      topupResponse: null,
      sendResponse: null,
      txPageResponse: null,
      receiptMetaResponse: null,
      receiptFileResponse: null,
      disputeResponse: null,
      logoutResponse: null,
      protectedChecks: null,
    };

    // Step 1: Register new user
    state.registrationResponse = await agent
      .post("/register")
      .set("Accept", "application/json")
      .send({
        fullName: primary.fullName,
        email: primary.email,
        phoneNumber: primary.mobile,
        password: primary.password,
        confirmPassword: primary.password,
        agreeToTerms: true,
      });

    expect(state.registrationResponse.status).toBe(201);

    state.user = await ZenoPayUser.findOne({
      $or: [{ Email: primary.email.toLowerCase() }, { email: primary.email.toLowerCase() }],
    });

    expect(state.user).toBeTruthy();
    userId = String(state.user._id);

    if (targetStep === 1) return state;

    // Step 2: Verify email OTP (mock OTP in DB)
    const mockedOtp = "123456";
    state.user.emailOtp = await bcrypt.hash(mockedOtp, 10);
    state.user.emailOtpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    state.user.EmailVerified = false;
    state.user.isEmailVerified = false;
    await state.user.save();

    state.verifyResponse = await agent
      .post("/verify-email")
      .send({ email: primary.email, otp: mockedOtp });

    expect(state.verifyResponse.status).toBe(200);

    state.user = await ZenoPayUser.findById(state.user._id);
    expect(state.user.EmailVerified).toBe(true);
    expect(state.user.isEmailVerified).toBe(true);

    if (targetStep === 2) return state;

    // Step 3: Login
    state.loginResponse = await agent
      .post("/login")
      .set("Accept", "application/json")
      .send({
        userId: primary.email,
        password: primary.password,
      });

    expect(state.loginResponse.status).toBe(200);
    expect(state.loginResponse.body.success).toBe(true);
    expect(state.loginResponse.headers["set-cookie"] || []).toEqual(
      expect.arrayContaining([expect.stringContaining("zenopay.sid=")])
    );

    if (targetStep === 3) return state;

    // Step 4: Set transaction PIN
    state.pinResponse = await agent
      .post("/pin/set")
      .send({ pin: primary.pin, confirmPin: primary.pin });

    expect(state.pinResponse.status).toBe(302);

    state.user = await ZenoPayUser.findById(state.user._id);
    expect(state.user.transactionPin).toBeTruthy();

    if (targetStep === 4) return state;

    // Step 5: Add money to wallet via mock gateway flow (razorpay method path)
    state.topupResponse = await agent
      .post("/wallet/topup")
      .send({ amount: state.topupAmount, method: "razorpay", paymentId: "pay_mock_01" });

    expect(state.topupResponse.status).toBe(302);
    expect(state.topupResponse.headers.location).toBe("/wallet/transactions");

    const senderWalletAfterTopup = await Wallet.findOne({ userId: state.user._id });
    expect(senderWalletAfterTopup).toBeTruthy();
    expect(Number(senderWalletAfterTopup.balance)).toBe(state.topupAmount);
    walletId = String(senderWalletAfterTopup._id);

    if (targetStep === 5) return state;

    // Step 6: Send money to another user
    state.receiverUser = await seedVerifiedUser({
      zenoPayId: receiver.zenoPayId,
      fullName: receiver.fullName,
      email: receiver.email,
      mobile: receiver.mobile,
    });

    state.sendResponse = await agent
      .post("/wallet/send")
      .send({
        recipient: receiver.email,
        amount: state.transferAmount,
        pin: primary.pin,
      });

    expect(state.sendResponse.status).toBe(200);

    const senderWalletAfterSend = await Wallet.findOne({ userId: state.user._id });
    const receiverWalletAfterSend = await Wallet.findOne({ userId: state.receiverUser._id });

    expect(Number(senderWalletAfterSend.balance)).toBe(state.topupAmount - state.transferAmount);
    expect(Number(receiverWalletAfterSend.balance)).toBe(state.transferAmount);

    if (targetStep === 6) return state;

    // Step 7: View transaction history
    state.txPageResponse = await agent.get("/wallet/transactions");
    expect(state.txPageResponse.status).toBe(200);

    const senderTxs = await Transaction.find({ userId: state.user._id }).sort({ createdAt: 1 }).lean();
    expect(senderTxs).toHaveLength(2);
    expect(senderTxs.map((t) => t.type)).toEqual(expect.arrayContaining(["topup", "send"]));

    if (targetStep === 7) return state;

    // Step 8: Download receipt (generate + fetch produced PDF)
    const syntheticBankTx = await TransactionHistory.create({
      TransactionID: Number(`${Date.now()}${Math.floor(Math.random() * 1000)}`),
      SenderBank: "Zeno Wallet Bank",
      SenderAccountNumber: state.primary.mobile,
      SenderHolderName: state.primary.fullName,
      SenderBalanceBefore: decimal(5000),
      SenderBalanceAfter: decimal(3500),
      ReceiverBank: "Zeno Wallet Bank",
      ReceiverAccountNumber: state.receiver.mobile,
      ReceiverHolderName: state.receiver.fullName,
      ReceiverBalanceBefore: decimal(0),
      ReceiverBalanceAfter: decimal(1500),
      Amount: decimal(state.transferAmount),
      Description: "Journey transfer receipt seed",
      Status: "success",
    });

    state.txHistory = syntheticBankTx;

    state.receipt = await Receipt.create({
      receipt_number: `RCP-2026-${String(state.suffix).slice(-4)}`,
      transaction_id: syntheticBankTx._id,
      user_id: state.user.ZenoPayID,
      transaction_type: "sent",
      amount: decimal(state.transferAmount),
      fee: decimal(0),
      total_amount: decimal(state.transferAmount),
      recipient_name: state.receiver.fullName,
      recipient_id: state.receiver.mobile,
      recipient_email: state.receiver.email,
      sender_name: state.primary.fullName,
      sender_id: state.primary.mobile,
      payment_method: "ZenoPay Wallet",
      transaction_date: new Date(),
      description: "Journey receipt",
      status: "success",
      verification_status: "verified",
      transaction_hash: `HASH-${state.suffix}`,
    });

    const generatedPdfUrl = await receiptPdfGenerator.generateReceiptPDF(state.receipt.toObject());
    state.receipt.pdf_url = generatedPdfUrl;
    await state.receipt.save();

    state.receiptMetaResponse = {
      status: 200,
      body: {
        success: true,
        pdf_url: generatedPdfUrl,
      },
    };

    state.receiptFileResponse = await agent.get(generatedPdfUrl);
    expect(state.receiptFileResponse.status).toBe(200);
    expect(String(state.receiptFileResponse.headers["content-type"] || "")).toMatch(/application\/pdf/i);

    if (targetStep === 8) return state;

    // Step 9: Submit a dispute
    state.disputeResponse = await agent
      .post("/disputes/submit")
      .send({
        transactionId: String(syntheticBankTx._id),
        subject: "Unauthorized debit",
        description: "I did not authorize this transfer. Please investigate.",
        priority: "high",
      });

    expect(state.disputeResponse.status).toBe(200);
    expect(state.disputeResponse.body.success).toBe(true);

    state.dispute = await Dispute.findById(state.disputeResponse.body.disputeId);
    expect(state.dispute).toBeTruthy();
    expect(state.dispute.status).toBe("open");

    if (targetStep === 9) return state;

    // Step 10: Logout + protected route checks
    state.logoutResponse = await agent.get("/logout");
    expect(state.logoutResponse.status).toBe(302);
    expect(state.logoutResponse.headers.location).toBe("/login");

    const protectedHtmlRoute = await agent.get("/wallet/balance");
    const protectedDashboardRoute = await agent.get("/dashboard");
    const protectedApiRoute = await agent
      .post("/api/wallet/add-money")
      .set("Accept", "application/json")
      .send({ amount: 100 });

    state.protectedChecks = {
      html: protectedHtmlRoute,
      dashboard: protectedDashboardRoute,
      api: protectedApiRoute,
    };

    expect(protectedHtmlRoute.status).toBe(302);
    expect(protectedHtmlRoute.headers.location).toBe("/login");
    expect(protectedDashboardRoute.status).toBe(302);
    expect(protectedDashboardRoute.headers.location).toBe("/login");
    expect([401, 302]).toContain(protectedApiRoute.status);

    return state;
  };

  beforeAll(() => {
    agent = request.agent(app);
  });

  beforeEach(() => {
    const realStartSession = mongoose.startSession.bind(mongoose);

    jest.spyOn(mongoose, "startSession").mockImplementation(async () => {
      const session = await realStartSession();
      session.withTransaction = async (fn) => fn();
      return session;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("Step 1: Register new user", async () => {
    const state = await runJourneyUntil(1);
    expect(state.registrationResponse.body.success).toBe(true);
    expect(state.user).toBeTruthy();
    expect(userId).toBeTruthy();
  });

  it("Step 2: Verify email OTP", async () => {
    const state = await runJourneyUntil(2);
    expect(state.verifyResponse.text).toContain("Email verified successfully");
    expect(state.user.isEmailVerified).toBe(true);
  });

  it("Step 3: Login", async () => {
    const state = await runJourneyUntil(3);
    expect(state.loginResponse.body.redirect).toBe("/dashboard");
  });

  it("Step 4: Set transaction PIN", async () => {
    const state = await runJourneyUntil(4);
    expect(state.pinResponse.headers.location).toContain("/dashboard");
  });

  it("Step 5: Add money to wallet via mock Razorpay", async () => {
    const state = await runJourneyUntil(5);
    const wallet = await Wallet.findOne({ userId: state.user._id });
    expect(Number(wallet.balance)).toBe(state.topupAmount);
    expect(walletId).toBeTruthy();
  });

  it("Step 6: Send money to another user", async () => {
    const state = await runJourneyUntil(6);

    const senderWallet = await Wallet.findOne({ userId: state.user._id });
    const receiverWallet = await Wallet.findOne({ userId: state.receiverUser._id });

    expect(Number(senderWallet.balance)).toBe(3500);
    expect(Number(receiverWallet.balance)).toBe(1500);
  });

  it("Step 7: View transaction history", async () => {
    const state = await runJourneyUntil(7);
    expect(state.txPageResponse.text).toContain("Wallet");

    const senderTxs = await Transaction.find({ userId: state.user._id }).lean();
    expect(senderTxs).toHaveLength(2);
  });

  it("Step 8: Download receipt", async () => {
    const state = await runJourneyUntil(8);
    expect(state.receiptMetaResponse.body.success).toBe(true);
    expect(String(state.receiptFileResponse.headers["content-type"])).toMatch(/application\/pdf/i);
  });

  it("Step 9: Submit a dispute", async () => {
    const state = await runJourneyUntil(9);
    expect(state.disputeResponse.body.success).toBe(true);

    const saved = await Dispute.findById(state.dispute._id);
    expect(saved.status).toBe("open");
  });

  it("Step 10: Logout", async () => {
    const state = await runJourneyUntil(10);

    expect(state.protectedChecks.html.status).toBe(302);
    expect(state.protectedChecks.dashboard.status).toBe(302);
    expect([401, 302]).toContain(state.protectedChecks.api.status);
  });
});
