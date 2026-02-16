const mongoose = require("mongoose");

const BlogPostSchema = new mongoose.Schema(
  {
    // Basic Post Info
    title: {
      type: String,
      required: [true, "Post title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug format"],
    },
    excerpt: {
      type: String,
      required: [true, "Post excerpt is required"],
      maxlength: [300, "Excerpt cannot exceed 300 characters"],
    },
    content: {
      type: String,
      required: [true, "Post content is required"],
    },

    // Media
    featured_image: {
      url: {
        type: String,
        required: true,
      },
      alt_text: {
        type: String,
        required: true,
      },
      width: Number,
      height: Number,
    },

    // Author & Publishing
    author_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ZenoPayDetails",
      required: true,
    },
    author_name: String,

    // Categories & Tags
    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BlogCategory",
      required: true,
    },
    tags: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "BlogTag",
      },
    ],

    // Status & Publishing
    status: {
      type: String,
      enum: ["draft", "scheduled", "published", "archived"],
      default: "draft",
    },
    published_at: Date,
    scheduled_at: Date,

    // SEO
    seo_title: {
      type: String,
      maxlength: [60, "SEO title cannot exceed 60 characters"],
    },
    seo_description: {
      type: String,
      maxlength: [160, "SEO description cannot exceed 160 characters"],
    },
    canonical_url: String,

    // Features
    is_featured: {
      type: Boolean,
      default: false,
    },
    allow_comments: {
      type: Boolean,
      default: true,
    },

    // Analytics
    view_count: {
      type: Number,
      default: 0,
    },
    view_history: [
      {
        ip_address: String,
        user_agent: String,
        viewed_at: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Metadata
    reading_time_minutes: Number,
    word_count: Number,
    comment_count: {
      type: Number,
      default: 0,
    },

    // Revision History
    last_updated_by: mongoose.Schema.Types.ObjectId,
    revision_history: [
      {
        version: Number,
        title: String,
        excerpt: String,
        updated_by: mongoose.Schema.Types.ObjectId,
        updated_at: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index for better query performance
// Note: slug index is created by unique: true constraint
BlogPostSchema.index({ status: 1, published_at: -1 });
BlogPostSchema.index({ category_id: 1 });
BlogPostSchema.index({ author_id: 1 });
BlogPostSchema.index({ tags: 1 });
BlogPostSchema.index({ created_at: -1 });
BlogPostSchema.index({ view_count: -1 });
BlogPostSchema.index({
  title: "text",
  excerpt: "text",
  content: "text",
});

// Virtual for relative publish date
BlogPostSchema.virtual("published_date_relative").get(function () {
  if (!this.published_at) return null;
  const now = new Date();
  const diffMs = now - this.published_at;
  const diffMins = Math.round(diffMs / 60000);
  const diffHours = Math.round(diffMs / 3600000);
  const diffDays = Math.round(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;

  return this.published_at.toLocaleDateString();
});

// Pre-save middleware to auto-generate reading time
BlogPostSchema.pre("save", function (next) {
  if (this.content) {
    const wordCount = this.content
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
    this.word_count = wordCount;
    this.reading_time_minutes = Math.max(1, Math.ceil(wordCount / 225));
  }

  // Auto-populate author_name if needed
  if (this.author_id && !this.author_name) {
    this.populate("author_id", "FullName");
  }

  next();
});

// Pre-findByIdAndUpdate hook for revision history
BlogPostSchema.pre("findByIdAndUpdate", function (next) {
  const update = this.getUpdate();

  if (update.$set) {
    this._updateData = update.$set;
  } else {
    this._updateData = update;
  }

  next();
});

module.exports = mongoose.model("BlogPost", BlogPostSchema);
