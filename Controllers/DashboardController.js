
const getDashboard = async (req, res) => {
  try {
    const stats = {
      activeUsers: 10000,
      processed: 500,
      uptime: 99.9,
      settlementTime: 2,
    };

    res.render("dashboard", {
      pageTitle: "Dashboard",
      currentPage: "dashboard",
      user: req.session.user || null,
      qrCode: req.session.qrCode || null,
      isLoggedIn: req.session.isLoggedIn || false,
      stats,
    });
  } catch (_err) {
    res.render("dashboard", {
      pageTitle: "Dashboard",
      currentPage: "dashboard",
      user: req.session.user || null,
      qrCode: req.session.qrCode || null,
      isLoggedIn: req.session.isLoggedIn || false,
      stats: {
        activeUsers: 10000,
        processed: 500,
        uptime: 99.9,
        settlementTime: 2,
      },
    });
  }
};

module.exports = { getDashboard };
