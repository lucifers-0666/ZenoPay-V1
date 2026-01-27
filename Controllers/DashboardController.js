
const getDashboard = async (req, res) => {

  res.render("dashboard", {
    pageTitle: "Dashboard",
    currentPage: "dashboard",
    user: req.session.user || null,
    qrCode: req.session.qrCode || null,
    isLoggedIn: req.session.isLoggedIn || false,
  });
};

module.exports = { getDashboard };
