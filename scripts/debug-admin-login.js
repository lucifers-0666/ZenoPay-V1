require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const mongoose = require("mongoose");
const ZenoPayUser = require("../Models/ZenoPayUser");

async function run() {
  await mongoose.connect(process.env.MONGO_URI);

  const docs = await ZenoPayUser.find({
    $or: [{ Email: "admin@zenopay.com" }, { ZenoPayID: "ZP-ADMIN001" }],
  })
    .select("Email ZenoPayID Role role Password FullName")
    .lean();

  console.log(JSON.stringify(docs, null, 2));
  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error("Debug script failed:", err.message);
  try {
    await mongoose.disconnect();
  } catch (_) {}
  process.exit(1);
});
