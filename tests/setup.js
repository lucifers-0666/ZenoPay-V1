/**
 * Jest setup for ZenoPay tests.
 *
 * This file is intentionally dual-purpose:
 * - when loaded by `setupFilesAfterEnv`, it registers hooks/mocks
 * - when referenced by `globalSetup`, it exports a harmless async noop
 */

const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {
  // ignore
}
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
  const collections = Object.values(mongoose.connection.collections || {});
  await Promise.all(collections.map((collection) => collection.deleteMany({})));
};

if (typeof beforeAll === 'function' && typeof afterAll === 'function' && typeof beforeEach === 'function') {
  beforeAll(async () => {
    try {
      mongod = await MongoMemoryServer.create();
      const uri = mongod.getUri();

      await mongoose.connect(uri);

      global.__MONGO_URI__ = uri;
      global.__DB_AVAILABLE__ = true;
    } catch (error) {
      console.error('Failed to initialize in-memory MongoDB for tests:', error);
      throw error;
    }
  });

  beforeEach(async () => {
    if (mongoose.connection.readyState === 1) {
      await clearAllCollections();
    }
  });

  afterAll(async () => {
    try {
      if (mongoose.connection.readyState !== 0) {
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

async function globalSetup() {
  return;
}

module.exports = globalSetup;

Object.defineProperty(module.exports, 'mongod', {
  get: () => mongod,
});
