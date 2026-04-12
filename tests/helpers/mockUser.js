const mongoose = require("mongoose");

const createMockUser = (overrides = {}) => {
  const now = new Date();

  return {
    _id: new mongoose.Types.ObjectId(),
    name: "Test User",
    email: "test.user@example.com",
    phone: "9876543210",
    userId: `ZP${Date.now()}`,
    role: "User",
    status: "Active",
    balance: 1000,
    ZenoPayID: `ZP${Date.now()}`,
    FullName: "Test User",
    DOB: new Date("2000-01-01"),
    Gender: "Male",
    Mobile: "9876543210",
    Email: "test.user@example.com",
    FatherName: "Test Father",
    Address: "123 Test Street",
    City: "Mumbai",
    State: "Maharashtra",
    Pincode: "400001",
    Role: "user",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
};

const createMockTransaction = (overrides = {}) => {
  const now = new Date();

  return {
    _id: new mongoose.Types.ObjectId(),
    userId: overrides.userId || new mongoose.Types.ObjectId(),
    merchant: null,
    type: "send",
    amount: 500,
    status: "completed",
    reference: `TXN-${Date.now()}`,
    description: "Mock test transaction",
    category: "other",
    note: "",
    metadata: null,
    createdAt: now,
    ...overrides,
  };
};

module.exports = {
  createMockUser,
  createMockTransaction,
};
