const mongoose = require("mongoose");
require("dotenv").config();

const ZenoPayUser = require("../Models/ZenoPayUser");

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const user = await ZenoPayUser.findOne({
      KYCDocuments: { $exists: true },
      KYCStatus: { $in: ["pending", "approved", "verified", "rejected"] },
    })
      .select("ZenoPayID FullName KYCStatus")
      .lean();

    if (!user) {
      console.log("NO_KYC_USER");
      process.exit(0);
    }

    console.log(`KYC_USER=${user.ZenoPayID}`);
    console.log(`KYC_NAME=${user.FullName}`);
    console.log(`KYC_STATUS=${user.KYCStatus}`);
    console.log(`KYC_URL=http://localhost:3000/admin/kyc/${encodeURIComponent(user.ZenoPayID)}`);

    await mongoose.disconnect();
  } catch (error) {
    console.error("ERROR:", error.message);
    process.exit(1);
  }
})();
