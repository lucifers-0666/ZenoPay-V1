const getDashboard = (req, res) => {
  res.render("dashboard", {
    pageTitle: "Dashboard",
  });
};

module.exports = {
  getDashboard,
};
