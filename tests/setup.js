/**
 * Jest setup for ZenoPay tests.
 *
 * This file is intentionally dual-purpose:
 * - when loaded by `setupFilesAfterEnv`, it registers hooks/mocks
 * - when referenced by `globalSetup`, it exports a harmless async noop
 */

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET = 'test-secret-key';
process.env.JWT_SECRET = 'test-jwt-secret';

let mongod;

global.__DB_AVAILABLE__ = false;

if (typeof jest !== 'undefined' && typeof jest.mock === 'function') {
  jest.mock('../Services/EmailService', () => ({
    sendEmail: jest.fn().mockResolvedValue(true),
  }));

  jest.mock('../Services/smsService', () => ({
    twilioAccountSid: 'test-sid',
    sendSMS: jest.fn().mockResolvedValue(true),
    sendOTP: jest.fn().mockResolvedValue({ success: true, service: 'twilio' }),
    sendTransactionNotification: jest.fn().mockResolvedValue({ success: true, service: 'twilio' }),
    sendSecurityAlert: jest.fn().mockResolvedValue({ success: true, service: 'twilio' }),
    testConnection(service = 'twilio') {
      if (service === 'twilio' && !this.twilioAccountSid) {
        return Promise.resolve({ success: false, error: 'Twilio credentials not configured' });
      }

      return Promise.resolve({ success: true, gateway: service });
    },
  }));
}

const clearAllCollections = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    // eslint-disable-next-line no-await-in-loop
    await collections[key].deleteMany({});
  }
};

if (typeof beforeAll === 'function' && typeof afterAll === 'function' && typeof afterEach === 'function') {
  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();

    await mongoose.connect(uri);

    global.__MONGO_URI__ = uri;
    global.__DB_AVAILABLE__ = true;

    await clearAllCollections();
  });

  afterEach(async () => {
    if (mongoose.connection.readyState === 1) {
      await clearAllCollections();
    }
  });

  afterAll(async () => {
    try {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.dropDatabase();
        await mongoose.disconnect();
      }
    } finally {
      if (mongod) {
        await mongod.stop();
        mongod = undefined;
      }
    }
  });
}

module.exports = async () => {};
