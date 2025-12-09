const mongoose = require("mongoose");

const PanDetailsSchema = new mongoose.Schema({
  PanNumber: {
    type: String,
    required: true,
    unique: true,
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
  },
  RegistrationDate: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("PanDetails", PanDetailsSchema);
