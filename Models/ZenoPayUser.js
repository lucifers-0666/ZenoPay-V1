const mongoose = require("mongoose");

const ZenoPayDetailsSchema = new mongoose.Schema({
  ZenoPayID: {
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
    match: [/^[0-9]{10}$/, "Invalid mobile number"],
  },

  Email: {
    type: String,
    unique: true,
    required: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function (email) {
        return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email);
      },
      message: "Invalid email format",
    },
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
    match: [/^[0-9]{6}$/, "Invalid pincode"],
  },

  ImagePath: {
    type: String,
    required: false,
  },

  RegistrationDate: {
    type: Date,
    default: Date.now,
  },

  Role: {
    type: String,
    enum: ["user", "merchant", "admin"],
    default: "user",
    required: true,
  },

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
  },
});

module.exports = mongoose.model("ZenoPayDetails", ZenoPayDetailsSchema);
