
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
      accounts: [],
      transactions: [],
      qrCode: req.session.qrCode || null,
      isLoggedIn: req.session.isLoggedIn || false,
      stats,
    });
  } catch (err) {
    console.error("Error loading dashboard:", err);
    return res.status(500).render("error-500", {
      pageTitle: "Server Error - ZenoPay",
      errorId: `ERR-${Date.now().toString(36).toUpperCase()}`,
    });
  }
};

module.exports = { getDashboard };
