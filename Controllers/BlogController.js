const BlogPost = require("../Models/BlogPost");
const BlogCategory = require("../Models/BlogCategory");
const BlogTag = require("../Models/BlogTag");
const BlogComment = require("../Models/BlogComment");
const NewsletterSubscriber = require("../Models/NewsletterSubscriber");
const BlogAnalytics = require("../Models/BlogAnalytics");
const User = require("../Models/ZenoPayUser");
const { body, validationResult, query } = require("express-validator");

const CATEGORY_IMAGES = {
  "Payment Solutions": [
    "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=450&fit=crop&auto=format&q=80",
    "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&h=450&fit=crop&auto=format&q=80",
    "https://images.unsplash.com/photo-1601597111158-2fceff292cdc?w=800&h=450&fit=crop&auto=format&q=80",
    "https://images.unsplash.com/photo-1580519542036-c47de6196ba5?w=800&h=450&fit=crop&auto=format&q=80",
  ],
  "Security & Compliance": [
    "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=800&h=450&fit=crop&auto=format&q=80",
    "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&h=450&fit=crop&auto=format&q=80",
    "https://images.unsplash.com/photo-1510511459019-5dda7724fd87?w=800&h=450&fit=crop&auto=format&q=80",
  ],
  "Developer Guides": [
    "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&h=450&fit=crop&auto=format&q=80",
    "https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800&h=450&fit=crop&auto=format&q=80",
    "https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=800&h=450&fit=crop&auto=format&q=80",
  ],
  "Industry News": [
    "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&h=450&fit=crop&auto=format&q=80",
    "https://images.unsplash.com/photo-1495020689067-958852a7765e?w=800&h=450&fit=crop&auto=format&q=80",
    "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&h=450&fit=crop&auto=format&q=80",
  ],
  "Product Updates": [
    "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&h=450&fit=crop&auto=format&q=80",
    "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=450&fit=crop&auto=format&q=80",
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=450&fit=crop&auto=format&q=80",
  ],
  "Business Tips": [
    "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=450&fit=crop&auto=format&q=80",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=450&fit=crop&auto=format&q=80",
    "https://images.unsplash.com/photo-1664575602554-2087b04935a5?w=800&h=450&fit=crop&auto=format&q=80",
  ],
  "Case Studies": [
    "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800&h=450&fit=crop&auto=format&q=80",
    "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&h=450&fit=crop&auto=format&q=80",
    "https://images.unsplash.com/photo-1560472355-536de3962603?w=800&h=450&fit=crop&auto=format&q=80",
  ],
};

function getCategoryDefaultImage(post) {
  const cat =
    post?.category_id?.name || post?.category || post?.category_name || "";
  const imgs = CATEGORY_IMAGES[cat] || [
    "https://images.unsplash.com/photo-1556742044-3c52d6e88c62?w=800&h=450&fit=crop&auto=format&q=80",
    "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=450&fit=crop&auto=format&q=80",
  ];

  const seed = post?._id ? parseInt(post._id.toString().slice(-2), 16) : 0;
  return imgs[seed % imgs.length];
}

function withResolvedImage(posts = []) {
  return posts.map((p) => {
    const existing = p?.featured_image?.url || p?.image || "";
    const isHttpImage = typeof existing === "string" && /^https?:\/\//i.test(existing);
    return {
      ...p,
      image: isHttpImage ? existing : getCategoryDefaultImage(p),
    };
  });
}

class BlogController {
  // ============ PUBLIC BLOG PAGES ============

  /**
   * GET /blog
   * Display blog homepage with pagination and filtering
   */
  static async getBlogHome(req, res) {
    try {
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const category = req.query.category || null;
      const sort = req.query.sort || "latest"; // latest, popular, trending
      const viewTemplate = req.query.view || "blog-index";
      const postsPerPage = 12;

      const allowedTemplates = new Set(["blog-index"]);
      const templateToRender = allowedTemplates.has(viewTemplate)
        ? viewTemplate
        : "blog-index";

      // Build query
      let query = { status: "published", published_at: { $lte: new Date() } };

      if (category) {
        const categoryDoc = await BlogCategory.findOne({ slug: category });
        if (categoryDoc) query.category_id = categoryDoc._id;
      }

      // Sorting
      let sortOptions = { published_at: -1 };
      if (sort === "popular") sortOptions = { view_count: -1 };
      if (sort === "trending") {
        // Last 7 days views weighted higher
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        query.published_at = { $lte: new Date() };
        sortOptions = { view_count: -1 };
      }

      // Get featured post (pinned at top)
      const featuredPost = await BlogPost.findOne({
        ...query,
        is_featured: true,
      })
        .populate("author_id", "FullName Email")
        .populate("category_id", "name slug")
        .lean();

      // Get regular posts (excluding featured)
      const totalPosts = await BlogPost.countDocuments(query);
      const posts = await BlogPost.find(query)
        .sort(sortOptions)
        .skip((page - 1) * postsPerPage)
        .limit(postsPerPage)
        .populate("author_id", "FullName Email")
        .populate("category_id", "name slug color")
        .lean();

      // Get categories for sidebar with live post counts
      const categoryCounts = await BlogPost.aggregate([
        {
          $match: {
            status: "published",
            published_at: { $lte: new Date() },
          },
        },
        {
          $group: {
            _id: "$category_id",
            postCount: { $sum: 1 },
          },
        },
      ]);

      const categoryCountMap = new Map(
        categoryCounts.map((item) => [String(item._id), item.postCount])
      );

      const categories = (await BlogCategory.find({ is_active: true })
        .sort({ display_order: 1 })
        .lean()).map((cat) => ({
        ...cat,
        postCount:
          categoryCountMap.get(String(cat._id)) ??
          (typeof cat.post_count === "number" ? cat.post_count : 0),
      }));

      // Get popular tags
      const popularTags = await BlogTag.find()
        .sort({ post_count: -1 })
        .limit(20)
        .lean();

      // Get trending posts (for sidebar)
      const trendingPosts = await BlogPost.find(query)
        .sort({ view_count: -1 })
        .limit(5)
        .select("_id title slug published_at reading_time_minutes")
        .lean();

      const resolvedPosts = withResolvedImage(posts);
      const resolvedTrending = withResolvedImage(trendingPosts);
      const resolvedFeatured = featuredPost
        ? withResolvedImage([featuredPost])[0]
        : null;
      const totalPages = Math.ceil(totalPosts / postsPerPage);

      res.render(`blog/${templateToRender}`, {
        featuredPost: resolvedFeatured,
        posts: resolvedPosts,
        categories,
        popularTags,
        trendingPosts: resolvedTrending,
        currentPage: page,
        totalPages,
        selectedCategory: category || "all",
        sortBy: sort,
        currentNavPage: "blog",
        isLoggedIn: !!req.user,
        user: req.user,
      });
    } catch (error) {
      console.error("Blog home error:", error);
      res.status(500).render("error", { error: "Failed to load blog" });
    }
  }

  /**
   * GET /blog/search
   * Search blog posts
   */
  static async searchBlog(req, res) {
    try {
      const query = req.query.q || "";
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const category = req.query.category || null;
      const sort = req.query.sort || "relevance";
      const postsPerPage = 12;

      if (query.length < 2) {
        return res.render("blog/search", {
          query,
          posts: [],
          results: [],
          totalResults: 0,
          totalPosts: 0,
          currentPage: 1,
          totalPages: 0,
          currentSort: sort,
          currentNavPage: "blog",
          isLoggedIn: !!req.user,
          user: req.user,
        });
      }

      // Build search query
      let searchQuery = {
        $text: { $search: query },
        status: "published",
        published_at: { $lte: new Date() },
      };

      if (category) {
        const categoryDoc = await BlogCategory.findOne({ slug: category });
        if (categoryDoc) searchQuery.category_id = categoryDoc._id;
      }

      // Get total count
      const totalResults = await BlogPost.countDocuments(searchQuery);

      // Get results with score
      const results = await BlogPost.find(
        searchQuery,
        { score: { $meta: "textScore" } }
      )
        .sort(
          sort === "latest"
            ? { published_at: -1 }
            : sort === "popular"
              ? { view_count: -1 }
              : { score: { $meta: "textScore" } }
        )
        .skip((page - 1) * postsPerPage)
        .limit(postsPerPage)
        .populate("author_id", "FullName")
        .populate("category_id", "name slug")
        .lean();

      // Highlight query in results
      results.forEach((result) => {
        const highlightedExcerpt = result.excerpt.replace(
          new RegExp(query, "gi"),
          `<mark>$&</mark>`
        );
        result.excerpt = highlightedExcerpt;
      });

      const categories = await BlogCategory.find({ is_active: true }).lean();
      const resolvedResults = withResolvedImage(results);
      const totalPages = Math.ceil(totalResults / postsPerPage);

      res.render("blog/search", {
        query,
        posts: resolvedResults,
        results: resolvedResults,
        totalResults,
        totalPosts: totalResults,
        categories,
        currentPage: page,
        totalPages,
        currentSort: sort,
        selectedCategory: category || "all",
        currentNavPage: "blog",
        isLoggedIn: !!req.user,
        user: req.user,
      });
    } catch (error) {
      console.error("Search error:", error);
      res.status(500).render("error", { error: "Search failed" });
    }
  }

  /**
   * GET /blog/:slug
   * Display individual blog post
   */
  static async getBlogPost(req, res) {
    try {
      const slug = req.params.slug;

      // Get post
      const post = await BlogPost.findOne({
        slug,
        status: "published",
        published_at: { $lte: new Date() },
      })
        .populate("author_id", "FullName Email")
        .populate("category_id", "name slug")
        .populate("tags", "name slug");

      if (!post) {
        return res.status(404).render("error", { error: "Post not found" });
      }

      // Get approved comments
      const comments = await BlogComment.find({
        post_id: post._id,
        status: "approved",
      })
        .sort({ created_at: -1 })
        .lean();

      // Get related posts (same category or tags)
      const relatedPosts = await BlogPost.find({
        _id: { $ne: post._id },
        status: "published",
        $or: [
          { category_id: post.category_id },
          { tags: { $in: post.tags.map((t) => t._id) } },
        ],
      })
        .limit(3)
        .select("_id title slug featured_image reading_time_minutes published_at")
        .lean();

      // Get previous and next posts in same category
      const previousPost = await BlogPost.findOne({
        category_id: post.category_id,
        published_at: { $lt: post.published_at },
        status: "published",
      })
        .sort({ published_at: -1 })
        .select("_id title slug")
        .lean();

      const nextPost = await BlogPost.findOne({
        category_id: post.category_id,
        published_at: { $gt: post.published_at },
        status: "published",
      })
        .sort({ published_at: 1 })
        .select("_id title slug")
        .lean();

      // Increment view count (unique per IP per 24 hours)
      const clientIP = req.ip;
      const lastViewCheck = post.view_history.find(
        (v) => v.ip_address === clientIP
      );

      if (
        !lastViewCheck ||
        Date.now() - lastViewCheck.viewed_at > 24 * 60 * 60 * 1000
      ) {
        post.view_count++;
        post.view_history.push({
          ip_address: clientIP,
          user_agent: req.get("user-agent"),
          viewed_at: new Date(),
        });
        await post.save();
      }

      // Get post analytics data
      const analytics = await BlogAnalytics.findOne({
        post_id: post._id,
        date: {
          $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      }).lean();

      res.render("blog/show", {
        post,
        comments,
        relatedPosts,
        previousPost,
        nextPost,
        analytics,
        user: req.user,
      });
    } catch (error) {
      console.error("Blog post error:", error);
      res.status(500).render("error", { error: "Failed to load post" });
    }
  }

  /**
   * GET /blog/category/:slug
   * Display posts by category
   */
  static async getBlogCategory(req, res) {
    try {
      const categorySlug = req.params.slug;
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const sort = req.query.sort || "latest";
      const postsPerPage = 12;

      const category = await BlogCategory.findOne({
        slug: categorySlug,
        is_active: true,
      });

      if (!category) {
        return res.status(404).render("error", { error: "Category not found" });
      }

      const totalPosts = await BlogPost.countDocuments({
        category_id: category._id,
        status: "published",
        published_at: { $lte: new Date() },
      });

      const sortOptions =
        sort === "popular"
          ? { view_count: -1 }
          : sort === "oldest"
            ? { published_at: 1 }
            : { published_at: -1 };

      const posts = await BlogPost.find({
        category_id: category._id,
        status: "published",
        published_at: { $lte: new Date() },
      })
        .sort(sortOptions)
        .skip((page - 1) * postsPerPage)
        .limit(postsPerPage)
        .populate("author_id", "FullName Email")
        .populate("category_id", "name slug color")
        .lean();

      const categories = await BlogCategory.find({ is_active: true }).lean();
      const resolvedPosts = withResolvedImage(posts);
      const totalPages = Math.ceil(totalPosts / postsPerPage);

      res.render("blog/category", {
        category,
        slug: categorySlug,
        posts: resolvedPosts,
        totalPosts,
        categories,
        currentPage: page,
        totalPages,
        currentSort: sort,
        currentNavPage: "blog",
        isLoggedIn: !!req.user,
        user: req.user,
      });
    } catch (error) {
      console.error("Category error:", error);
      res.status(500).render("error", { error: "Failed to load category" });
    }
  }

  /**
   * GET /blog/tag/:slug
   * Display posts by tag
   */
  static async getBlogTag(req, res) {
    try {
      const tagSlug = req.params.slug;
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const postsPerPage = 12;

      const tag = await BlogTag.findOne({ slug: tagSlug });

      if (!tag) {
        return res.status(404).render("error", { error: "Tag not found" });
      }

      const totalPosts = await BlogPost.countDocuments({
        tags: tag._id,
        status: "published",
        published_at: { $lte: new Date() },
      });

      const posts = await BlogPost.find({
        tags: tag._id,
        status: "published",
        published_at: { $lte: new Date() },
      })
        .sort({ published_at: -1 })
        .skip((page - 1) * postsPerPage)
        .limit(postsPerPage)
        .populate("author_id", "FullName Email")
        .populate("category_id", "name slug color")
        .lean();

      const relatedTags = await BlogTag.find({ _id: { $ne: tag._id } })
        .sort({ post_count: -1 })
        .limit(8)
        .select("name slug")
        .lean();

      const resolvedPosts = withResolvedImage(posts);
      const totalPages = Math.ceil(totalPosts / postsPerPage);

      res.render("blog/tag", {
        tag,
        posts: resolvedPosts,
        relatedTags,
        currentPage: page,
        totalPages,
        postCount: totalPosts,
        totalPosts,
        currentNavPage: "blog",
        isLoggedIn: !!req.user,
        user: req.user,
      });
    } catch (error) {
      console.error("Tag error:", error);
      res.status(500).render("error", { error: "Failed to load tag" });
    }
  }

  /**
   * GET /blog/author/:slug
   * Display posts by author
   */
  static async getBlogAuthor(req, res) {
    try {
      const authorId = req.params.id || req.params.slug;
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const postsPerPage = 12;

      const author = await User.findById(authorId)
        .select("_id FullName Email")
        .lean();

      if (!author) {
        return res.status(404).render("error", { error: "Author not found" });
      }

      const totalPosts = await BlogPost.countDocuments({
        author_id: author._id,
        status: "published",
        published_at: { $lte: new Date() },
      });

      const posts = await BlogPost.find({
        author_id: author._id,
        status: "published",
        published_at: { $lte: new Date() },
      })
        .sort({ published_at: -1 })
        .skip((page - 1) * postsPerPage)
        .limit(postsPerPage)
        .populate("category_id", "name slug")
        .lean();

      const resolvedPosts = withResolvedImage(posts);
      const totalPages = Math.ceil(totalPosts / postsPerPage);

      res.render("blog/author", {
        author,
        posts: resolvedPosts,
        currentPage: page,
        totalPages,
        postCount: totalPosts,
        totalPosts,
        currentNavPage: "blog",
        isLoggedIn: !!req.user,
        user: req.user,
      });
    } catch (error) {
      console.error("Author error:", error);
      res.status(500).render("error", { error: "Failed to load author posts" });
    }
  }

  // ============ COMMENTS ============

  /**
   * POST /blog/:postId/comments
   * Submit a new comment
   */
  static async submitComment(req, res) {
    try {
      const postId = req.params.postId;
      const { author_name, author_email, comment_text, parent_id } = req.body;

      // Validation
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Verify post exists
      const post = await BlogPost.findById(postId);
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }

      if (!post.allow_comments) {
        return res
          .status(403)
          .json({ error: "Comments are disabled for this post" });
      }

      // Create comment
      const comment = new BlogComment({
        post_id: postId,
        author_name,
        author_email,
        comment_text,
        parent_id: parent_id || null,
        ip_address: req.ip,
        user_agent: req.get("user-agent"),
        status: "pending", // Auto-mod in production
      });

      await comment.save();

      // Update post comment count
      post.comment_count = (post.comment_count || 0) + 1;
      await post.save();

      // TODO: Send admin notification email

      res.json({
        success: true,
        message: "Comment submitted for moderation",
        comment,
      });
    } catch (error) {
      console.error("Comment submission error:", error);
      res.status(500).json({ error: "Failed to submit comment" });
    }
  }

  /**
   * GET /blog/:postId/comments
   * Get comments for a post
   */
  static async getComments(req, res) {
    try {
      const postId = req.params.postId;

      const comments = await BlogComment.find({
        post_id: postId,
        status: "approved",
      })
        .sort({ created_at: -1 })
        .lean();

      res.json({ comments });
    } catch (error) {
      console.error("Get comments error:", error);
      res.status(500).json({ error: "Failed to load comments" });
    }
  }

  // ============ NEWSLETTER ============

  /**
   * POST /blog/newsletter/subscribe
   * Subscribe to newsletter
   */
  static async subscribeNewsletter(req, res) {
    try {
      const { email, source } = req.body;

      // Validation
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: "Invalid email address" });
      }

      // Check if already subscribed
      let subscriber = await NewsletterSubscriber.findOne({ email });

      if (subscriber && subscriber.status === "active") {
        return res
          .status(200)
          .json({
            message: "Already subscribed with this email",
            status: "already_subscribed",
          });
      }

      if (!subscriber) {
        subscriber = new NewsletterSubscriber({
          email,
          source: source || "blog_sidebar",
          status: "pending",
        });
      } else {
        subscriber.status = "pending";
      }

      await subscriber.save();

      // TODO: Send verification email

      res.json({
        success: true,
        message: "Please check your email to confirm subscription",
        status: "pending",
      });
    } catch (error) {
      console.error("Newsletter subscription error:", error);
      res.status(500).json({ error: "Subscription failed" });
    }
  }

  /**
   * GET /blog/newsletter/subscribe
   * Newsletter subscribe landing page
   */
  static async getNewsletterSubscribePage(req, res) {
    return res.render("blog/newsletter-subscribe", {
      success: false,
      currentNavPage: "blog",
      isLoggedIn: !!req.user,
      user: req.user,
    });
  }

  /**
   * GET /blog/newsletter/confirm/:token
   * Verify newsletter subscription
   */
  static async confirmNewsletterSubscription(req, res) {
    try {
      const token = req.params.token;

      const subscriber = await NewsletterSubscriber.findOne({
        verification_token: token,
      });

      if (!subscriber) {
        return res.status(404).render("blog/newsletter-confirm", {
          confirmed: false,
          currentNavPage: "blog",
          isLoggedIn: !!req.user,
          user: req.user,
        });
      }

      subscriber.status = "active";
      subscriber.verified_at = new Date();
      subscriber.verification_token = null;
      await subscriber.save();

      res.render("blog/newsletter-confirm", {
        confirmed: true,
        email: subscriber.email,
        currentNavPage: "blog",
        isLoggedIn: !!req.user,
        user: req.user,
      });
    } catch (error) {
      console.error("Newsletter verification error:", error);
      res.status(500).render("blog/newsletter-confirm", {
        confirmed: false,
        currentNavPage: "blog",
        isLoggedIn: !!req.user,
        user: req.user,
      });
    }
  }

  /**
   * GET /blog/newsletter/unsubscribe/:token
   * Unsubscribe from newsletter
   */
  static async unsubscribeNewsletter(req, res) {
    try {
      const token = req.params.token;

      const subscriber = await NewsletterSubscriber.findOne({
        unsubscribe_token: token,
      });

      if (!subscriber) {
        return res.status(404).render("blog/newsletter-unsubscribe", {
          unsubscribed: false,
          currentNavPage: "blog",
          isLoggedIn: !!req.user,
          user: req.user,
        });
      }

      subscriber.status = "unsubscribed";
      subscriber.unsubscribed_at = new Date();
      await subscriber.save();

      res.render("blog/newsletter-unsubscribe", {
        unsubscribed: true,
        email: subscriber.email,
        currentNavPage: "blog",
        isLoggedIn: !!req.user,
        user: req.user,
      });
    } catch (error) {
      console.error("Unsubscribe error:", error);
      res.status(500).render("blog/newsletter-unsubscribe", {
        unsubscribed: false,
        currentNavPage: "blog",
        isLoggedIn: !!req.user,
        user: req.user,
      });
    }
  }
}

module.exports = BlogController;
