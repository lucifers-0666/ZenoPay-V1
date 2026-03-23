const ZenoPayDetails = require("../Models/ZenoPayUser");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const emailService = require("../Services/EmailService");

const BCRYPT_ROUNDS = Number.parseInt(process.env.BCRYPT_ROUNDS || "12", 10);

const isBcryptHash = (value = "") => /^\$2[aby]\$\d{2}\$/.test(value);

const verifyPasswordAndUpgradeIfNeeded = async (user, plainPassword) => {
  if (!user || !user.Password || !plainPassword) return false;

  if (isBcryptHash(user.Password)) {
    return bcrypt.compare(plainPassword, user.Password);
  }

  if (user.Password !== plainPassword) {
    return false;
  }

  // Legacy plaintext password found: transparently upgrade to bcrypt hash.
  user.Password = await bcrypt.hash(plainPassword, BCRYPT_ROUNDS);
  await user.save();
  return true;
};

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

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // Create new user
    const newUser = new ZenoPayDetails({
      ZenoPayID: zenoPayId,
      FullName: fullName.trim(),
      Email: email.toLowerCase().trim(),
      Mobile: phoneNumber.replace(/\D/g, "").slice(-10),
      Password: passwordHash,
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
    const isPasswordValid = await verifyPasswordAndUpgradeIfNeeded(user, password);
    if (!isPasswordValid) {
     
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

const buildResetPasswordEmail = ({ fullName, resetLink }) => {
  return {
    subject: "Reset your ZenoPay password",
    html: `
      <div style="font-family:Inter,Arial,sans-serif;color:#1f2937;line-height:1.6;max-width:640px;margin:0 auto;padding:20px;">
        <h2 style="margin:0 0 12px;">Reset your password</h2>
        <p>Hi ${fullName || "there"},</p>
        <p>We received a request to reset your ZenoPay password. Click the button below to continue:</p>
        <p style="margin:20px 0;">
          <a href="${resetLink}" style="background:#2563eb;color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px;display:inline-block;font-weight:600;">Reset Password</a>
        </p>
        <p>If the button doesn't work, copy this link into your browser:</p>
        <p style="word-break:break-all;color:#2563eb;">${resetLink}</p>
        <p style="margin-top:16px;">This link expires in 30 minutes. If you didn't request this, you can ignore this email.</p>
      </div>
    `,
    text: `Reset your ZenoPay password: ${resetLink} (expires in 30 minutes)`,
  };
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

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    
    // Set reset token and expiry (30 minutes)
    user.PasswordResetToken = resetToken;
    user.PasswordResetExpiry = new Date(Date.now() + 30 * 60 * 1000);
    await user.save();

    const appUrl = process.env.APP_URL || `${req.protocol}://${req.get("host")}`;
    const resetLink = `${appUrl}/reset-password/${resetToken}`;
    const emailContent = buildResetPasswordEmail({ fullName: user.FullName, resetLink });

    const sendResult = await emailService.sendEmail({
      to: user.Email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    });

    if (!sendResult?.sent) {
      return res.status(500).json({
        success: false,
        message: "Unable to send reset email right now. Please try again later.",
      });
    }

    if (process.env.NODE_ENV !== "production") {
      console.log(`Reset link (dev): ${resetLink}`);
    }

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
    const resetToken = crypto.randomBytes(32).toString("hex");
    
    user.PasswordResetToken = resetToken;
    user.PasswordResetExpiry = new Date(Date.now() + 30 * 60 * 1000);
    await user.save();

    const appUrl = process.env.APP_URL || `${req.protocol}://${req.get("host")}`;
    const resetLink = `${appUrl}/reset-password/${resetToken}`;
    const emailContent = buildResetPasswordEmail({ fullName: user.FullName, resetLink });

    const sendResult = await emailService.sendEmail({
      to: user.Email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    });

    if (!sendResult?.sent) {
      return res.status(500).json({
        success: false,
        message: "Unable to resend reset email right now. Please try again later.",
      });
    }

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
    user.Password = await bcrypt.hash(password, BCRYPT_ROUNDS);
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
