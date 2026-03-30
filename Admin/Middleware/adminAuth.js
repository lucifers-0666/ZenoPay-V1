// Admin Authentication Middleware
const ZenoPayUser = require("../../Models/ZenoPayUser");

// Check if user is logged in and is an admin
const isAdmin = async (req, res, next) => {
  try {
    // Check if user is logged in
    if (!req.session.isLoggedIn || !req.session.user) {
      return res.redirect("/admin/login");
    }

    // Check if user has admin role
    if (req.session.user.Role !== "admin") {
      return res.status(403).render("error", {
        message: "Access Denied. Admin privileges required.",
        statusCode: 403,
      });
    }

    // Verify admin still exists in database
    const adminUser = await ZenoPayUser.findOne({
      ZenoPayID: req.session.user.ZenoPayID,
      Role: "admin",
    });

    if (!adminUser) {
      req.session.destroy();
      return res.redirect("/admin/login");
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
  if (req.session.isLoggedIn && req.session.user?.Role === "admin") {
    return res.redirect("/admin/dashboard");
  }
  next();
};

module.exports = { isAdmin, isAdminLoggedIn };
