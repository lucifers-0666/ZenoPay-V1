const ZenoPayDetails = require("../Models/ZenoPayUser");

// Show registration page
const getRegister = (req, res) => {
  if (req.session.isLoggedIn) {
    return res.redirect("/");
  }
  res.render("signup", {
    pageTitle: "Sign Up - ZenoPay",
    isLoggedIn: false,
    user: null,
  });
};

// Handle user registration
const postRegister = async (req, res) => {
  const { fullName, email, phoneNumber, password, confirmPassword, agreeToTerms } = req.body;

  try {
    // Validation
    if (!fullName || !email || !phoneNumber || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long",
      });
    }

    if (!agreeToTerms) {
      return res.status(400).json({
        success: false,
        message: "You must agree to the Terms and Conditions",
      });
    }

    // Email validation
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address",
      });
    }

    // Phone validation
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phoneNumber.replace(/\D/g, "").slice(-10))) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid 10-digit phone number",
      });
    }

    // Check if email already exists
    const existingEmail = await ZenoPayDetails.findOne({ Email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: "Email already registered. Please login instead.",
      });
    }

    // Check if phone already exists
    const existingPhone = await ZenoPayDetails.findOne({ Mobile: phoneNumber.replace(/\D/g, "").slice(-10) });
    if (existingPhone) {
      return res.status(400).json({
        success: false,
        message: "Phone number already registered",
      });
    }

    // Generate unique ZenoPay ID
    const generateZenoPayId = () => {
      const prefix = "ZP";
      const timestamp = Date.now().toString().slice(-8);
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
      return `${prefix}${timestamp}${random}`;
    };

    let zenoPayId = generateZenoPayId();
    let idExists = await ZenoPayDetails.findOne({ ZenoPayID: zenoPayId });
    
    // Ensure unique ID
    while (idExists) {
      zenoPayId = generateZenoPayId();
      idExists = await ZenoPayDetails.findOne({ ZenoPayID: zenoPayId });
    }

    // Create new user (Note: In production, use bcrypt for password hashing)
    const newUser = new ZenoPayDetails({
      ZenoPayID: zenoPayId,
      FullName: fullName.trim(),
      Email: email.toLowerCase().trim(),
      Mobile: phoneNumber.replace(/\D/g, "").slice(-10),
      Password: password, // TODO: Hash password in production
      DOB: new Date("2000-01-01"), // Placeholder - collect in profile completion
      Gender: "Not Specified", // Placeholder
      FatherName: "Not Provided", // Placeholder
      Address: "Not Provided", // Placeholder
      City: "Not Provided", // Placeholder
      State: "Not Provided", // Placeholder
      Pincode: "000000", // Placeholder
      Role: "user",
      AccountStatus: "Active",
      RegistrationDate: new Date(),
    });

    await newUser.save();

    // Auto-login after registration
    req.session.regenerate((err) => {
      if (err) {
        console.error("Session regeneration failed:", err);
        return res.status(200).json({
          success: true,
          message: "Registration successful! Please login to continue.",
          zenoPayId: zenoPayId,
          redirect: "/login",
        });
      }

      req.session.user = {
        _id: newUser._id.toString(),
        name: newUser.FullName,
        ZenoPayID: newUser.ZenoPayID,
        email: newUser.Email,
        role: newUser.Role,
      };

      req.session.isLoggedIn = true;
      req.session.save((saveErr) => {
        if (saveErr) {
          return res.status(200).json({
            success: true,
            message: "Registration successful! Please login to continue.",
            zenoPayId: zenoPayId,
            redirect: "/login",
          });
        }

        return res.status(201).json({
          success: true,
          message: "Registration successful! Welcome to ZenoPay!",
          zenoPayId: zenoPayId,
          redirect: "/",
        });
      });
    });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({
      success: false,
      message: "Registration failed. Please try again later.",
    });
  }
};

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
     
      return res.status(401).json({
        success: false,
        message: "User not found. Please check your credentials.",
      });
    }
    if (user.Password !== password) {
     
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
       
          return res.status(500).json({
            success: false,
            message: "Session save error. Please try again.",
          });
        }

       
        return res.status(200).json({
          success: true,
          message: "Login successful!",
        });
      });
    });
  } catch (err) {
  

    return res.status(500).json({
      success: false,
      message: "Internal Server Error. Please try again.",
    });
  }
};

const logout = (req, res) => {
  
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

// Show forgot password page
const getForgotPassword = (req, res) => {
  if (req.session.isLoggedIn) {
    return res.redirect("/");
  }
  res.render("forgot-password", {
    pageTitle: "Forgot Password - ZenoPay",
    isLoggedIn: false,
    user: null,
  });
};

// Handle forgot password form submission
const postForgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    // Validation
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email address is required",
      });
    }

    // Email validation
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email address",
      });
    }

    // Check if user exists
    const user = await ZenoPayDetails.findOne({ Email: email });
    if (!user) {
      // Don't reveal if email exists in system for security
      return res.status(200).json({
        success: true,
        message: "If an account exists with this email, you will receive password reset instructions",
      });
    }

    // Generate reset token (32 chars)
    const resetToken = Math.random().toString(36).substring(2, 15) + 
                       Math.random().toString(36).substring(2, 15);
    
    // Set reset token and expiry (30 minutes)
    user.PasswordResetToken = resetToken;
    user.PasswordResetExpiry = new Date(Date.now() + 30 * 60 * 1000);
    await user.save();

    // TODO: Send email with reset link
    // const resetLink = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;
    // await sendPasswordResetEmail(user.Email, user.FullName, resetLink);

    console.log(`Password reset token for ${email}: ${resetToken}`);
    console.log(`Reset link: /reset-password/${resetToken}`);

    return res.status(200).json({
      success: true,
      message: "Password reset instructions sent to your email",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred. Please try again.",
    });
  }
};

// Handle resend reset link
const postResendResetLink = async (req, res) => {
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email address is required",
      });
    }

    const user = await ZenoPayDetails.findOne({ Email: email });
    if (!user) {
      return res.status(200).json({
        success: true,
        message: "Reset link resent if account exists",
      });
    }

    // Generate new reset token
    const resetToken = Math.random().toString(36).substring(2, 15) + 
                       Math.random().toString(36).substring(2, 15);
    
    user.PasswordResetToken = resetToken;
    user.PasswordResetExpiry = new Date(Date.now() + 30 * 60 * 1000);
    await user.save();

    // TODO: Send email with reset link
    console.log(`Password reset token resent for ${email}: ${resetToken}`);

    return res.status(200).json({
      success: true,
      message: "Reset link resent to your email",
    });
  } catch (error) {
    console.error("Resend reset link error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred. Please try again.",
    });
  }
};

// Show reset password page
const getResetPassword = async (req, res) => {
  const { token } = req.params;

  try {
    const user = await ZenoPayDetails.findOne({
      PasswordResetToken: token,
      PasswordResetExpiry: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).render("reset-password", {
        pageTitle: "Reset Password - ZenoPay",
        isLoggedIn: false,
        user: null,
        tokenValid: false,
        message: "Password reset link is invalid or has expired",
      });
    }

    res.render("reset-password", {
      pageTitle: "Reset Password - ZenoPay",
      isLoggedIn: false,
      user: null,
      tokenValid: true,
      token: token,
    });
  } catch (error) {
    console.error("Reset password page error:", error);
    return res.status(500).render("reset-password", {
      pageTitle: "Reset Password - ZenoPay",
      isLoggedIn: false,
      user: null,
      tokenValid: false,
      message: "An error occurred. Please try again.",
    });
  }
};

// Handle reset password form submission
const postResetPassword = async (req, res) => {
  const { token, password, confirmPassword } = req.body;

  try {
    if (!password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long",
      });
    }

    const user = await ZenoPayDetails.findOne({
      PasswordResetToken: token,
      PasswordResetExpiry: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Password reset link is invalid or has expired",
      });
    }

    // Update password
    user.Password = password;
    user.PasswordResetToken = undefined;
    user.PasswordResetExpiry = undefined;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password reset successfully. Please login with your new password.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred. Please try again.",
    });
  }
};

module.exports = {
  getRegister,
  postRegister,
  getLogin,
  postLogin,
  logout,
  getForgotPassword,
  postForgotPassword,
  postResendResetLink,
  getResetPassword,
  postResetPassword,
};
