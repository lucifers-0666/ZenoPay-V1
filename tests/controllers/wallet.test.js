const mongoose = require('mongoose');

const mockState = {
  users: [],
  wallets: [],
  transactions: [],
};

const createMockUserDoc = (overrides = {}) => {
  const now = new Date();
  return {
    _id: new mongoose.Types.ObjectId(),
    ZenoPayID: overrides.ZenoPayID || `ZP${Date.now()}`,
    FullName: overrides.FullName || 'Test User',
    Email: (overrides.Email || `user-${Date.now()}@example.com`).toLowerCase(),
    email: (overrides.Email || `user-${Date.now()}@example.com`).toLowerCase(),
    Mobile: overrides.Mobile || '9000000000',
    Role: 'user',
    isEmailVerified: true,
    EmailVerified: true,
    transactionPin: overrides.transactionPin || null,
    kycTier: overrides.kycTier ?? 0,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
};

const queryWrap = (result) => ({
  select() { return this; },
  lean() { return Promise.resolve(result ? JSON.parse(JSON.stringify(result)) : result); },
  then(resolve, reject) { return this.lean().then(resolve, reject); },
  catch(reject) { return this.lean().catch(reject); },
});

jest.mock('../../Models/ZenoPayUser', () => ({
  create: jest.fn(async (doc) => {
    const stored = { ...doc };
    mockState.users.push(stored);
    return stored;
  }),
  deleteMany: jest.fn(async () => { mockState.users = []; }),
  findById: jest.fn((id) => {
    const found = mockState.users.find((user) => String(user._id) === String(id));
    return queryWrap(found || null);
  }),
  findOne: jest.fn((query = {}) => {
    const or = Array.isArray(query.$or) ? query.$or : [query];
    const found = mockState.users.find((user) => or.some((clause) => Object.entries(clause).every(([key, value]) => String(user[key]) === String(value))));
    return queryWrap(found || null);
  }),
}));

jest.mock('../../Models/Wallet', () => ({
  create: jest.fn(async (doc) => {
    const stored = { ...doc, balance: Number(doc.balance || 0) };
    mockState.wallets.push(stored);
    return stored;
  }),
  deleteMany: jest.fn(async () => { mockState.wallets = []; }),
  findOneAndUpdate: jest.fn(async ({ userId }, update) => {
    let wallet = mockState.wallets.find((row) => String(row.userId) === String(userId));
    if (!wallet) {
      wallet = { userId, balance: 0, currency: 'INR', isActive: true, walletId: `WL-${String(userId)}` };
      mockState.wallets.push(wallet);
    }
    if (update?.$inc?.balance) wallet.balance += Number(update.$inc.balance);
    return { ...wallet };
  }),
  updateOne: jest.fn(async ({ userId }, update) => {
    const wallet = mockState.wallets.find((row) => String(row.userId) === String(userId));
    if (!wallet) return { acknowledged: true, matchedCount: 0, modifiedCount: 0 };
    if (update?.$inc?.balance) wallet.balance += Number(update.$inc.balance);
    return { acknowledged: true, matchedCount: 1, modifiedCount: 1 };
  }),
  findOne: jest.fn(async ({ userId }) => {
    const wallet = mockState.wallets.find((row) => String(row.userId) === String(userId));
    return wallet ? { ...wallet } : null;
  }),
}));

jest.mock('../../Models/Transaction', () => ({
  create: jest.fn(async (docs) => {
    const list = Array.isArray(docs) ? docs : [docs];
    const saved = list.map((doc) => ({ ...doc }));
    mockState.transactions.push(...saved);
    return saved;
  }),
  deleteMany: jest.fn(async () => { mockState.transactions = []; }),
  find: jest.fn((query = {}) => ({
    sort() { return this; },
    skip() { return this; },
    limit() { return this; },
    lean: async () => mockState.transactions.filter((tx) => String(tx.userId) === String(query.userId)),
  })),
  countDocuments: jest.fn(async (query = {}) => mockState.transactions.filter((tx) => String(tx.userId) === String(query.userId)).length),
  aggregate: jest.fn(async () => []),
}));

jest.mock('../../Models/Notification', () => ({
  create: jest.fn(async () => true),
}));

const WalletController = require('../../Controllers/WalletController');
const Wallet = require('../../Models/Wallet');
const Transaction = require('../../Models/Transaction');
const Notification = require('../../Models/Notification');
const ZenoPayUser = require('../../Models/ZenoPayUser');

const createMockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.render = jest.fn().mockReturnValue(res);
  res.redirect = jest.fn().mockReturnValue(res);
  return res;
};

const createUser = async (overrides = {}) => ZenoPayUser.create(createMockUserDoc(overrides));

const buildReq = (user, body = {}, query = {}) => ({
  session: {
    isLoggedIn: true,
    user: {
      _id: user._id,
      ZenoPayID: user.ZenoPayID,
      Email: user.Email,
      email: user.Email,
      isEmailVerified: true,
      EmailVerified: true,
    },
  },
  user: { _id: user._id },
  body,
  query,
  headers: { accept: 'application/json' },
  xhr: true,
  is: () => false,
});

describe('Wallet Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    jest.spyOn(mongoose, 'startSession').mockResolvedValue({
      withTransaction: async (fn) => fn(),
      inTransaction: () => false,
      clientSession: null,
      endSession: jest.fn(),
    });

    Transaction.create = jest.fn(async (docs) => {
      const list = Array.isArray(docs) ? docs : [docs];
      const saved = list.map((doc) => ({ ...doc }));
      mockState.transactions.push(...saved);
      return saved;
    });

    Notification.create = jest.fn(async () => true);
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await Transaction.deleteMany({});
    await Wallet.deleteMany({});
    await ZenoPayUser.deleteMany({});
    mockState.transactions = [];
    mockState.wallets = [];
    mockState.users = [];
  });

  describe('Add Money', () => {
    it('increases wallet balance by the exact amount and creates a transaction record', async () => {
      const user = await createUser({ ZenoPayID: 'ZWALLET01', Email: 'wallet1@example.com' });
      mockState.wallets.push({ userId: user._id, balance: 1000, currency: 'INR', isActive: true });

      const req = buildReq(user, { amount: 50000, method: 'razorpay' });
      const res = createMockRes();

      await WalletController.processTopUp(req, res);

      expect(res.redirect).toHaveBeenCalledWith('/wallet/transactions');
      expect(mockState.wallets.find((w) => String(w.userId) === String(user._id)).balance).toBe(51000);
      expect(mockState.transactions).toHaveLength(1);
      expect(mockState.transactions[0]).toMatchObject({
        type: 'topup',
        amount: 50000,
        status: 'completed',
        description: 'Wallet top-up',
      });
      expect(String(mockState.transactions[0].userId)).toBe(String(user._id));
    });

    it('returns 400 for zero or negative amounts', async () => {
      const user = await createUser({ ZenoPayID: 'ZWALLET02', Email: 'wallet2@example.com' });
      const req = buildReq(user, { amount: 0, method: 'stripe' });
      const res = createMockRes();

      await WalletController.processTopUp(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.render).toHaveBeenCalled();
      const renderArgs = res.render.mock.calls[0][1];
      expect(renderArgs.errors.amount).toBe('Please enter a valid amount.');
    });

    it('returns 400 with Exceeds limit for amounts above ₹1,00,000', async () => {
      const user = await createUser({ ZenoPayID: 'ZWALLET03', Email: 'wallet3@example.com' });
      const req = buildReq(user, { amount: 100001 });
      const res = createMockRes();

      await WalletController.processTopUp(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      const renderArgs = res.render.mock.calls[0][1];
      expect(renderArgs.errors.amount).toBe('Exceeds limit');
    });
  });

  describe('Wallet Balance Fetch', () => {
    it('returns the correct wallet balance for the session user', async () => {
      const user = await createUser({ ZenoPayID: 'WBAL01', Email: 'balance1@example.com' });
      mockState.wallets.push({ userId: user._id, balance: 24680, currency: 'INR', isActive: true });

      const req = buildReq(user);
      const res = createMockRes();

      await WalletController.getBalance(req, res);

      expect(res.render).toHaveBeenCalledWith(
        'wallet/balance',
        expect.objectContaining({
          wallet: expect.objectContaining({ balance: 24680 }),
        })
      );
    });

    it('does not expose another user balance', async () => {
      const userA = await createUser({ ZenoPayID: 'WBAL02A', Email: 'balance2a@example.com' });
      const userB = await createUser({ ZenoPayID: 'WBAL02B', Email: 'balance2b@example.com' });

      mockState.wallets.push({ userId: userA._id, balance: 99999, currency: 'INR', isActive: true });
      mockState.wallets.push({ userId: userB._id, balance: 1234, currency: 'INR', isActive: true });

      const req = buildReq(userB);
      const res = createMockRes();

      await WalletController.getBalance(req, res);

      const renderArgs = res.render.mock.calls[0][1];
      expect(renderArgs.wallet.balance).toBe(1234);
      expect(renderArgs.wallet.balance).not.toBe(99999);
    });
  });
});
