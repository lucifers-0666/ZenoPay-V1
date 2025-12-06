const generateQRWithLogo = require("../Services/generateQR");

const getDashboard = async (req, res) => {
  console.log("Rendering dashboard for user:", req.session.user);
  console.log("Is user logged in?", req.session.isLoggedIn);
  const user = req.session.user || null;

  if (!user) return res.redirect("/login");

  const fixedUrl = `https://zenopay.com/pay/${user.ZenoPayId}`;

  const qrCode = await generateQRWithLogo(fixedUrl);

  res.render("dashboard", {
    pageTitle: "Dashboard",
    currentPage: "dashboard",
    user,
    qrCode,
    isLoggedIn: req.session.isLoggedIn || false,
  });
};

module.exports = { getDashboard };
