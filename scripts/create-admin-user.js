// Create Admin User Script
require('dotenv').config();
const mongoose = require('mongoose');
const ZenoPayUser = require('./Models/ZenoPayUser');

const DB_PATH = process.env.DB_PATH || "mongodb://127.0.0.1:27017/ZenoPay";

// Admin credentials
const adminCredentials = {
  ZenoPayID: "ZP-ADMIN001",
  Password: "Admin@123",
  FullName: "System Administrator",
  Email: "admin@zenopay.com",
  Phone: "+1234567890",
  Role: "admin",
  ProfilePicture: "",
  Balance: 0,
  Status: "Active",
  CreatedAt: new Date(),
  UpdatedAt: new Date()
};

console.log("\n========================================");
console.log("   CREATING ADMIN USER");
console.log("========================================\n");

mongoose.connect(DB_PATH)
  .then(async () => {
    console.log("✓ Connected to MongoDB\n");
    
    // Check if admin already exists
    const existingAdmin = await ZenoPayUser.findOne({ 
      ZenoPayID: adminCredentials.ZenoPayID 
    });
    
    if (existingAdmin) {
      console.log("⚠️  Admin user already exists!");
      console.log("\nExisting Admin Details:");
      console.log("   ZenoPayID:", existingAdmin.ZenoPayID);
      console.log("   Email:", existingAdmin.Email);
      console.log("   Name:", existingAdmin.FullName);
      console.log("   Role:", existingAdmin.Role);
      
      // Ask if user wants to update password
      console.log("\n✓ You can login with existing credentials or delete the user first.\n");
    } else {
      // Create new admin user
      const newAdmin = new ZenoPayUser(adminCredentials);
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
    console.log("   ⚠️  Change password after first login");
    console.log("   ⚠️  Password stored in plain text (add bcrypt)");
    console.log("   ⚠️  For development only - NOT production\n");
    
    mongoose.connection.close();
    process.exit(0);
  })
  .catch(err => {
    console.error("❌ MongoDB connection error:", err.message);
    console.log("\n💡 Make sure MongoDB is running:");
    console.log("   - Start MongoDB service");
    console.log("   - Or install MongoDB from: https://www.mongodb.com/download-center/community\n");
    process.exit(1);
  });
