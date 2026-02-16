const mongoose = require("mongoose");

const BlogCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      unique: true,
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
    parent_category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BlogCategory",
      default: null,
    },
    display_order: {
      type: Number,
      default: 0,
    },
    color: {
      type: String,
      default: "#007bff",
      match: [/^#[0-9A-F]{6}$/i, "Invalid hex color"],
    },
    icon: {
      type: String,
      default: "folder",
    },
    icon_url: String,

    // SEO
    seo_title: {
      type: String,
      maxlength: [60, "SEO title cannot exceed 60 characters"],
    },
    seo_description: {
      type: String,
      maxlength: [160, "SEO description cannot exceed 160 characters"],
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

    is_active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index
// Note: slug index is created by unique: true constraint
BlogCategorySchema.index({ display_order: 1 });
BlogCategorySchema.index({ parent_category_id: 1 });
BlogCategorySchema.index({ is_active: 1 });

// Virtual for subcategories
BlogCategorySchema.virtual("subcategories", {
  ref: "BlogCategory",
  localField: "_id",
  foreignField: "parent_category_id",
});

module.exports = mongoose.model("BlogCategory", BlogCategorySchema);
