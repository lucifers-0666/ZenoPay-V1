require("dotenv").config();
const mongoose = require("mongoose");
const BankAccount = require("../Models/BankAccount");
const {
  normalizeCardNumber,
  maskCardNumber,
  createCardFingerprint,
  encryptCardNumber,
  hashPin,
} = require("../utils/cardSecurity");

const MONGO_URI = process.env.MONGO_URI;

async function migrate() {
  if (!MONGO_URI) {
    throw new Error("MONGO_URI is not configured in .env");
  }

  await mongoose.connect(MONGO_URI);

  const accounts = await BankAccount.find({});
  let updated = 0;

  for (const account of accounts) {
    let dirty = false;

    const possibleRawPan = normalizeCardNumber(account.DebitCardNumber || "");
    const hasSecurePan = !!account.CardFingerprint && !!account.CardNumberEncrypted;

    if (!hasSecurePan && possibleRawPan.length >= 12) {
      account.CardLast4 = possibleRawPan.slice(-4);
      account.CardFingerprint = createCardFingerprint(possibleRawPan);
      account.CardNumberEncrypted = encryptCardNumber(possibleRawPan);
      account.DebitCardNumber = maskCardNumber(possibleRawPan);
      dirty = true;
    }

    if (!account.CardPINHash && String(account.CardPIN || "").trim()) {
      account.CardPINHash = await hashPin(String(account.CardPIN).trim());
      account.CardPIN = undefined;
      dirty = true;
    }

    if (account.CardCVV) {
      account.CardCVV = undefined;
      dirty = true;
    }

    if (dirty) {
      await account.save();
      updated += 1;
    }
  }

  console.log(`Migration complete. Updated ${updated} account(s) out of ${accounts.length}.`);
  await mongoose.disconnect();
}

migrate().catch(async (error) => {
  console.error("Card security migration failed:", error.message);
  try {
    await mongoose.disconnect();
  } catch (_) {
    // ignore
  }
  process.exit(1);
});
