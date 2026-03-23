const isAuthenticated = (req, res, next) => {
  if (req.session?.isLoggedIn && req.session?.user) {
    return next();
  }

  return res.redirect("/login");
};

const isAuthenticatedApi = (req, res, next) => {
  if (req.session?.isLoggedIn && req.session?.user) {
    return next();
  }

  return res.status(401).json({ success: false, message: "Authentication required" });
};

module.exports = {
  isAuthenticated,
  isAuthenticatedApi,
};
