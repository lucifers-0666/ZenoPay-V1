const mongoose = require("mongoose");

const BlogTagSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Tag name is required"],
      lowercase: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug format"],
    },
    description: {
      type: String,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },

    // Analytics
    post_count: {
      type: Number,
      default: 0,
    },
    view_count: {
      type: Number,
      default: 0,
    },

    color: {
      type: String,
      default: "#6c757d",
      match: [/^#[0-9A-F]{6}$/i, "Invalid hex color"],
    },

    is_featured: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index
// Note: slug index is created by unique: true constraint
BlogTagSchema.index({ name: "text" });
BlogTagSchema.index({ post_count: -1 });

module.exports = mongoose.model("BlogTag", BlogTagSchema);
