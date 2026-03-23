const mongoose = require("mongoose");

const BankAccountSchema = new mongoose.Schema({
  AccountNumber: {
    type: String,
    required: true,
    unique: true,
  },

  BankName: { type: String, required: true },
  BankId: { type: String, required: true },
  BankCity: { type: String, required: true },
  BankState: { type: String, required: true },
  BankEmail: { type: String, required: true },

  AccountType: { type: String, required: true },

  OpeningBalance: {
    type: mongoose.Types.Decimal128,
    required: true,
    default: 0,
  },

  Balance: {
    type: mongoose.Types.Decimal128,
    required: false,
    default: function() {
      return this.OpeningBalance;
    }
  },

  TransactionLimit: {
    type: mongoose.Types.Decimal128,
    required: true,
    default: 0,
  },

  ZenoPayId: {
     type: String,
      required: true,
      ref: "ZenoPayUser"},

  FullName: { type: String, required: true },
  DOB: { type: Date, required: true },
  Gender: { type: String, required: true },
  Profession: { type: String, required: true },
  AnnualIncome: { type: String, required: true },

  Email: { type: String, required: true },
  Mobile: { type: String, required: true },
  City: { type: String, required: true },
  State: { type: String, required: true },
  Pincode: { type: String, required: true },

  // ⚠ NEVER store real card info in plain text.
  DebitCardNumber: {
    type: String,
    required: true,
  },
  CardLast4: {
    type: String,
    required: false,
  },
  CardFingerprint: {
    type: String,
    required: false,
    unique: true,
    sparse: true,
  },
  CardNumberEncrypted: {
    type: String,
    required: false,
  },

  NameOnCard: { type: String, required: true },
  CardExpiry: { type: String, required: true },

  CardCVV: {
    type: String,
    required: false,
  },

  CardPIN: {
    type: String,
    required: false,
  },
  CardPINHash: {
    type: String,
    required: false,
  },

  DebitCardStatus: { type: String, default: "Active" },
  CardType: { type: String, required: true },
  CardIssueDate: { type: Date, default: Date.now },

  AccountStatus: { type: String, default: "Active" },
  OpenedDate: { type: Date, default: Date.now },
});

BankAccountSchema.index({ ZenoPayId: 1 });

// Export model
module.exports = mongoose.model("BankAccount", BankAccountSchema);
