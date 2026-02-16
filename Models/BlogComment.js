const mongoose = require("mongoose");

const BlogCommentSchema = new mongoose.Schema(
  {
    post_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BlogPost",
      required: true,
    },
    parent_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BlogComment",
      default: null,
    },

    // Author Info
    author_name: {
      type: String,
      required: [true, "Author name is required"],
      trim: true,
      maxlength: 100,
    },
    author_email: {
      type: String,
      required: [true, "Author email is required"],
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Invalid email format",
      ],
    },
    author_website: {
      type: String,
      default: null,
    },

    // Comment Content
    comment_text: {
      type: String,
      required: [true, "Comment text is required"],
      maxlength: [1000, "Comment cannot exceed 1000 characters"],
      trim: true,
    },

    // Moderation
    status: {
      type: String,
      enum: ["pending", "approved", "spam", "rejected"],
      default: "pending",
    },
    is_edited: {
      type: Boolean,
      default: false,
    },

    // Security
    ip_address: String,
    user_agent: String,

    // Reply Notification
    notify_on_reply: {
      type: Boolean,
      default: true,
    },

    // Engagement
    helpful_count: {
      type: Number,
      default: 0,
    },

    // For nested replies (max 2 levels)
    reply_count: {
      type: Number,
      default: 0,
    },

    spam_reports: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index
BlogCommentSchema.index({ post_id: 1 });
BlogCommentSchema.index({ status: 1 });
BlogCommentSchema.index({ parent_id: 1 });
BlogCommentSchema.index({ author_email: 1 });
BlogCommentSchema.index({ created_at: -1 });

// Pre-save middleware to sanitize inputs
BlogCommentSchema.pre("save", function (next) {
  // Remove potential HTML/script tags
  this.comment_text = this.comment_text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .trim();

  next();
});

module.exports = mongoose.model("BlogComment", BlogCommentSchema);
