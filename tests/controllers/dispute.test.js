const mongoose = require('mongoose');

const DisputeController = require('../../Controllers/DisputeController');
const Dispute = require('../../Models/Dispute');
const ZenoPayUser = require('../../Models/ZenoPayUser');

const createMockRes = () => {
  const res = {};
  res.statusCode = 200;
  res.status = jest.fn().mockImplementation((code) => {
    res.statusCode = code;
    return res;
  });
  res.json = jest.fn().mockReturnValue(res);
  res.render = jest.fn().mockReturnValue(res);
  return res;
};

const createUser = async (overrides = {}) => {
  return ZenoPayUser.create({
    _id: new mongoose.Types.ObjectId(),
    ZenoPayID: overrides.ZenoPayID || `ZP${Date.now()}`,
    FullName: overrides.FullName || 'Dispute User',
    Email: overrides.Email || `dispute-${Date.now()}@example.com`,
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

describe('Dispute Controller', () => {
  let user;

  beforeEach(async () => {
    user = await createUser();
  });

  afterEach(async () => {
    await Dispute.deleteMany({});
    await ZenoPayUser.deleteMany({});
  });

  it('getDisputes returns empty array for new user and returns disputes after create', async () => {
    const reqEmpty = {
      session: { user: { _id: user._id } },
    };
    const resEmpty = createMockRes();

    await DisputeController.getDisputes(reqEmpty, resEmpty);

    expect(resEmpty.json).toHaveBeenCalledWith({ success: true, disputes: [] });

    await Dispute.create({
      userId: user._id,
      subject: 'Card charged twice',
      description: 'I was debited twice for one transaction.',
      priority: 'high',
      timeline: [{ action: 'opened', by: 'user', at: new Date() }],
    });

    const reqWithData = {
      session: { user: { _id: user._id } },
    };
    const resWithData = createMockRes();

    await DisputeController.getDisputes(reqWithData, resWithData);

    expect(resWithData.json).toHaveBeenCalled();
    const payload = resWithData.json.mock.calls[0][0];
    expect(payload.success).toBe(true);
    expect(Array.isArray(payload.disputes)).toBe(true);
    expect(payload.disputes.length).toBe(1);
    expect(payload.disputes[0].status).toBe('open');
  });

  it('submitDispute creates dispute with open status and adds timeline entry', async () => {
    const req = {
      session: { user: { _id: user._id } },
      body: {
        subject: 'UPI payment failed',
        description: 'Amount got debited but merchant did not receive funds.',
        priority: 'high',
      },
    };
    const res = createMockRes();

    await DisputeController.submitDispute(req, res);

    expect(res.json).toHaveBeenCalled();
    const payload = res.json.mock.calls[0][0];
    expect(payload.success).toBe(true);

    const saved = await Dispute.findOne({ userId: user._id }).lean();
    expect(saved).toBeTruthy();
    expect(saved.status).toBe('open');
    expect(Array.isArray(saved.timeline)).toBe(true);
    expect(saved.timeline[0].action).toBe('opened');
  });

  it('addInfo updates additionalInfo and appends timeline entry', async () => {
    const dispute = await Dispute.create({
      userId: user._id,
      subject: 'Wrong amount settled',
      description: 'Settlement amount was incorrect.',
      priority: 'medium',
      timeline: [{ action: 'opened', by: 'user', at: new Date() }],
    });

    const req = {
      session: { user: { _id: user._id } },
      body: {
        disputeId: String(dispute._id),
        info: 'Sharing statement screenshot for review.',
      },
      params: {},
    };
    const res = createMockRes();

    await DisputeController.addDisputeInformation(req, res);

    expect(res.json).toHaveBeenCalled();
    const payload = res.json.mock.calls[0][0];
    expect(payload.success).toBe(true);

    const updated = await Dispute.findById(dispute._id).lean();
    expect(updated.additionalInfo).toBe('Sharing statement screenshot for review.');
    expect(updated.timeline.some((entry) => entry.action === 'info_added')).toBe(true);
  });

  it('withdrawDispute sets status rejected and rejects if already closed', async () => {
    const openDispute = await Dispute.create({
      userId: user._id,
      subject: 'Unauthorized transfer',
      description: 'Transfer was not initiated by me.',
      priority: 'high',
      timeline: [{ action: 'opened', by: 'user', at: new Date() }],
    });

    const reqWithdraw = {
      session: { user: { _id: user._id } },
      body: { disputeId: String(openDispute._id) },
      params: {},
    };
    const resWithdraw = createMockRes();

    await DisputeController.withdrawDispute(reqWithdraw, resWithdraw);

    expect(resWithdraw.json).toHaveBeenCalled();
    const payload = resWithdraw.json.mock.calls[0][0];
    expect(payload.success).toBe(true);

    const withdrawn = await Dispute.findById(openDispute._id).lean();
    expect(withdrawn.status).toBe('rejected');

    const reqSecondAttempt = {
      session: { user: { _id: user._id } },
      body: { disputeId: String(openDispute._id) },
      params: {},
    };
    const resSecondAttempt = createMockRes();

    await DisputeController.withdrawDispute(reqSecondAttempt, resSecondAttempt);

    expect(resSecondAttempt.status).toHaveBeenCalledWith(404);
    expect(resSecondAttempt.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false })
    );
  });
});
