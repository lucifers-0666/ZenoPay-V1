// Middleware/auth.js — User auth guard
const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.user && req.session.isLoggedIn) {
    req.user = req.session.user;
    return next();
  }
  return res.redirect("/login");
};

module.exports = { isAuthenticated };