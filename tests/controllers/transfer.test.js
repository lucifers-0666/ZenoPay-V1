const mongoose = require('mongoose');

jest.mock('../../Services/EmailService', () => ({
  sendEmail: jest.fn().mockResolvedValue({ sent: true }),
}));

jest.mock('../../Services/cashbackService', () => ({
  processCashback: jest.fn().mockResolvedValue({ cashbackAmount: 0 }),
}));

jest.mock('../../config/transactionLimits', () => ({
  getLimitsByTier: jest.fn(() => ({ dailyLimit: 1000000 })),
}));

const mockState = {
  users: [],
  accounts: [],
  histories: [],
  failReceiverSave: false,
  receiverAccountNumber: null,
};

const toPlain = (value) => JSON.parse(JSON.stringify(value));

const createQuery = (result) => ({
  select() {
    return this;
  },
  lean() {
    return Promise.resolve(result ? toPlain(result) : result);
  },
  then(resolve, reject) {
    return this.lean().then(resolve, reject);
  },
  catch(reject) {
    return this.lean().catch(reject);
  },
});

const makeAccountDoc = (data) => {
  const doc = {
    ...data,
    Balance: Number(data.Balance || 0),
    save: jest.fn(async function save() {
      if (mockState.failReceiverSave && String(this.AccountNumber) === String(mockState.receiverAccountNumber)) {
        throw new Error('receiver update failed');
      }
      const plain = toPlain({ ...this, save: undefined });
      const idx = mockState.accounts.findIndex((row) => String(row._id) === String(this._id));
      if (idx >= 0) {
        mockState.accounts[idx] = plain;
      } else {
        mockState.accounts.push(plain);
      }
      return this;
    }),
  };
  return doc;
};

const makeTransactionHistoryModel = () => {
  function MockTransactionHistory(data) {
    Object.assign(this, data);
    this._id = new mongoose.Types.ObjectId();
    this.save = jest.fn(async function save() {
      mockState.histories.push(toPlain({ ...this, save: undefined }));
      return this;
    });
  }

  MockTransactionHistory.exists = jest.fn(async () => false);
  MockTransactionHistory.find = jest.fn(async () => []);
  MockTransactionHistory.findOne = jest.fn(() => ({
    sort() {
      return {
        limit: async () => mockState.histories[mockState.histories.length - 1] || null,
      };
    },
  }));
  MockTransactionHistory.deleteMany = jest.fn(async () => {
    mockState.histories = [];
  });

  return MockTransactionHistory;
};

jest.mock('../../Models/ZenoPayUser', () => ({
  findOne: jest.fn((query = {}) => {
    const or = Array.isArray(query.$or) ? query.$or : [query];
    const found = mockState.users.find((user) => or.some((clause) => Object.entries(clause).every(([key, value]) => String(user[key]) === String(value))));
    return createQuery(found || null);
  }),
  findById: jest.fn((id) => {
    const found = mockState.users.find((user) => String(user._id) === String(id));
    return createQuery(found || null);
  }),
}));

jest.mock('../../Models/BankAccount', () => ({
  findById: jest.fn((id) => {
    const found = mockState.accounts.find((account) => String(account._id) === String(id));
    return Promise.resolve(found ? makeAccountDoc(found) : null);
  }),
  findOne: jest.fn(async (query = {}) => {
    let found = null;

    if (query.AccountNumber) {
      found = mockState.accounts.find((account) => String(account.AccountNumber) === String(query.AccountNumber));
    } else if (query.ZenoPayId) {
      found = mockState.accounts.find((account) => String(account.ZenoPayId) === String(query.ZenoPayId));
    }

    return found ? makeAccountDoc(found) : null;
  }),
  find: jest.fn(async () => []),
}));

jest.mock('../../Models/TransactionHistory', () => makeTransactionHistoryModel());
jest.mock('../../Models/Notification', () => ({
  create: jest.fn().mockResolvedValue(true),
}));

const TransferController = require('../../Controllers/TransferMoney');
const BankAccount = require('../../Models/BankAccount');
const TransactionHistory = require('../../Models/TransactionHistory');
const ZenoPayUser = require('../../Models/ZenoPayUser');
const Notification = require('../../Models/Notification');
const { processCashback } = require('../../Services/cashbackService');

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

const createSessionStub = () => {
  const snapshot = () => ({
    users: mockState.users.map(toPlain),
    accounts: mockState.accounts.map(toPlain),
    histories: mockState.histories.map(toPlain),
  });

  return {
    withTransaction: jest.fn(async (fn) => {
      const before = snapshot();
      try {
        return await fn();
      } catch (error) {
        mockState.users = before.users;
        mockState.accounts = before.accounts;
        mockState.histories = before.histories;
        throw error;
      }
    }),
    inTransaction: jest.fn(() => false),
    endSession: jest.fn(),
  };
};

const seedUser = (overrides = {}) => {
  const user = {
    _id: new mongoose.Types.ObjectId(),
    ZenoPayID: overrides.ZenoPayID || `ZP${Date.now()}${Math.floor(Math.random() * 1000)}`,
    FullName: overrides.FullName || 'Test User',
    Email: overrides.Email || `user-${Date.now()}@example.com`,
    Mobile: overrides.Mobile || '9000000000',
    email: overrides.Email || `user-${Date.now()}@example.com`,
    kycTier: overrides.kycTier ?? 0,
    ...overrides,
  };
  mockState.users.push(user);
  return user;
};

const seedAccount = (overrides = {}) => {
  const account = {
    _id: new mongoose.Types.ObjectId(),
    AccountNumber: overrides.AccountNumber || String(Math.floor(100000000000 + Math.random() * 900000000000)),
    BankName: overrides.BankName || 'Zeno Bank',
    BankId: overrides.BankId || 'ZB001',
    BankCity: overrides.BankCity || 'Mumbai',
    BankState: overrides.BankState || 'Maharashtra',
    BankEmail: overrides.BankEmail || 'support@zenobank.test',
    AccountType: overrides.AccountType || 'Savings',
    OpeningBalance: Number(overrides.OpeningBalance ?? 0),
    Balance: Number(overrides.Balance ?? 0),
    TransactionLimit: Number(overrides.TransactionLimit ?? 1000000),
    ZenoPayId: overrides.ZenoPayId,
    FullName: overrides.FullName || 'Test User',
    DOB: overrides.DOB || new Date('1995-01-01'),
    Gender: overrides.Gender || 'Male',
    Profession: overrides.Profession || 'Engineer',
    AnnualIncome: overrides.AnnualIncome || '500000',
    Email: overrides.Email || 'user@example.com',
    Mobile: overrides.Mobile || '9000000000',
    City: overrides.City || 'Mumbai',
    State: overrides.State || 'Maharashtra',
    Pincode: overrides.Pincode || '400001',
    DebitCardNumber: overrides.DebitCardNumber || '4111111111111111',
    NameOnCard: overrides.NameOnCard || 'TEST USER',
    CardExpiry: overrides.CardExpiry || '12/30',
    CardType: overrides.CardType || 'debit',
    AccountStatus: overrides.AccountStatus || 'Active',
    DebitCardStatus: overrides.DebitCardStatus || 'Active',
  };
  mockState.accounts.push(account);
  return account;
};

const buildReq = (senderUser, body = {}) => ({
  session: {
    user: {
      _id: senderUser._id,
      ZenoPayID: senderUser.ZenoPayID,
      Email: senderUser.Email,
      email: senderUser.Email,
    },
  },
  body,
  headers: { 'user-agent': 'Jest' },
});

describe('Transfer Controller', () => {
  let mongooseStartSessionSpy;

  beforeEach(() => {
    mockState.users = [];
    mockState.accounts = [];
    mockState.histories = [];
    mockState.failReceiverSave = false;
    mockState.receiverAccountNumber = null;

    mongooseStartSessionSpy = jest.spyOn(mongoose, 'startSession').mockResolvedValue(createSessionStub());
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    mockState.failReceiverSave = false;
    mockState.receiverAccountNumber = null;
    mockState.users = [];
    mockState.accounts = [];
    mockState.histories = [];
  });

  it('debites sender, credits receiver, and records history on successful transfer', async () => {
    const sender = seedUser({ ZenoPayID: 'ZPSENDER1', Email: 'sender@example.com', FullName: 'Sender One' });
    const receiver = seedUser({ ZenoPayID: 'ZPRECEIVER1', Email: 'receiver@example.com', FullName: 'Receiver One' });

    const senderAccount = seedAccount({
      ZenoPayId: sender.ZenoPayID,
      FullName: sender.FullName,
      Email: sender.Email,
      Mobile: sender.Mobile,
      Balance: 20000,
      AccountNumber: '111111111111',
    });
    const receiverAccount = seedAccount({
      ZenoPayId: receiver.ZenoPayID,
      FullName: receiver.FullName,
      Email: receiver.Email,
      Mobile: receiver.Mobile,
      Balance: 5000,
      AccountNumber: '222222222222',
    });

    const req = buildReq(sender, {
      sourceAccountId: senderAccount._id,
      receiverId: receiver.Email,
      amount: '10000',
      charges: '100',
      total: '10100',
      description: 'Test transfer',
      category: 'shopping',
      note: 'Dinner split',
    });
    const res = createMockRes();

    await TransferController.postTransferMoney(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    expect(mockState.accounts.find((a) => String(a._id) === String(senderAccount._id)).Balance.toString()).toBe('9900');
    expect(mockState.accounts.find((a) => String(a._id) === String(receiverAccount._id)).Balance.toString()).toBe('15000');
    expect(mockState.histories).toHaveLength(1);
    expect(mockState.histories[0]).toMatchObject({
      SenderAccountNumber: '111111111111',
      ReceiverAccountNumber: '222222222222',
      Amount: 10000,
      Category: 'shopping',
    });
    expect(Notification.create).toHaveBeenCalled();
    expect(processCashback).toHaveBeenCalled();
    expect(mongooseStartSessionSpy).toHaveBeenCalled();
  });

  it('returns 400 when transferring to self', async () => {
    const sender = seedUser({ ZenoPayID: 'ZPSENDER2', Email: 'self@example.com', FullName: 'Self Sender' });
    const senderAccount = seedAccount({
      ZenoPayId: sender.ZenoPayID,
      FullName: sender.FullName,
      Email: sender.Email,
      Mobile: sender.Mobile,
      Balance: 20000,
      AccountNumber: '333333333333',
    });

    const req = buildReq(sender, {
      sourceAccountId: senderAccount._id,
      receiverId: sender.Email,
      amount: '1000',
      charges: '10',
      total: '1010',
      description: 'Self transfer',
      category: 'other',
      note: 'self',
    });
    const res = createMockRes();

    await TransferController.postTransferMoney(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    expect(String(mockState.accounts[0].Balance)).toBe('20000');
  });

  it('returns 402 when balance is insufficient', async () => {
    const sender = seedUser({ ZenoPayID: 'ZPSENDER3', Email: 'low@example.com', FullName: 'Low Balance' });
    const receiver = seedUser({ ZenoPayID: 'ZPRECEIVER3', Email: 'receiver3@example.com', FullName: 'Receiver Three' });

    const senderAccount = seedAccount({
      ZenoPayId: sender.ZenoPayID,
      FullName: sender.FullName,
      Email: sender.Email,
      Mobile: sender.Mobile,
      Balance: 500,
      AccountNumber: '444444444444',
    });
    seedAccount({
      ZenoPayId: receiver.ZenoPayID,
      FullName: receiver.FullName,
      Email: receiver.Email,
      Mobile: receiver.Mobile,
      Balance: 1000,
      AccountNumber: '555555555555',
    });

    const req = buildReq(sender, {
      sourceAccountId: senderAccount._id,
      receiverId: receiver.Mobile,
      amount: '2000',
      charges: '20',
      total: '2020',
      description: 'Too much',
      category: 'bills',
      note: 'test',
    });
    const res = createMockRes();

    await TransferController.postTransferMoney(req, res);

    expect(res.status).toHaveBeenCalledWith(402);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  it('returns 404 for an invalid recipient', async () => {
    const sender = seedUser({ ZenoPayID: 'ZPSENDER4', Email: 'sender4@example.com', FullName: 'Sender Four' });
    const senderAccount = seedAccount({
      ZenoPayId: sender.ZenoPayID,
      FullName: sender.FullName,
      Email: sender.Email,
      Mobile: sender.Mobile,
      Balance: 10000,
      AccountNumber: '666666666666',
    });

    const req = buildReq(sender, {
      sourceAccountId: senderAccount._id,
      receiverId: 'not-a-recipient',
      amount: '1000',
      charges: '10',
      total: '1010',
      description: 'Invalid recipient',
      category: 'other',
      note: 'test',
    });
    const res = createMockRes();

    await TransferController.postTransferMoney(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  it('keeps sender balance unchanged if receiver save fails', async () => {
    const sender = seedUser({ ZenoPayID: 'ZPSENDER5', Email: 'sender5@example.com', FullName: 'Sender Five' });
    const receiver = seedUser({ ZenoPayID: 'ZPRECEIVER5', Email: 'receiver5@example.com', FullName: 'Receiver Five' });

    const senderAccount = seedAccount({
      ZenoPayId: sender.ZenoPayID,
      FullName: sender.FullName,
      Email: sender.Email,
      Mobile: sender.Mobile,
      Balance: 20000,
      AccountNumber: '777777777777',
    });
    const receiverAccount = seedAccount({
      ZenoPayId: receiver.ZenoPayID,
      FullName: receiver.FullName,
      Email: receiver.Email,
      Mobile: receiver.Mobile,
      Balance: 5000,
      AccountNumber: '888888888888',
    });
    mockState.failReceiverSave = true;
    mockState.receiverAccountNumber = receiverAccount.AccountNumber;

    const req = buildReq(sender, {
      sourceAccountId: senderAccount._id,
      receiverId: receiver.Email,
      amount: '3000',
      charges: '30',
      total: '3030',
      description: 'Atomic transfer',
      category: 'travel',
      note: 'atomicity',
    });
    const res = createMockRes();

    await TransferController.postTransferMoney(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(mockState.accounts.find((a) => String(a._id) === String(senderAccount._id)).Balance.toString()).toBe('20000');
    expect(mockState.histories).toHaveLength(0);
    expect(Notification.create).not.toHaveBeenCalled();
  });
});
