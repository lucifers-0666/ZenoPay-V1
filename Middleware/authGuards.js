const isAuthenticated = (req, res, next) => {
  if (req.session?.user && req.session?.isLoggedIn) {
    return next();
  }

  return res.redirect("/login");
};

const isAuthenticatedApi = (req, res, next) => {
  if (req.session?.user && req.session?.isLoggedIn) {
    return next();
  }

  return res.status(401).json({ success: false, message: "Authentication required" });
};

// Prevent logged-in users from visiting guest-only auth pages
const redirectIfAuthenticated = (req, res, next) => {
  if (req.session?.user && req.session?.isLoggedIn) {
    return res.redirect("/dashboard");
  }
  return next();
};

module.exports = {
  isAuthenticated,
  isAuthenticatedApi,
  redirectIfAuthenticated,
};
