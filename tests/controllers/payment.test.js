const crypto = require('crypto');
const mongoose = require('mongoose');

jest.mock('razorpay', () => ({
  orders: {
    create: jest.fn().mockResolvedValue({ id: 'order_test123', amount: 50000 }),
  },
}));

jest.mock('stripe', () => () => ({
  paymentIntents: {
    create: jest.fn().mockResolvedValue({ client_secret: 'pi_test_secret' }),
  },
}));

jest.mock('../../Services/EmailService', () => ({
  sendEmail: jest.fn().mockResolvedValue({ sent: true }),
}));

const PaymentGatewayController = require('../../Controllers/PaymentGatewayController');
const ZenoPayUser = require('../../Models/ZenoPayUser');
const BankAccount = require('../../Models/BankAccount');
const TransactionHistory = require('../../Models/TransactionHistory');

const createMockRes = () => {
  const res = {};
  res.statusCode = 200;
  res.status = jest.fn().mockImplementation((code) => {
    res.statusCode = code;
    return res;
  });
  res.json = jest.fn().mockReturnValue(res);
  res.render = jest.fn().mockReturnValue(res);
  res.redirect = jest.fn().mockReturnValue(res);
  return res;
};

const createUser = async (overrides = {}) => {
  return ZenoPayUser.create({
    _id: new mongoose.Types.ObjectId(),
    ZenoPayID: overrides.ZenoPayID || `ZP${Date.now()}`,
    FullName: overrides.FullName || 'Payment User',
    Email: overrides.Email || `payment-${Date.now()}@example.com`,
    Mobile: overrides.Mobile || '9000000000',
    EmailVerified: true,
    isEmailVerified: true,
    Role: 'user',
    DOB: new Date('1995-01-01'),
    Gender: 'Male',
    FatherName: 'Test Father',
    Address: 'Test Address',
    City: 'Mumbai',
    State: 'Maharashtra',
    Pincode: '400001',
    Password: 'not-used',
    ...overrides,
  });
};

const createBankAccount = async (overrides = {}) => {
  return BankAccount.create({
    AccountNumber: overrides.AccountNumber || String(100000000000 + Math.floor(Math.random() * 900000000000)),
    BankName: overrides.BankName || 'Zeno Bank',
    BankId: overrides.BankId || 'ZB001',
    BankCity: overrides.BankCity || 'Mumbai',
    BankState: overrides.BankState || 'Maharashtra',
    BankEmail: overrides.BankEmail || 'support@zenobank.test',
    AccountType: overrides.AccountType || 'Savings',
    OpeningBalance: overrides.OpeningBalance || mongoose.Types.Decimal128.fromString('0'),
    Balance: overrides.Balance || mongoose.Types.Decimal128.fromString('0'),
    TransactionLimit: overrides.TransactionLimit || mongoose.Types.Decimal128.fromString('1000000'),
    ZenoPayId: overrides.ZenoPayId,
    FullName: overrides.FullName || 'Payment User',
    DOB: overrides.DOB || new Date('1995-01-01'),
    Gender: overrides.Gender || 'Male',
    Profession: overrides.Profession || 'Engineer',
    AnnualIncome: overrides.AnnualIncome || '500000',
    Email: overrides.Email || 'payment@example.com',
    Mobile: overrides.Mobile || '9000000000',
    City: overrides.City || 'Mumbai',
    State: overrides.State || 'Maharashtra',
    Pincode: overrides.Pincode || '400001',
    DebitCardNumber: overrides.DebitCardNumber || '4111111111111111',
    NameOnCard: overrides.NameOnCard || 'PAYMENT USER',
    CardExpiry: overrides.CardExpiry || '12/30',
    CardType: overrides.CardType || 'debit',
    AccountStatus: overrides.AccountStatus || 'Active',
    DebitCardStatus: overrides.DebitCardStatus || 'Active',
  });
};

describe('Payment Gateway Controller', () => {
  afterEach(async () => {
    jest.restoreAllMocks();
    await TransactionHistory.deleteMany({});
    await BankAccount.deleteMany({});
    await ZenoPayUser.deleteMany({});
  });

  it('creates a Razorpay-style order with a valid order ID and paise amount', async () => {
    const req = {
      body: {
        amount: 500,
        currency: 'INR',
        receipt: 'rcpt_001',
        notes: { source: 'test' },
      },
      merchant: {
        ZenoPayId: 'ZPMERCHANT1',
        BusinessName: 'Test Merchant',
      },
    };
    const res = createMockRes();

    await PaymentGatewayController.createOrder(req, res);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      entity: 'order',
      amount: 50000,
      amount_due: 50000,
      status: 'created',
      merchantId: 'ZPMERCHANT1',
      merchantName: 'Test Merchant',
    }));
    expect(String(res.json.mock.calls[0][0].id)).toMatch(/^order_/);
  });

  it('verifies payments with a valid signature and rejects an invalid one', async () => {
    const merchant = {
      SecretKey: 'sk_test_secret',
      BusinessName: 'Test Merchant',
      ZenoPayId: 'ZPMERCHANT1',
    };
    const orderId = 'order_test123';
    const paymentId = 'pay_test456';
    const validSignature = crypto
      .createHmac('sha256', merchant.SecretKey)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    const validReq = {
      body: {
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: validSignature,
      },
      merchant,
    };
    const invalidReq = {
      body: {
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: 'bad_signature',
      },
      merchant,
    };

    const validRes = createMockRes();
    const invalidRes = createMockRes();

    await PaymentGatewayController.verifyPayment(validReq, validRes);
    await PaymentGatewayController.verifyPayment(invalidReq, invalidRes);

    expect(validRes.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      signatureIsValid: true,
    }));
    expect(invalidRes.status).toHaveBeenCalledWith(400);
    expect(invalidRes.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      signatureIsValid: false,
    }));
  });

  it('marks failed payments as failed and does not credit the customer balance', async () => {
    const customer = await createUser({ ZenoPayID: 'ZPCUSTOMER1', Email: 'customer@example.com', FullName: 'Customer One' });
    const merchantUser = await createUser({ ZenoPayID: 'ZPMERCHANT2', Email: 'merchant@example.com', FullName: 'Merchant Two' });

    const customerAccount = await createBankAccount({
      ZenoPayId: customer.ZenoPayID,
      FullName: customer.FullName,
      Email: customer.Email,
      Mobile: customer.Mobile,
      Balance: mongoose.Types.Decimal128.fromString('10000'),
      AccountNumber: '999111222333',
    });

    const merchantAccount = await createBankAccount({
      ZenoPayId: merchantUser.ZenoPayID,
      FullName: merchantUser.FullName,
      Email: merchantUser.Email,
      Mobile: merchantUser.Mobile,
      Balance: mongoose.Types.Decimal128.fromString('5000'),
      AccountNumber: '444555666777',
      BusinessName: 'Merchant Bank Account',
    });

    const merchant = {
      BusinessName: 'Merchant Two',
      ZenoPayId: merchantUser.ZenoPayID,
      SecretKey: 'sk_payment_test',
      WebhookUrl: '',
      updateStats: jest.fn().mockResolvedValue(true),
    };

    const req = {
      body: {
        transactionRef: 'txn_ref_001',
        paymentMethod: 'card',
        customerZenoPayId: customer.ZenoPayID,
        amount: 50000,
        paymentDetails: { accountNumber: customerAccount.AccountNumber },
        description: 'Test payment',
      },
      merchant,
    };
    const res = createMockRes();

    await PaymentGatewayController.processPayment(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      error: 'Insufficient balance',
    }));

    const refreshedCustomerAccount = await BankAccount.findOne({ AccountNumber: customerAccount.AccountNumber });
    expect(refreshedCustomerAccount.Balance.toString()).toBe('10000');

    const failedTx = await TransactionHistory.findOne({ Status: 'failed' }).sort({ TransactionID: -1 }).limit(1);
    expect(failedTx).toBeTruthy();
    expect(String(failedTx.Amount)).toBe('50000');
    expect(failedTx.Description).toMatch(/Insufficient balance/i);
    expect(merchant.updateStats).not.toHaveBeenCalled();
  });
});
