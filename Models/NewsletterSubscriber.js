const mongoose = require("mongoose");

const NewsletterSubscriberSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Invalid email format",
      ],
    },

    status: {
      type: String,
      enum: ["pending", "active", "unsubscribed"],
      default: "pending",
    },

    // Newsletter Preferences
    receive_weekly: {
      type: Boolean,
      default: true,
    },
    receive_product_updates: {
      type: Boolean,
      default: true,
    },
    receive_promotional: {
      type: Boolean,
      default: true,
    },

    // Verification
    verification_token: String,
    verified_at: Date,

    // Tracking
    subscribed_at: {
      type: Date,
      default: Date.now,
    },
    confirmed_at: Date,
    unsubscribed_at: Date,
    unsubscribe_token: String,

    // Security & Source
    ip_address: String,
    source: {
      type: String,
      enum: ["blog_sidebar", "blog_footer", "homepage", "modal", "footer_page"],
      default: "blog_sidebar",
    },

    // Engagement Metrics
    email_opened_count: {
      type: Number,
      default: 0,
    },
    email_clicked_count: {
      type: Number,
      default: 0,
    },
    last_email_opened: Date,
    last_email_clicked: Date,

    // User Info (optional)
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ZenoPayDetails",
      default: null,
    },
    first_name: String,
    last_name: String,

    // Bounce Info
    bounce_status: {
      type: String,
      enum: ["active", "soft_bounce", "hard_bounce"],
      default: "active",
    },
    bounce_count: {
      type: Number,
      default: 0,
    },
    last_bounce_date: Date,
  },
  {
    timestamps: true,
  }
);

// Index
// Note: email index is created by unique: true constraint
NewsletterSubscriberSchema.index({ status: 1 });
NewsletterSubscriberSchema.index({ subscribed_at: -1 });
NewsletterSubscriberSchema.index({ user_id: 1 });

module.exports = mongoose.model("NewsletterSubscriber", NewsletterSubscriberSchema);
