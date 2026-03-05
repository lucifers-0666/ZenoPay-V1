const mongoose = require("mongoose");

const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    type: {
      type: String,
      enum: ["info", "success", "warning", "danger", "maintenance", "feature"],
      default: "info",
    },
    targetAudience: {
      type: String,
      enum: ["all", "users", "merchants", "admins", "premium"],
      default: "all",
    },
    priority: { type: Number, min: 1, max: 5, default: 3 },
    status: {
      type: String,
      enum: ["draft", "published", "scheduled", "archived"],
      default: "draft",
    },
    scheduledAt: { type: Date },
    publishedAt: { type: Date },
    updatedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Announcement", announcementSchema);
