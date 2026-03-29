module.exports = (req, res, next) => {
  // Check admin session key (NOT user)
  if (req.session && req.session.admin) {
    req.admin = req.session.admin;
    return next();
  }
  // Not logged in as admin → redirect to admin login
  return res.redirect('/admin/login');
};
