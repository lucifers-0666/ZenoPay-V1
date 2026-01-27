// Quick script to check if admin user exists
require('dotenv').config();
const mongoose = require('mongoose');
const ZenoPayUser = require('./Models/ZenoPayUser');

const DB_PATH = process.env.DB_PATH || "mongodb://127.0.0.1:27017/ZenoPay";

mongoose.connect(DB_PATH)
  .then(async () => {
    console.log("✓ Connected to MongoDB");
    
    // Check for admin users
    const adminUsers = await ZenoPayUser.find({ Role: "admin" });
    
    if (adminUsers.length === 0) {
      console.log("\n❌ No admin users found in database!");
      console.log("\nCreating default admin user...");
      
      // Create default admin
      const newAdmin = new ZenoPayUser({
        ZenoPayID: "ZP-ADMIN001",
        Password: "Admin@123",
        FullName: "System Administrator",
        Email: "admin@zenopay.com",
        Phone: "+1234567890",
        Role: "admin",
        ProfilePicture: "",
        Balance: 0,
        Status: "Active"
      });
      
      await newAdmin.save();
      console.log("✓ Admin user created successfully!");
      console.log("\nLogin Credentials:");
      console.log("  Email/ID: admin@zenopay.com OR ZP-ADMIN001");
      console.log("  Password: Admin@123");
    } else {
      console.log(`\n✓ Found ${adminUsers.length} admin user(s):\n`);
      adminUsers.forEach((admin, index) => {
        console.log(`${index + 1}. ${admin.FullName}`);
        console.log(`   Email: ${admin.Email}`);
        console.log(`   ZenoPayID: ${admin.ZenoPayID}`);
        console.log(`   Password: ${admin.Password}`);
        console.log(`   Status: ${admin.Status}\n`);
      });
    }
    
    mongoose.connection.close();
  })
  .catch(err => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });
