module.exports = (req, res, next) => {
  // Check user session key (NOT admin)
  if (req.session && req.session.user) {
    req.user = req.session.user;
    return next();
  }
  // Not logged in → redirect to login
  return res.redirect('/login');
};