// Middleware/auth.js — User auth guard
const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.user && req.session.isLoggedIn) {
    req.user = req.session.user;
    return next();
  }

  // For AJAX/JSON requests, return 401 JSON
  if (req.xhr || (req.headers.accept && req.headers.accept.includes("application/json"))) {
    return res.status(401).json({
      success: false,
      message: "Not authenticated",
      redirect: "/login",
    });
  }

  return res.redirect("/login");
};

module.exports = { isAuthenticated };