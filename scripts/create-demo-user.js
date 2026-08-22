const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {}
const mongoose = require("mongoose");
require("dotenv").config();

const ZenoPayUser = require("../Models/ZenoPayUser");

const DB_PATH = process.env.MONGO_URI;

// Demo user credentials
const demoUser = {
  ZenoPayID: "ZP-DEMO2024",
  Password: "Demo@123",
  FullName: "Demo User",
  DOB: new Date("1995-06-15"),
  Gender: "Male",
  Mobile: "9876543210",
  Email: "demo@zenopay.com",
  FatherName: "Demo Father",
  MotherName: "Demo Mother",
  Address: "123 Demo Street, Demo Area",
  City: "Mumbai",
  State: "Maharashtra",
  Pincode: "400001",
  ImagePath: "",
  Role: "user",
  AccountStatus: "Active",
  KYCStatus: "approved",
  KYCVerifiedAt: new Date(),
};

async function createDemoUser() {
  try {
    await mongoose.connect(DB_PATH);
    console.log("✅ MongoDB Connected");

    // Check if demo user already exists
    const existingUser = await ZenoPayUser.findOne({ 
      $or: [
        { ZenoPayID: demoUser.ZenoPayID },
        { Email: demoUser.Email },
        { Mobile: demoUser.Mobile }
      ]
    });

    if (existingUser) {
      console.log("⚠️  Demo user already exists!");
      console.log("\n🎯 USE THESE CREDENTIALS TO LOGIN:");
      console.log("================================");
      console.log("Email/Phone: demo@zenopay.com or 9876543210");
      console.log("Password: Demo@123");
      console.log("ZenoPay ID: ZP-DEMO2024");
      console.log("================================\n");
      process.exit(0);
    }

    // Create demo user
    const newUser = new ZenoPayUser(demoUser);
    await newUser.save();

    console.log("✅ Demo user created successfully!");
    console.log("\n🎯 USE THESE CREDENTIALS TO LOGIN:");
    console.log("================================");
    console.log("Email: demo@zenopay.com");
    console.log("Phone: 9876543210");
    console.log("Password: Demo@123");
    console.log("ZenoPay ID: ZP-DEMO2024");
    console.log("================================");
    console.log("\n📱 Login at: http://localhost:3000/login\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating demo user:", error);
    process.exit(1);
  }
}

createDemoUser();
