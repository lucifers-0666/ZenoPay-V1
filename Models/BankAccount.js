const mongoose = require("mongoose");

const BankAccountSchema = new mongoose.Schema({
  AccountNumber: {
    type: String,
    required: true,
    unique: true,
  },
  BankName: {
    type: String,
    required: true,
  },
  BranchName: {
    type: String,
    required: true,
  },
  IFSC: {
    type: String,
    required: true,
  },
  BranchCity: {
    type: String,
    required: true,
  },
  BranchState: {
    type: String,
    required: true,
  },
  BranchEmail: {
    type: String,
    required: true,
  },
  AccountType: {
    type: String,
    required: true,
  },
  OpeningBalance: {
    type: mongoose.Types.Decimal128,
    required: true,
  },
  TransactionLimit: {
    type: mongoose.Types.Decimal128,
    required: true,
  },
  AadharNumber: {
    type: String,
    required: true,
  },
  FullName: {
    type: String,
    required: true,
  },
  DOB: {
    type: Date,
    required: true,
  },
  Gender: {
    type: String,
    required: true,
  },
  Profession: {
    type: String,
    required: true,
  },
  AnnualIncome: {
    type: String,
    required: true,
  },
  PanNumber: {
    type: String,
    required: true,
  },
  Email: {
    type: String,
    required: true,
  },
  Mobile: {
    type: String,
    required: true,
  },
  City: {
    type: String,
    required: true,
  },
  State: {
    type: String,
    required: true,
  },
  Pincode: {
    type: String,
    required: true,
  },
  ProfileImagePath: {
    type: String,
  },
  DebitCardNumber: {
    type: String,
    required: true,
  },
  NameOnCard: {
    type: String,
    required: true,
  },
  CardExpiry: {
    type: String,
    required: true,
  },
  CardCVV: {
    type: String,
    required: true,
  },
  CardPIN: {
    type: String,
    required: true,
  },
  DebitCardStatus: {
    type: String,
    default: "Active",
  },
  CardType: {
    type: String,
    required: true,
  },
  CardIssueDate: {
    type: Date,
    default: Date.now,
  },
  AccountStatus: {
    type: String,
    default: "Active",
  },
  OpenedDate: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("BankAccount", BankAccountSchema);
