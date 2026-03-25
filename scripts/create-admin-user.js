// Create (or update) Admin User Script
require("dotenv").config();
const crypto = require("crypto");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const ZenoPayUser = require("../Models/ZenoPayUser");

const DB_PATH = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ZenoPay";

const generatedPassword = `Zeno@${crypto.randomBytes(4).toString("hex")}`;

const adminCredentials = {
  ZenoPayID: process.env.ADMIN_ZENOPAY_ID || "ZP-ADMIN001",
  Password: process.env.ADMIN_PASSWORD || generatedPassword,
  FullName: process.env.ADMIN_FULL_NAME || "System Administrator",
  Email: process.env.ADMIN_EMAIL || "admin@zenopay.com",
  role: "Admin",
  Role: "admin",
  DOB: new Date("1990-01-01"),
  Gender: "Male",
  Mobile: "9999999999",
  FatherName: "System",
  Address: "Head Office",
  City: "Mumbai",
  State: "Maharashtra",
  Pincode: "400001",
  AccountStatus: "Active",
};

const shouldResetPassword = process.argv.includes("--reset-password");

async function run() {
  console.log("\n========================================");
  console.log("   CREATING ADMIN USER");
  console.log("========================================\n");

  try {
    await mongoose.connect(DB_PATH);
    console.log("✓ Connected to MongoDB\n");

    const existingAdmin = await ZenoPayUser.findOne({
      $or: [{ ZenoPayID: adminCredentials.ZenoPayID }, { Email: adminCredentials.Email }],
    });

    if (existingAdmin && !shouldResetPassword) {
      console.log("⚠️  User already exists with this Admin ID or Email!");
      console.log("\nExisting Admin Details:");
      console.log("   ZenoPayID:", existingAdmin.ZenoPayID);
      console.log("   Email:", existingAdmin.Email);
      console.log("   Name:", existingAdmin.FullName);
      console.log("   Role:", existingAdmin.Role, "(ui role:", existingAdmin.role + ")");
      console.log("\n💡 Run with --reset-password to promote this user to admin and set a new password.\n");
      await mongoose.disconnect();
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(adminCredentials.Password, 10);

    if (existingAdmin && shouldResetPassword) {
      existingAdmin.Password = hashedPassword;
      existingAdmin.FullName = adminCredentials.FullName;
      existingAdmin.Email = adminCredentials.Email;
      existingAdmin.role = "Admin";
      existingAdmin.AccountStatus = "Active";
      existingAdmin.Role = "admin";
      await existingAdmin.save();
      console.log("✓ Existing admin password reset successfully!\n");
    } else {
      const newAdmin = new ZenoPayUser({
        ...adminCredentials,
        Password: hashedPassword,
      });
      await newAdmin.save();
      console.log("✓ Admin user created successfully!\n");
    }

    console.log("========================================");
    console.log("   ADMIN LOGIN CREDENTIALS");
    console.log("========================================\n");
    console.log("   URL:      http://localhost:3000/admin/login");
    console.log("   Email:    " + adminCredentials.Email);
    console.log("   OR");
    console.log("   ID:       " + adminCredentials.ZenoPayID);
    console.log("   Password: " + adminCredentials.Password);
    console.log("\n========================================");
    console.log("   SECURITY NOTES");
    console.log("========================================\n");
    console.log("   ✓ Password is stored hashed with bcrypt");
    console.log("   ⚠️  Change password after first login\n");

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("❌ MongoDB/admin creation error:", err.message);
    process.exit(1);
  }
}

run();
