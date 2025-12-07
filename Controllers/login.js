const ZenoPayDetails = require("../Models/ZenoPayUser");

// Show login page
const getLogin = (req, res) => {
  if (req.session.isLoggedIn) {
    return res.redirect("/");
  }
  res.render("login", {
    CurrentPage: "Login",
    isLoggedIn: req.session.isLoggedIn || false,
    user: req.session.user || null,
  });
};

const postLogin = async (req, res) => {
  const { userId, password } = req.body;
  try {
    const cleanUserId = userId.trim();
    const user = await ZenoPayDetails.findOne({
      $or: [{ ZenoPayID: cleanUserId }, { Email: cleanUserId }],
    });
    if (!user) {
      console.log("User not found!");
      return res.status(401).json({
        success: false,
        message: "User not found. Please check your credentials.",
      });
    }
    if (user.Password !== password) {
      console.log("Incorrect password!");
      return res.status(401).json({
        success: false,
        message: "Invalid password. Please try again.",
      });
    }

    req.session.regenerate((err) => {
      if (err) {
        console.error("Session regeneration failed:", err);
        return res.status(500).json({
          success: false,
          message: "Session error. Please try again.",
        });
      }

      req.session.user = {
        _id: user._id.toString(),
        name: user.FullName,
        ZenoPayID: user.ZenoPayID,
        email: user.Email,
        role: user.Role,
      };

      req.session.isLoggedIn = true;
      req.session.save((saveErr) => {
        if (saveErr) {
          console.error("Session save failed:", saveErr);
          return res.status(500).json({
            success: false,
            message: "Session save error. Please try again.",
          });
        }

        console.log("Session saved successfully!");
        return res.status(200).json({
          success: true,
          message: "Login successful!",
        });
      });
    });
  } catch (err) {
    console.error("Login Controller Error:", err);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error. Please try again.",
    });
  }
};

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
