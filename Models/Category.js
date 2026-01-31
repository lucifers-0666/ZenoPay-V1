const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  description: { type: String, default: '' },
  icon: { type: String, default: 'fas fa-tag' },
  parent_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
  display_order: { type: Number, default: 0 },
  is_active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now }
});

// Indexes
categorySchema.index({ slug: 1 });
categorySchema.index({ parent_id: 1 });
categorySchema.index({ display_order: 1 });

// Virtual for product count
categorySchema.virtual('product_count', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'category_id',
  count: true
});

// Generate slug from name
categorySchema.pre('save', function(next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }
  next();
});

// Static method to get category tree
categorySchema.statics.getCategoryTree = async function() {
  const categories = await this.find({ is_active: true }).sort({ display_order: 1 }).lean();
  
  const categoryMap = {};
  const tree = [];
  
  // Create map
  categories.forEach(cat => {
    categoryMap[cat._id.toString()] = { ...cat, children: [] };
  });
  
  // Build tree
  categories.forEach(cat => {
    if (cat.parent_id) {
      const parent = categoryMap[cat.parent_id.toString()];
      if (parent) {
        parent.children.push(categoryMap[cat._id.toString()]);
      }
    } else {
      tree.push(categoryMap[cat._id.toString()]);
    }
  });
  
  return tree;
};

module.exports = mongoose.model('Category', categorySchema);
