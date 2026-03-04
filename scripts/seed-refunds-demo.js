#!/usr/bin/env node

require("dotenv").config();
const mongoose = require("mongoose");
const Refund = require("../Models/Refund");
const ZenoPayUser = require("../Models/ZenoPayUser");
const TransactionHistory = require("../Models/TransactionHistory");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/zenpay";

const statuses = [
  "pending",
  "pending",
  "pending",
  "approved",
  "approved",
  "rejected",
  "processing",
  "pending",
  "approved",
  "rejected",
  "processing",
  "pending",
  "approved",
  "rejected",
  "pending",
  "processing",
];

const reasons = [
  "Duplicate debit detected on transaction",
  "Merchant failed to deliver service",
  "Card charged but wallet not credited",
  "UPI network timeout and amount debited",
  "Incorrect beneficiary account charged",
  "Accidental payment by end user",
  "Transaction marked failed but amount held",
  "Unauthorized access reported by user",
  "Payment reversed by acquiring bank",
  "System reconciliation mismatch",
  "Merchant cancellation request",
  "Chargeback initiated by issuing bank",
  "API retry created duplicate debit",
  "Failed payout but amount blocked",
  "Settlement failure on merchant account",
  "Policy compliant goodwill refund",
];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr, i) {
  if (!arr.length) return null;
  return arr[i % arr.length];
}

async function seedRefunds() {
  const shouldReset = process.argv.includes("--reset");

  await mongoose.connect(MONGO_URI);
  console.log("✓ Connected to MongoDB");

  if (shouldReset) {
    await Refund.deleteMany({});
    console.log("✓ Cleared existing refunds (--reset)");
  }

  const existingCount = await Refund.countDocuments();
  if (existingCount >= 12 && !shouldReset) {
    console.log(`⚠️  Refund demo data already available (${existingCount} records). Use --reset to reseed.`);
    return;
  }

  const users = await ZenoPayUser.find({}).limit(10).lean();
  const txns = await TransactionHistory.find({}).sort({ TransactionTime: -1 }).limit(20).lean();

  const now = new Date();
  const docs = statuses.map((status, i) => {
    const user = pick(users, i);
    const txn = pick(txns, i);

    const amount = randomInt(250, 25000);
    const createdAt = new Date(now);
    createdAt.setDate(now.getDate() - randomInt(0, 14));
    createdAt.setHours(randomInt(8, 20), randomInt(0, 59), randomInt(0, 59), 0);

    const updatedAt = new Date(createdAt);
    updatedAt.setHours(updatedAt.getHours() + randomInt(1, 18));

    const idSuffix = String(Date.now() + i).slice(-8);
    const refundId = `REF-${createdAt.toISOString().slice(0, 10).replace(/-/g, "")}-${idSuffix}`;

    const baseDoc = {
      refundId,
      userId: user ? user._id : null,
      transactionId: txn ? txn._id : null,
      transactionRef: txn ? String(txn.TransactionID) : `TXN-${100000 + i}`,
      amount,
      reason: reasons[i % reasons.length],
      status,
      createdAt,
      updatedAt,
    };

    if (status === "approved") {
      baseDoc.approvedAt = new Date(updatedAt);
      baseDoc.processedAt = new Date(updatedAt);
      baseDoc.adminNote = "Approved after transaction verification.";
    }

    if (status === "rejected") {
      baseDoc.rejectedAt = new Date(updatedAt);
      baseDoc.processedAt = new Date(updatedAt);
      baseDoc.rejectionReason = "Insufficient Evidence";
      baseDoc.adminNote = "Rejected due to insufficient supporting evidence.";
    }

    if (status === "processing") {
      baseDoc.adminNote = "Refund is currently under review by operations.";
    }

    return baseDoc;
  });

  const inserted = await Refund.insertMany(docs);
  console.log(`✓ Seeded ${inserted.length} refund demo records`);
  console.log("✓ You can now test approve/reject/bulk/export/filter actions on /admin/refunds");
}

seedRefunds()
  .catch((err) => {
    console.error("✗ Refund seed failed:", err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
    console.log("✓ MongoDB disconnected");
  });
