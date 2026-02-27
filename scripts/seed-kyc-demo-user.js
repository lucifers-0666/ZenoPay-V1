const mongoose = require("mongoose");
require("dotenv").config();

const ZenoPayUser = require("../Models/ZenoPayUser");

const DEMO_ID = "ZP-KYC2026";

async function seedKycDemoUser() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    let user = await ZenoPayUser.findOne({ ZenoPayID: DEMO_ID });

    if (!user) {
      user = new ZenoPayUser({
        ZenoPayID: DEMO_ID,
        Password: "Demo@123",
        FullName: "KYC Demo User",
        DOB: new Date("1994-08-21"),
        Gender: "Male",
        Mobile: "9123456789",
        Email: "kyc.demo@zenopay.com",
        FatherName: "Demo Father",
        MotherName: "Demo Mother",
        Address: "221B Demo Street",
        City: "Mumbai",
        State: "Maharashtra",
        Pincode: "400001",
        Role: "user",
        AccountStatus: "Active",
      });
    }

    user.KYCStatus = "pending";
    user.KYCSubmittedAt = new Date();
    user.KYCVerifiedAt = null;
    user.KYCRejectedAt = null;
    user.KYCRejectionReason = null;
    user.KYCResubmissionRequested = false;
    user.KYCResubmissionRequestedAt = null;

    user.KYCDocuments = {
      identityType: "Aadhaar",
      identityFront: "https://via.placeholder.com/900x560.png?text=Aadhaar+Front",
      identityBack: "https://via.placeholder.com/900x560.png?text=Aadhaar+Back",
      addressType: "PAN",
      addressDocument: "https://via.placeholder.com/900x560.png?text=PAN+Card",
      selfie: "https://via.placeholder.com/900x560.png?text=Selfie",
    };

    await user.save();

    console.log(`SEEDED_KYC_USER=${user.ZenoPayID}`);
    console.log(`KYC_URL=http://localhost:3000/admin/kyc/${encodeURIComponent(user.ZenoPayID)}`);

    await mongoose.disconnect();
  } catch (error) {
    console.error("ERROR:", error.message);
    process.exit(1);
  }
}

seedKycDemoUser();
