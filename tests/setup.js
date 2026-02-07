/**
 * Test Setup and Configuration
 */

const mongoose = require("mongoose");

// Set test environment
process.env.NODE_ENV = "test";
process.env.MONGO_URI = "mongodb://localhost:27017/zenopay-test";

// Extend Jest timeout for database operations
jest.setTimeout(30000);

// Mock console methods to reduce noise
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
};

// Connect to test database before running tests
beforeAll(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
  } catch (error) {
    console.error("Failed to connect to test database:", error);
    process.exit(1);
  }
});

// Clean up after tests
afterAll(async () => {
  try {
    // Drop test database
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  } catch (error) {
    console.error("Failed to clean up test database:", error);
  }
});
