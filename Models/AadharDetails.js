const mongoose = require("mongoose");

const AadharDetailsSchema = new mongoose.Schema({
  AadharID: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  Password: {
    type: String,
    required: false,
  },
  FullName: {
    type: String,
    required: true,
  },
  AadharNumber: {
    type: String,
    required: true,
    unique: true,
  },
  DOB: {
    type: Date,
    required: true,
  },
  Gender: {
    type: String,
    required: true,
  },
  Mobile: {
    type: String,
    required: true,
  },
  Email: {
    type: String,
    required: true,
  },
  FatherName: {
    type: String,
    required: true,
  },
  MotherName: {
    type: String,
    required: false,
  },
  Address: {
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
  ImagePath: {
    type: String,
    required: false,
  },
  RegistrationDate: {
    type: Date,
    default: Date.now,
  },

  /* -----------------------------------------
      USER / MERCHANT ROLE
  -------------------------------------------*/
  Role: {
    type: String,
    enum: ["citizen", "merchant", "admin"],
    default: "citizen",
    required: true,
  },

  /* -----------------------------------------
      MANUAL MERCHANT KEYS
  -------------------------------------------*/
  BusinessName: {
    type: String,
    required: false,
  },

  api_key: {
    type: String,
    required: false,
    unique: true,
    sparse: true,
  },

  api_secret: {
    type: String,
    required: false,
    unique: true,
    sparse: true,
  }
});

module.exports = mongoose.model("AadharDetails", AadharDetailsSchema);
