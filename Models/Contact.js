const mongoose = require("mongoose");

const ContactUsSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    default: null,
    trim: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  userAadharNumber: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ["Pending", "In Progress", "Resolved"],
    default: "Pending"
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

ContactUsSchema.index({ email: 1 });
ContactUsSchema.index({ userAadharNumber: 1 });
ContactUsSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("ContactUs", ContactUsSchema);
