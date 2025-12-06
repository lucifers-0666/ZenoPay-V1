const ZenoPayUser = require("../Models/ZenoPayUser");

// Show login page
const getLogin = (req, res) => {
  if (req.session.isLoggedIn) {
    return res.redirect("/dashboard");
  }

  res.render("login", {
    pageTitle: "Login",
  });
};

// Handle login
const postLogin = async (req, res) => {
  const { userId, password } = req.body;

  console.log("Login attempt for userId:", userId);
  console.log("Password received:", password);

  try {
    const cleanUserId = userId.trim();

    // Find by Email OR ZenoPayID
    const user = await ZenoPayUser.findOne({
      $or: [{ ZenoPayID: cleanUserId }, { Email: cleanUserId }],
    });

    if (!user) {
      console.log("User not found!");
      return res.status(401).render("login", {
        pageTitle: "Login",
        error: "User not found. Please try again.",
      });
    }

    // Password check (later replace with bcrypt)
    if (user.Password !== password) {
      console.log("Incorrect password!");
      return res.status(401).render("login", {
        pageTitle: "Login",
        error: "Invalid password.",
      });
    }

    // Store session
    req.session.user = {
      _id: user._id.toString(),
      name: user.FullName,
      ZenoPayId: user.ZenoPayID,
      role: user.Role,
    };

    req.session.isLoggedIn = true;

    console.log("User logged in successfully:", req.session.user);

    // Save session before redirect
    req.session.save((err) => {
      if (err) {
        console.error("Session creation failed:", err);
        return res.render("login", {
          pageTitle: "Login",
          error: "Session error. Please try again.",
        });
      }

      return res.redirect("/dashboard");
    });
  } catch (err) {
    console.error("Login Controller Error:", err);

    return res.status(500).render("login", {
      pageTitle: "Login",
      error: "Internal Server Error. Please try again.",
    });
  }
};

// Logout
const logout = (req, res) => {
  console.log(
    "User logged out:",
    req.session.user ? req.session.user.name : "Unknown User"
  );

  req.session.destroy((err) => {
    if (err) {
      console.log("Logout error:", err);
      return res.status(500).json({
        success: false,
        message: "Logout failed. Please try again.",
      });
    }

    res.clearCookie("connect.sid");
    return res.redirect("/login");
  });
};

module.exports = {
  getLogin,
  postLogin,
  logout,
};
