const mongoose = require("mongoose");

const BankBranchSchema = new mongoose.Schema({
  BankName: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
 
  BankId: {
    type: String,
    required: true,
    unique: true,
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
  BankPhone: {
    type: String,
    required: true,
  },
  BankEmail: {
    type: String,
    required: true,
  },
  ManagerName: {
    type: String,
    required: true,
  },
  ManagerMobile: {
    type: String,
    required: true,
  },
  RegistrationDate: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("BankBranch", BankBranchSchema);
