const hasAuthenticatedUser = (req) => {
  if (!req.session?.user) {
    return false;
  }

  // Self-heal legacy sessions where user exists but isLoggedIn flag wasn't set.
  if (!req.session.isLoggedIn) {
    req.session.isLoggedIn = true;
  }

  return true;
};

const isAuthenticated = (req, res, next) => {
  if (hasAuthenticatedUser(req)) {
    return next();
  }

  return res.redirect("/login");
};

const isAuthenticatedApi = (req, res, next) => {
  if (hasAuthenticatedUser(req)) {
    return next();
  }

  return res.status(401).json({ success: false, message: "Authentication required" });
};

// Prevent logged-in users from visiting guest-only auth pages
const redirectIfAuthenticated = (req, res, next) => {
  if (hasAuthenticatedUser(req)) {
    return res.redirect("/dashboard");
  }
  return next();
};

module.exports = {
  isAuthenticated,
  isAuthenticatedApi,
  redirectIfAuthenticated,
};
