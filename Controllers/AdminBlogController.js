const BlogPost = require("../Models/BlogPost");
const BlogCategory = require("../Models/BlogCategory");
const BlogTag = require("../Models/BlogTag");
const BlogComment = require("../Models/BlogComment");
const BlogAnalytics = require("../Models/BlogAnalytics");
const { validationResult } = require("express-validator");

class AdminBlogController {
  // ============ DASHBOARD ============

  /**
   * GET /admin/blog
   * Admin blog dashboard
   */
  static async getDashboard(req, res) {
    try {
      const userId = req.user._id;

      // Get statistics
      const totalPosts = await BlogPost.countDocuments({ author_id: userId });
      const publishedPosts = await BlogPost.countDocuments({
        author_id: userId,
        status: "published",
      });
      const totalViews = await BlogPost.aggregate([
        { $match: { author_id: userId } },
        { $group: { _id: null, totalViews: { $sum: "$view_count" } } },
      ]);
      const totalComments = await BlogComment.countDocuments({
        post_id: { 
          $in: await BlogPost.find({ author_id: userId }).distinct("_id")
        },
      });

      // Get recent posts
      const recentPosts = await BlogPost.find({ author_id: userId })
        .sort({ created_at: -1 })
        .limit(10)
        .populate("category_id", "name")
        .select(
          "_id title status published_at view_count comment_count created_at"
        )
        .lean();

      // Get recent comments
      const authorPostIds = await BlogPost.find({
        author_id: userId,
      }).distinct("_id");

      const recentComments = await BlogComment.find({
        post_id: { $in: authorPostIds },
      })
        .sort({ created_at: -1 })
        .limit(10)
        .populate("post_id", "title slug")
        .lean();

      // Get top performing posts
      const topPosts = await BlogPost.find({
        author_id: userId,
        status: "published",
      })
        .sort({ view_count: -1 })
        .limit(5)
        .select("_id title view_count comment_count")
        .lean();

      res.render("admin/blog/dashboard", {
        stats: {
          totalPosts,
          publishedPosts,
          draftPosts: totalPosts - publishedPosts,
          totalViews: totalViews[0]?.totalViews || 0,
          totalComments,
        },
        recentPosts,
        recentComments,
        topPosts,
      });
    } catch (error) {
      console.error("Blog dashboard error:", error);
      res
        .status(500)
        .render("error", { error: "Failed to load blog dashboard" });
    }
  }

  // ============ POSTS MANAGEMENT ============

  /**
   * GET /admin/blog/posts
   * List all posts with filters
   */
  static async listPosts(req, res) {
    try {
      const userId = req.user._id;
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const status = req.query.status || "all";
      const postsPerPage = 20;

      let query = { author_id: userId };

      if (status !== "all") {
        query.status = status;
      }

      const totalPosts = await BlogPost.countDocuments(query);

      const posts = await BlogPost.find(query)
        .sort({ created_at: -1 })
        .skip((page - 1) * postsPerPage)
        .limit(postsPerPage)
        .populate("category_id", "name")
        .select(
          "_id title slug status published_at view_count comment_count created_at reading_time_minutes"
        )
        .lean();

      const totalPages = Math.ceil(totalPosts / postsPerPage);

      res.render("admin/blog/posts-list", {
        posts,
        currentPage: page,
        totalPages,
        status,
        totalPosts,
      });
    } catch (error) {
      console.error("List posts error:", error);
      res.status(500).render("error", { error: "Failed to load posts" });
    }
  }

  /**
   * GET /admin/blog/posts/new
   * New post creation form
   */
  static async newPostForm(req, res) {
    try {
      const categories = await BlogCategory.find({ is_active: true })
        .sort({ display_order: 1 })
        .lean();

      const tags = await BlogTag.find()
        .sort({ name: 1 })
        .lean();

      res.render("admin/blog/post-editor", {
        post: null,
        categories,
        tags,
        isNew: true,
      });
    } catch (error) {
      console.error("New post form error:", error);
      res.status(500).render("error", { error: "Failed to load form" });
    }
  }

  /**
   * GET /admin/blog/posts/:id/edit
   * Edit post form
   */
  static async editPostForm(req, res) {
    try {
      const postId = req.params.id;
      const userId = req.user._id;

      const post = await BlogPost.findOne({
        _id: postId,
        author_id: userId,
      })
        .populate("category_id")
        .populate("tags");

      if (!post) {
        return res.status(404).render("error", { error: "Post not found" });
      }

      const categories = await BlogCategory.find({ is_active: true })
        .sort({ display_order: 1 })
        .lean();

      const tags = await BlogTag.find()
        .sort({ name: 1 })
        .lean();

      res.render("admin/blog/post-editor", {
        post: post.toObject(),
        categories,
        tags,
        isNew: false,
      });
    } catch (error) {
      console.error("Edit post form error:", error);
      res.status(500).render("error", { error: "Failed to load post" });
    }
  }

  /**
   * POST /admin/blog/posts
   * Create new post
   */
  static async createPost(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userId = req.user._id;
      const {
        title,
        excerpt,
        content,
        category_id,
        tags,
        seo_title,
        seo_description,
        featured_image_url,
        featured_image_alt,
        is_featured,
        allow_comments,
        status,
        scheduled_at,
      } = req.body;

      // Generate slug
      const slug = this.generateSlug(title);
      const existingPost = await BlogPost.findOne({ slug });
      if (existingPost) {
        return res.status(400).json({ error: "Post slug already exists" });
      }

      const post = new BlogPost({
        title,
        slug,
        excerpt,
        content,
        author_id: userId,
        category_id,
        tags: Array.isArray(tags) ? tags : [tags].filter(Boolean),
        featured_image: {
          url: featured_image_url,
          alt_text: featured_image_alt,
        },
        seo_title: seo_title || title,
        seo_description,
        is_featured: is_featured === "on" || is_featured === true,
        allow_comments: allow_comments !== "off",
        status,
        published_at: status === "published" ? new Date() : null,
        scheduled_at: status === "scheduled" ? new Date(scheduled_at) : null,
      });

      await post.save();

      // Update tag counts
      if (tags && tags.length > 0) {
        await BlogTag.updateMany(
          { _id: { $in: tags } },
          { $inc: { post_count: 1 } }
        );
      }

      // Update category count
      await BlogCategory.findByIdAndUpdate(category_id, {
        $inc: { post_count: 1 },
      });

      res.json({
        success: true,
        message: "Post created successfully",
        postId: post._id,
        redirect: `/admin/blog/posts/${post._id}/edit`,
      });
    } catch (error) {
      console.error("Create post error:", error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * PUT /admin/blog/posts/:id
   * Update existing post
   */
  static async updatePost(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const postId = req.params.id;
      const userId = req.user._id;

      const post = await BlogPost.findOne({ _id: postId, author_id: userId });

      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }

      const {
        title,
        excerpt,
        content,
        category_id,
        tags,
        seo_title,
        seo_description,
        featured_image_url,
        featured_image_alt,
        is_featured,
        allow_comments,
        status,
        scheduled_at,
      } = req.body;

      // Update fields
      post.title = title;
      post.excerpt = excerpt;
      post.content = content;
      post.category_id = category_id;
      post.tags = Array.isArray(tags) ? tags : [tags].filter(Boolean);
      post.featured_image = {
        url: featured_image_url,
        alt_text: featured_image_alt,
      };
      post.seo_title = seo_title || title;
      post.seo_description = seo_description;
      post.is_featured = is_featured === "on" || is_featured === true;
      post.allow_comments = allow_comments !== "off";
      post.status = status;

      if (status === "published" && !post.published_at) {
        post.published_at = new Date();
      }

      if (status === "scheduled") {
        post.scheduled_at = new Date(scheduled_at);
      }

      post.last_updated_by = userId;

      await post.save();

      res.json({
        success: true,
        message: "Post updated successfully",
      });
    } catch (error) {
      console.error("Update post error:", error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * DELETE /admin/blog/posts/:id
   * Delete a post
   */
  static async deletePost(req, res) {
    try {
      const postId = req.params.id;
      const userId = req.user._id;

      const post = await BlogPost.findOne({ _id: postId, author_id: userId });

      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }

      // Update category count
      await BlogCategory.findByIdAndUpdate(post.category_id, {
        $inc: { post_count: -1 },
      });

      // Update tag counts
      if (post.tags && post.tags.length > 0) {
        await BlogTag.updateMany(
          { _id: { $in: post.tags } },
          { $inc: { post_count: -1 } }
        );
      }

      // Delete comments
      await BlogComment.deleteMany({ post_id: postId });

      // Delete analytics
      await BlogAnalytics.deleteMany({ post_id: postId });

      // Delete post
      await BlogPost.findByIdAndDelete(postId);

      res.json({ success: true, message: "Post deleted successfully" });
    } catch (error) {
      console.error("Delete post error:", error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * PUT /admin/blog/posts/:id/publish
   * Publish/unpublish post
   */
  static async publishPost(req, res) {
    try {
      const postId = req.params.id;
      const userId = req.user._id;
      const { publish } = req.body;

      const post = await BlogPost.findOne({ _id: postId, author_id: userId });

      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }

      if (publish) {
        post.status = "published";
        post.published_at = new Date();
      } else {
        post.status = "draft";
        post.published_at = null;
      }

      await post.save();

      res.json({
        success: true,
        message: publish ? "Post published" : "Post unpublished",
      });
    } catch (error) {
      console.error("Publish post error:", error);
      res.status(500).json({ error: error.message });
    }
  }

  // ============ CATEGORIES ============

  /**
   * GET /admin/blog/categories
   * List categories
   */
  static async listCategories(req, res) {
    try {
      const categories = await BlogCategory.find()
        .sort({ display_order: 1 })
        .lean();

      res.render("admin/blog/categories-list", { categories });
    } catch (error) {
      console.error("List categories error:", error);
      res.status(500).render("error", { error: "Failed to load categories" });
    }
  }

  /**
   * POST /admin/blog/categories
   * Create category
   */
  static async createCategory(req, res) {
    try {
      const { name, description, color, display_order, seo_title, seo_description } = req.body;

      const slug = this.generateSlug(name);

      const category = new BlogCategory({
        name,
        slug,
        description,
        color: color || "#007bff",
        display_order: parseInt(display_order) || 0,
        seo_title,
        seo_description,
      });

      await category.save();

      res.json({
        success: true,
        message: "Category created successfully",
        category,
      });
    } catch (error) {
      console.error("Create category error:", error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * PUT /admin/blog/categories/:id
   * Update category
   */
  static async updateCategory(req, res) {
    try {
      const { name, description, color, display_order, seo_title, seo_description } = req.body;

      const category = await BlogCategory.findByIdAndUpdate(req.params.id, {
        name,
        description,
        color,
        display_order: parseInt(display_order),
        seo_title,
        seo_description,
      });

      res.json({
        success: true,
        message: "Category updated successfully",
        category,
      });
    } catch (error) {
      console.error("Update category error:", error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * DELETE /admin/blog/categories/:id
   * Delete category
   */
  static async deleteCategory(req, res) {
    try {
      const categoryId = req.params.id;

      const postsCount = await BlogPost.countDocuments({
        category_id: categoryId,
      });

      if (postsCount > 0) {
        return res.status(400).json({
          error: `Cannot delete category with ${postsCount} posts. Remove posts first.`,
        });
      }

      await BlogCategory.findByIdAndDelete(categoryId);

      res.json({ success: true, message: "Category deleted successfully" });
    } catch (error) {
      console.error("Delete category error:", error);
      res.status(500).json({ error: error.message });
    }
  }

  // ============ TAGS ============

  /**
   * GET /admin/blog/tags
   * List tags
   */
  static async listTags(req, res) {
    try {
      const tags = await BlogTag.find().sort({ post_count: -1 }).lean();

      res.render("admin/blog/tags-list", { tags });
    } catch (error) {
      console.error("List tags error:", error);
      res.status(500).render("error", { error: "Failed to load tags" });
    }
  }

  /**
   * POST /admin/blog/tags
   * Create or get tag
   */
  static async createTag(req, res) {
    try {
      const { name, description } = req.body;
      const slug = this.generateSlug(name);

      let tag = await BlogTag.findOne({ slug });

      if (tag) {
        return res.json({
          success: true,
          message: "Tag already exists",
          tag,
        });
      }

      tag = new BlogTag({
        name,
        slug,
        description,
      });

      await tag.save();

      res.json({
        success: true,
        message: "Tag created successfully",
        tag,
      });
    } catch (error) {
      console.error("Create tag error:", error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * PUT /admin/blog/tags/:id
   * Update tag
   */
  static async updateTag(req, res) {
    try {
      const { name, description, is_featured } = req.body;

      const tag = await BlogTag.findByIdAndUpdate(req.params.id, {
        name,
        description,
        is_featured: is_featured === "on" || is_featured === true,
      });

      res.json({
        success: true,
        message: "Tag updated successfully",
        tag,
      });
    } catch (error) {
      console.error("Update tag error:", error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * DELETE /admin/blog/tags/:id
   * Delete tag
   */
  static async deleteTag(req, res) {
    try {
      const tagId = req.params.id;

      await BlogPost.updateMany(
        { tags: tagId },
        { $pull: { tags: tagId } }
      );

      await BlogTag.findByIdAndDelete(tagId);

      res.json({ success: true, message: "Tag deleted successfully" });
    } catch (error) {
      console.error("Delete tag error:", error);
      res.status(500).json({ error: error.message });
    }
  }

  // ============ COMMENTS MANAGEMENT ============

  /**
   * GET /admin/blog/comments
   * List comments for moderation
   */
  static async listComments(req, res) {
    try {
      const status = req.query.status || "pending";
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const perPage = 20;

      let query = {};
      if (status !== "all") query.status = status;

      // Get author's posts
      const authorPostIds = await BlogPost.find({ author_id: req.user._id }).distinct("_id");

      const totalComments = await BlogComment.countDocuments({
        ...query,
        post_id: { $in: authorPostIds },
      });

      const comments = await BlogComment.find({
        ...query,
        post_id: { $in: authorPostIds },
      })
        .sort({ created_at: -1 })
        .skip((page - 1) * perPage)
        .limit(perPage)
        .populate("post_id", "title slug")
        .lean();

      const totalPages = Math.ceil(totalComments / perPage);

      res.render("admin/blog/comments-list", {
        comments,
        status,
        currentPage: page,
        totalPages,
        totalComments,
      });
    } catch (error) {
      console.error("List comments error:", error);
      res.status(500).render("error", { error: "Failed to load comments" });
    }
  }

  /**
   * PUT /admin/blog/comments/:id/approve
   * Approve comment
   */
  static async approveComment(req, res) {
    try {
      const commentId = req.params.id;

      const comment = await BlogComment.findByIdAndUpdate(commentId, {
        status: "approved",
      });

      if (comment) {
        const post = await BlogPost.findById(comment.post_id);
        if (post) post.comment_count++;
        await post.save();
      }

      res.json({ success: true, message: "Comment approved" });
    } catch (error) {
      console.error("Approve comment error:", error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * PUT /admin/blog/comments/:id/reject
   * Reject/delete comment
   */
  static async rejectComment(req, res) {
    try {
      const commentId = req.params.id;

      await BlogComment.findByIdAndDelete(commentId);

      res.json({ success: true, message: "Comment rejected" });
    } catch (error) {
      console.error("Reject comment error:", error);
      res.status(500).json({ error: error.message });
    }
  }

  // ============ UTILITY METHODS ============

  static generateSlug(text) {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }
}

module.exports = AdminBlogController;
