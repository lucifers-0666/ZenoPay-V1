const mongoose = require("mongoose");

const BlogAnalyticsSchema = new mongoose.Schema(
  {
    post_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BlogPost",
      required: true,
    },

    // Daily metrics
    date: {
      type: Date,
      required: true,
      index: true,
    },

    // Traffic
    page_views: {
      type: Number,
      default: 0,
    },
    unique_visitors: {
      type: Number,
      default: 0,
    },
    bounce_rate: Number,

    // Engagement
    avg_time_on_page: Number, // in seconds
    scroll_depth_avg: Number, // percentage

    // Interactions
    social_shares: {
      twitter: { type: Number, default: 0 },
      linkedin: { type: Number, default: 0 },
      facebook: { type: Number, default: 0 },
      whatsapp: { type: Number, default: 0 },
      copy_link: { type: Number, default: 0 },
    },
    comments_added: {
      type: Number,
      default: 0,
    },

    // Device/Source Breakdown
    device_breakdown: {
      mobile: { type: Number, default: 0 },
      tablet: { type: Number, default: 0 },
      desktop: { type: Number, default: 0 },
    },
    traffic_source: {
      organic: { type: Number, default: 0 },
      direct: { type: Number, default: 0 },
      social: { type: Number, default: 0 },
      referral: { type: Number, default: 0 },
      email: { type: Number, default: 0 },
      other: { type: Number, default: 0 },
    },

    // Geographic
    top_countries: [
      {
        country: String,
        visits: Number,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
BlogAnalyticsSchema.index({ post_id: 1, date: -1 });
BlogAnalyticsSchema.index({ date: -1 });

module.exports = mongoose.model("BlogAnalytics", BlogAnalyticsSchema);
