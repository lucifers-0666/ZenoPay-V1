const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const BlogController = require("../Controllers/BlogController");
const AdminBlogController = require("../Controllers/AdminBlogController");

// Validation middleware
const validateComment = [
  body("author_name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ max: 100 })
    .withMessage("Name too long"),
  body("author_email")
    .isEmail()
    .withMessage("Valid email required"),
  body("comment_text")
    .trim()
    .notEmpty()
    .withMessage("Comment cannot be empty")
    .isLength({ max: 1000 })
    .withMessage("Comment too long (max 1000 chars)"),
];

const validateNewsletter = [
  body("email")
    .isEmail()
    .withMessage("Valid email required"),
];

const validatePost = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title required")
    .isLength({ max: 100 })
    .withMessage("Title too long"),
  body("excerpt")
    .trim()
    .notEmpty()
    .withMessage("Excerpt required")
    .isLength({ max: 300 })
    .withMessage("Excerpt too long"),
  body("content")
    .trim()
    .notEmpty()
    .withMessage("Content required"),
  body("category_id")
    .notEmpty()
    .withMessage("Category required"),
  body("featured_image_url")
    .trim()
    .notEmpty()
    .withMessage("Featured image required"),
];

// ============ PUBLIC BLOG ROUTES ============

// Blog homepage
router.get("/", BlogController.getBlogHome);
router.get("/page/:page", BlogController.getBlogHome);

// Blog search
router.get("/search", BlogController.searchBlog);

// Individual blog post
router.get("/:slug", BlogController.getBlogPost);

// Category archive
router.get("/category/:slug", BlogController.getBlogCategory);

// Tag archive
router.get("/tag/:slug", BlogController.getBlogTag);

// Author archive
router.get("/author/:slug", BlogController.getBlogAuthor);

// Comment operations (Public)
router.post("/:postId/comments", validateComment, BlogController.submitComment);
router.get("/:postId/comments", BlogController.getComments);

// Newsletter
router.post("/newsletter/subscribe", validateNewsletter, BlogController.subscribeNewsletter);
router.get("/newsletter/confirm/:token", BlogController.confirmNewsletterSubscription);
router.get("/newsletter/unsubscribe/:token", BlogController.unsubscribeNewsletter);

// ============ ADMIN BLOG ROUTES ============
// These require authentication - should be protected by middleware in main routes.js

// Set admin layout for all blog admin routes
router.use("/admin", (req, res, next) => {
  res.locals.layout = "admin/layouts/admin-layout";
  next();
});

router.get("/admin/dashboard", AdminBlogController.getDashboard);

// Posts management
router.get("/admin/posts", AdminBlogController.listPosts);
router.get("/admin/posts/new", AdminBlogController.newPostForm);
router.post("/admin/posts", validatePost, AdminBlogController.createPost);
router.get("/admin/posts/:id/edit", AdminBlogController.editPostForm);
router.put("/admin/posts/:id", validatePost, AdminBlogController.updatePost);
router.delete("/admin/posts/:id", AdminBlogController.deletePost);
router.put("/admin/posts/:id/publish", AdminBlogController.publishPost);

// Categories
router.get("/admin/categories", AdminBlogController.listCategories);
router.post("/admin/categories", AdminBlogController.createCategory);
router.put("/admin/categories/:id", AdminBlogController.updateCategory);
router.delete("/admin/categories/:id", AdminBlogController.deleteCategory);

// Tags
router.get("/admin/tags", AdminBlogController.listTags);
router.post("/admin/tags", AdminBlogController.createTag);
router.put("/admin/tags/:id", AdminBlogController.updateTag);
router.delete("/admin/tags/:id", AdminBlogController.deleteTag);

// Comments moderation
router.get("/admin/comments", AdminBlogController.listComments);
router.put("/admin/comments/:id/approve", AdminBlogController.approveComment);
router.put("/admin/comments/:id/reject", AdminBlogController.rejectComment);

module.exports = router;
