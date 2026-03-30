// Middleware/auth.js — User auth guard
const isAuthenticated = (req, res, next) => {
  console.log("AUTH CHECK - session:", req.session.user, req.session.isLoggedIn);
  
  if (req.session && req.session.user) {
    return next(); // ✅ user exists in session — let them through
  }
  
  return res.redirect('/login'); // ❌ no session — send back to login
};

module.exports = { isAuthenticated };