const AadharDetails = require("../Models/AadharDetails");

const getLogin = (req, res) => {
  // If user is already logged in, redirect to dashboard (or home)
  if (req.session.isLoggedIn) {
    return res.redirect("/");
  }
  res.render("login", {
    pageTitle: "Login",
  });
};

const postLogin = async (req, res) => {
  const { userId, password } = req.body;

  try {
    // 1. Sanitize Input (Remove spaces from Aadhaar Number if entered)
    const cleanUserId = userId.trim().replace(/\s/g, "");

    // 2. Find User (Check against AadharNumber or AadharID)
    const user = await AadharDetails.findOne({
        $or: [
            { AadharNumber: cleanUserId }, 
            { AadharID: cleanUserId }
        ]
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found. Please check your ID.",
      });
    }
    
    if (user.Password !== password) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials. Please try again.",
      });
    }

    // 4. Initialize Session
    req.session.isLoggedIn = true;
    req.session.user = {
        _id: user._id.toString(), 
        name: user.FullName,
        aadharNumber: user.AadharNumber,
        role: user.Role
    };

    // 5. Save Session and Respond
    req.session.save((err) => {
        if (err) {
            console.error("Session creation failed:", err);
            return res.status(500).json({ 
                success: false, 
                message: "Login failed due to server error." 
            });
        }
        
        return res.status(200).json({
            success: true,
            message: "Login successful!",
        });
    });

  } catch (err) {
    console.error("Login Controller Error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });
  }
};

const logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.log(err);
            return res.status(500).json({
                success: false,
                message: "Logout failed. Please try again."
            });
        }

        res.clearCookie("connect.sid");

        return res.status(200).json({
            success: true,
            message: "Logged out successfully."
        });
    });
};



module.exports = {
  getLogin,
  postLogin,
  logout
};