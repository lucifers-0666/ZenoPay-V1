// Admin Authentication Middleware
const ZenoPayUser = require("../../Models/ZenoPayUser");

// Check if user is logged in and is an admin
const isAdmin = async (req, res, next) => {
  try {
    // Check if admin is logged in via dedicated admin session key
    if (!req.session || !req.session.admin) {
      return res.redirect("/admin/login");
    }

    // Check if session role is admin
    if (req.session.admin.Role !== "admin") {
      return res.status(403).render("error", {
        message: "Access Denied. Admin privileges required.",
        statusCode: 403,
      });
    }

    // Verify admin still exists in database
    const adminUser = await ZenoPayUser.findOne({
      ZenoPayID: req.session.admin.ZenoPayID,
      Role: "admin",
    });

    if (!adminUser) {
      delete req.session.admin;
      delete req.session.adminId;
      return res.redirect("/admin/login");
    }

    // Attach admin in both names for compatibility
    req.admin = req.session.admin;
    req.user = req.session.admin;
    if (!req.session.user) {
      req.session.user = req.session.admin;
    }

    // Admin authenticated, proceed
    next();
  } catch (error) {
    console.error("Admin authentication error:", error);
    res.status(500).send("Internal Server Error");
  }
};

// Check if admin is already logged in (for login page)
const isAdminLoggedIn = (req, res, next) => {
  if (req.session && req.session.admin) {
    return res.redirect("/admin/dashboard");
  }
  next();
};

module.exports = { isAdmin, isAdminLoggedIn };
