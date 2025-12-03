const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema({
  aadharNumber: {
    type: String,
    required: true,
    trim: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["Transactional", "Security", "Update", "Offer", "General"],
    default: "General",
    required: true,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  relatedId: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

NotificationSchema.index({ aadharNumber: 1, createdAt: -1 });
NotificationSchema.index({ aadharNumber: 1, isRead: 1 });

module.exports = mongoose.model("Notification", NotificationSchema);
