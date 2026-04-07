const ZenoPayDetails = require("../Models/ZenoPayUser");
const LoginHistory = require("../Models/LoginHistory");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const mongoose = require("mongoose");
const emailService = require("../Services/EmailService");
const { sendOTP, sendWelcomeEmail } = require("../utils/emailService");
const ReferralController = require("./ReferralController");

const BCRYPT_ROUNDS = Number.parseInt(process.env.BCRYPT_ROUNDS || "12", 10);
const OTP_TTL_MS = Number.parseInt(process.env.EMAIL_OTP_EXPIRY_MS || `${10 * 60 * 1000}`, 10);

const isBcryptHash = (value = "") => /^\$2[aby]\$\d{2}\$/.test(value);

const getClientIp = (req) => {
  const forwarded = req.headers["x-forwarded-for"];
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0];
  }
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || "Unknown IP";
};

const getDeviceLabel = (userAgent = "") => {
  const ua = String(userAgent).toLowerCase();
  if (!ua) return "Unknown Device";
  if (/(iphone|ipad|ipod)/i.test(ua)) return "iOS Device";
  if (/android/i.test(ua)) return "Android Device";
  if (/(windows|macintosh|linux)/i.test(ua)) return "Desktop";
  return "Unknown Device";
};

const getBrowserLabel = (userAgent = "") => {
  const ua = String(userAgent);
  if (/edg\//i.test(ua)) return "Microsoft Edge";
  if (/chrome\//i.test(ua) && !/edg\//i.test(ua)) return "Google Chrome";
  if (/firefox\//i.test(ua)) return "Mozilla Firefox";
  if (/safari\//i.test(ua) && !/chrome\//i.test(ua)) return "Safari";
  if (/opr\//i.test(ua) || /opera/i.test(ua)) return "Opera";
  return "Unknown Browser";
};

const wantsJsonResponse = (req) => {
  const accept = String(req.headers?.accept || "");
  const contentType = String(req.headers?.["content-type"] || "");
  return !!(
    req.xhr ||
    req.is("application/json") ||
    contentType.includes("application/json") ||
    accept.includes("application/json")
  );
};

const resolveSafePostLoginRedirect = (req) => {
  const candidate = String(req.session?.returnTo || "").trim();

  // Always clear returnTo once consumed to avoid stale redirect loops.
  if (req.session && Object.prototype.hasOwnProperty.call(req.session, "returnTo")) {
    delete req.session.returnTo;
  }

  if (!candidate || !candidate.startsWith("/")) {
    return "/dashboard";
  }

  const disallowed = [
    "/login",
    "/register",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/admin",
    "/admin/login",
  ];

  const isDisallowed = disallowed.some(
    (prefix) => candidate === prefix || candidate.startsWith(`${prefix}/`)
  );

  return isDisallowed ? "/dashboard" : candidate;
};

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

const generateEmailOtp = () => {
  return String(Math.floor(100000 + Math.random() * 900000));
};

const buildEmailOtpTemplate = ({ fullName, otpCode }) => {
  return {
    subject: "Your ZenoPay Email Verification OTP",
    html: `
      <div style="font-family:Inter,Arial,sans-serif;color:#111827;line-height:1.6;max-width:640px;margin:0 auto;padding:20px;">
        <h2 style="margin:0 0 12px;">Verify your email address</h2>
        <p>Hi ${fullName || "there"},</p>
        <p>Use this One-Time Password (OTP) to verify your ZenoPay account:</p>
        <div style="margin:18px 0;padding:14px 16px;border-radius:10px;background:#eff6ff;border:1px solid #bfdbfe;display:inline-block;">
          <span style="font-size:28px;letter-spacing:6px;font-weight:700;color:#1d4ed8;">${otpCode}</span>
        </div>
        <p>This OTP expires in 10 minutes.</p>
        <p style="color:#6b7280;font-size:13px;">If you did not create this account, you can safely ignore this email.</p>
      </div>
    `,
    text: `Your ZenoPay OTP is ${otpCode}. It expires in 10 minutes.`,
  };
};

const resolveVerificationIdentity = (req, explicitEmail = "") => {
  const fromBodyOrQuery = String(explicitEmail || req.body?.email || req.query?.email || "").trim().toLowerCase();
  const fromSession = String(req.session?.pendingVerificationEmail || req.session?.user?.Email || req.session?.user?.email || "")
    .trim()
    .toLowerCase();

  return fromBodyOrQuery || fromSession;
};

const sendEmailOtp = async (user, otpCode) => {
  return sendOTP({
    name: user.FullName || user.name,
    email: user.Email || user.email,
    otpCode,
  });
};

const issueOtpForUser = async (user) => {
  const otpCode = generateEmailOtp();
  user.emailOtp = await bcrypt.hash(otpCode, BCRYPT_ROUNDS);
  user.emailOtpExpiry = new Date(Date.now() + OTP_TTL_MS);
  user.isEmailVerified = false;
  user.EmailVerified = false;
  await user.save();

  const emailResult = await sendEmailOtp(user, otpCode);
  return {
    sent: !!emailResult?.sent,
    emailResult,
  };
};

// Show registration page
const getRegister = (req, res) => {
  if (req.session && req.session.user) {
    return res.redirect("/dashboard");
  }

  const referralCode = String(req.query?.ref || req.session?.referral_code || "").trim().toUpperCase();
  if (referralCode) {
    req.session.referral_code = referralCode;
  }

  res.render("register", {
    pageTitle: "Create Account - ZenoPay",
    isLoggedIn: false,
    user: null,
    referralCode,
  });
};

// Handle user registration
const postRegister = async (req, res) => {
  const { fullName, email, phoneNumber, password, confirmPassword, agreeToTerms } = req.body;

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: "Database unavailable. Please check MongoDB connection and try again.",
      });
    }

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

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedPhone = phoneNumber.replace(/\D/g, "").slice(-10);

    // Check if account already exists by email or phone (single query for speed)
    const existingUser = await ZenoPayDetails.findOne({
      $or: [
        { Email: normalizedEmail },
        { email: normalizedEmail },
        { Mobile: normalizedPhone },
        { phone: normalizedPhone },
        { PhoneNumber: normalizedPhone },
      ],
    })
      .select("Email email Mobile phone PhoneNumber")
      .lean();

    if (existingUser) {
      const matchedEmail =
        String(existingUser.Email || "").toLowerCase() === normalizedEmail ||
        String(existingUser.email || "").toLowerCase() === normalizedEmail;

      if (matchedEmail) {
        const existingByEmail = await ZenoPayDetails.findOne({
          $or: [{ Email: normalizedEmail }, { email: normalizedEmail }],
        });

        const alreadyVerified = !!(
          existingByEmail?.isEmailVerified ?? existingByEmail?.EmailVerified
        );

        if (existingByEmail && !alreadyVerified) {
          const otpIssue = await issueOtpForUser(existingByEmail);
          req.session.pendingVerificationEmail = normalizedEmail;

          return res.status(200).json({
            success: true,
            message: otpIssue.sent
              ? "Account already exists but email is not verified. A fresh OTP has been sent."
              : "Account already exists but email is not verified. Please use resend OTP on verify page.",
            redirect: `/verify-email?email=${encodeURIComponent(normalizedEmail)}`,
          });
        }

        return res.status(400).json({
          success: false,
          message: "Email already registered. Please login instead.",
        });
      }

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
    let idExists = await ZenoPayDetails.findOne({
      $or: [{ ZenoPayID: zenoPayId }, { userId: zenoPayId }],
    });

    // Ensure unique ID
    while (idExists) {
      zenoPayId = generateZenoPayId();
      idExists = await ZenoPayDetails.findOne({
        $or: [{ ZenoPayID: zenoPayId }, { userId: zenoPayId }],
      });
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const referralCode = String(req.body?.referralCode || req.session?.referral_code || "").trim().toUpperCase();

    // Create new user
    const newUser = new ZenoPayDetails({
      userId: zenoPayId,
      name: fullName.trim(),
      email: normalizedEmail,
      phone: normalizedPhone,
      status: "Active",
      role: "User",
      ZenoPayID: zenoPayId,
      FullName: fullName.trim(),
      Email: normalizedEmail,
      Mobile: normalizedPhone,
      Password: passwordHash,
      DOB: new Date("2000-01-01"),
      Gender: "Not Specified",
      FatherName: "Not Provided",
      Address: "Not Provided",
      City: "Not Provided",
      State: "Not Provided",
      Pincode: "000000",
      Role: "user",
      AccountStatus: "Active",
      RegistrationDate: new Date(),
    });

    const otpIssue = await issueOtpForUser(newUser);
    const emailResult = otpIssue.emailResult;
    if (!emailResult?.sent) {
      console.warn("[Auth] OTP email not sent during registration for:", normalizedEmail);
    }

    // Fire welcome email in background (non-blocking). Registration must succeed regardless.
    sendWelcomeEmail(newUser).catch((err) => {
      console.log("Welcome email failed:", err?.message || err);
    });

    if (referralCode) {
      const linkResult = await ReferralController.linkPendingReferralForUser({
        referralCode,
        refereeUser: newUser,
      });

      if (linkResult.success) {
        req.session.pendingReferralCode = referralCode;
      }
    }

    req.session.pendingVerificationEmail = normalizedEmail;

    return res.status(201).json({
      success: true,
      message: emailResult?.sent
        ? "Registration successful! Please verify your email using OTP sent to your inbox."
        : "Registration successful, but OTP email could not be sent. Please resend OTP from verification page.",
      zenoPayId: zenoPayId,
      redirect: `/verify-email?email=${encodeURIComponent(normalizedEmail)}`,
    });
  } catch (error) {
    console.error("Registration error:", error);

    if (error?.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern || error.keyValue || {})[0] || "field";
      const duplicateMessages = {
        Email: "Email already registered. Please login instead.",
        email: "Email already registered. Please login instead.",
        Mobile: "Phone number already registered.",
        phone: "Phone number already registered.",
        ZenoPayID: "Could not generate unique ZenoPay ID. Please try again.",
        userId: "Could not generate unique ZenoPay ID. Please try again.",
      };

      return res.status(400).json({
        success: false,
        message: duplicateMessages[duplicateField] || "Account already exists with provided details.",
      });
    }

    if (error?.name === "ValidationError") {
      const firstValidationError = Object.values(error.errors || {})[0];
      return res.status(400).json({
        success: false,
        message: firstValidationError?.message || "Invalid registration data. Please check your input.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Registration failed. Please try again later.",
    });
  }
};

// Show login page
const getLogin = (req, res) => {
  if (req.session && req.session.user) {
    return res.redirect("/dashboard");
  }

  // FIX: pass messages (flash or empty) and csrfToken so login.ejs
  // never throws a ReferenceError and the CSRF hidden input is always populated.
  const flashMessages = (req.flash && typeof req.flash === "function")
    ? { error: req.flash("error"), success: req.flash("success") }
    : {};

  res.render("login", {
    CurrentPage: "Login",
    isLoggedIn: false,
    user: null,
    messages: flashMessages,
    csrfToken: (typeof req.csrfToken === "function") ? req.csrfToken() : null,
  });
};

const postLogin = async (req, res) => {
  const { userId, password } = req.body;
  const expectsJson = wantsJsonResponse(req);

  const fail = (statusCode, message) => {
    if (expectsJson) {
      return res.status(statusCode).json({ success: false, message });
    }

    const flashMessages = (req.flash && typeof req.flash === "function")
      ? { error: req.flash("error"), success: req.flash("success") }
      : { error: message };

    return res.status(statusCode).render("login", {
      CurrentPage: "Login",
      isLoggedIn: false,
      user: null,
      messages: flashMessages.error && flashMessages.error.length ? flashMessages : { error: message },
      csrfToken: (typeof req.csrfToken === "function") ? req.csrfToken() : null,
    });
  };

  try {
    if (mongoose.connection.readyState !== 1) {
      return fail(503, "Database unavailable. Please check MongoDB connection and try again.");
    }

    const cleanUserId = String(userId || "").trim();
    const cleanPassword = String(password || "");

    if (!cleanUserId || !cleanPassword) {
      return fail(400, "Email/ZenoPay ID and password are required.");
    }

    const user = await ZenoPayDetails.findOne({
      $or: [{ ZenoPayID: cleanUserId }, { Email: cleanUserId }],
    });
    if (!user) {
      return fail(401, "Invalid email/ZenoPay ID or password.");
    }
    const isPasswordValid = await verifyPasswordAndUpgradeIfNeeded(user, cleanPassword);
    if (!isPasswordValid) {
      return fail(401, "Invalid email/ZenoPay ID or password.");
    }

    // Store ALL name/email variants so header.ejs can always find them
    const isUserEmailVerified = !!(user.isEmailVerified ?? user.EmailVerified);
    let otpIssuedForLogin = null;

    if (!isUserEmailVerified) {
      try {
        const issued = await issueOtpForUser(user);
        otpIssuedForLogin = issued.sent;
      } catch (otpErr) {
        console.error("[Auth] Failed to issue OTP during login:", otpErr.message);
        otpIssuedForLogin = false;
      }

      req.session.pendingVerificationEmail = String(user.Email || user.email || "").toLowerCase();
    }

    req.session.user = {
      _id: user._id.toString(),
      name: user.FullName || user.name || "",
      Name: user.FullName || user.name || "",
      FullName: user.FullName || user.name || "",
      ZenoPayID: user.ZenoPayID || user.userId || "",
      ZenoPayId: user.ZenoPayID || user.userId || "",
      Email: user.Email || user.email || "",
      email: user.Email || user.email || "",
      ProfilePicture: user.ProfilePicture || null,
      isEmailVerified: isUserEmailVerified,
      EmailVerified: isUserEmailVerified,
      role: user.Role || user.role || "user",
      Role: user.Role || user.role || "user",
    };

    req.session.userId = user._id.toString();
    req.session.isLoggedIn = true;
    req.session.lastActivityAt = Date.now();

    req.session.save((saveErr) => {
      if (saveErr) {
        console.error("SESSION SAVE ERROR:", saveErr);
        return fail(500, "Session error");
      }

      const redirectTarget = req.session.user?.isEmailVerified
        ? resolveSafePostLoginRedirect(req)
        : `/verify-email?email=${encodeURIComponent(req.session.user?.Email || "")}&otpSent=${otpIssuedForLogin ? "1" : "0"}`;

      LoginHistory.create({
        ZenoPayId: user.ZenoPayID,
        status: "success",
        device: getDeviceLabel(req.headers["user-agent"]),
        browser: getBrowserLabel(req.headers["user-agent"]),
        ip: getClientIp(req),
        location: "Unknown Location",
        userAgent: req.headers["user-agent"] || "",
        loginAt: new Date(),
      }).catch((historyErr) => {
        console.error("[Auth] Login history save failed:", historyErr.message);
      });

      if (expectsJson) {
        return res.json({ success: true, redirect: redirectTarget });
      }

      return res.redirect(redirectTarget);
    });
  } catch (err) {
    console.error("Login error:", err);
    return fail(500, "Internal Server Error. Please try again.");
  }
};

const logout = (req, res) => {
  // Only clear USER session keys, not admin
  delete req.session.user;
  delete req.session.userId;
  req.session.isLoggedIn = !!(req.session && req.session.admin);

  req.session.save((err) => {
    if (err) {
      console.error("Logout save error:", err);
    }
    return res.redirect("/login");
  });
};

// Show forgot password page
const getForgotPassword = (req, res) => {
  if (req.session && req.session.user) {
    return res.redirect("/dashboard");
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
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email address is required",
      });
    }

    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email address",
      });
    }

    const user = await ZenoPayDetails.findOne({ Email: email });
    if (!user) {
      return res.status(200).json({
        success: true,
        message: "If an account exists with this email, you will receive password reset instructions",
      });
    }

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
  const token = String(req.params?.token || req.body?.token || "").trim();
  const password = String(req.body?.password || "");
  const confirmPassword = String(req.body?.confirmPassword || "");

  try {
    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Reset token is missing or invalid",
      });
    }

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

    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
    user.Password = hashedPassword;
    user.password = hashedPassword;
    user.PasswordChangeDate = new Date();
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

const getVerifyEmail = async (req, res) => {
  const email = resolveVerificationIdentity(req);

  if (!email) {
    return res.redirect("/login");
  }

  return res.render("verify-email", {
    pageTitle: "Verify Email - ZenoPay",
    otpMode: true,
    email,
    success: req.query?.otpSent === "1" ? "OTP sent to your email." : null,
    error: req.query?.otpSent === "0" ? "We could not auto-send OTP. Please click Resend OTP." : null,
  });
};

const postVerifyEmail = async (req, res) => {
  const otp = String(req.body?.otp || "").trim();
  const email = resolveVerificationIdentity(req, req.body?.email);

  if (!email) {
    return res.status(400).render("verify-email", {
      pageTitle: "Verify Email - ZenoPay",
      otpMode: true,
      email: "",
      success: null,
      error: "Session expired. Please login or register again.",
    });
  }

  if (!/^\d{6}$/.test(otp)) {
    return res.status(400).render("verify-email", {
      pageTitle: "Verify Email - ZenoPay",
      otpMode: true,
      email,
      success: null,
      error: "Please enter a valid 6-digit OTP.",
    });
  }

  try {
    const user = await ZenoPayDetails.findOne({
      $or: [{ Email: email }, { email }],
    });

    if (!user) {
      return res.status(404).render("verify-email", {
        pageTitle: "Verify Email - ZenoPay",
        otpMode: true,
        email,
        success: null,
        error: "No account found for this email.",
      });
    }

    if (user.isEmailVerified || user.EmailVerified) {
      return res.render("verify-email", {
        pageTitle: "Verify Email - ZenoPay",
        otpMode: true,
        email,
        success: "Your email is already verified. You can continue to login.",
        error: null,
      });
    }

    if (!user.emailOtp || !user.emailOtpExpiry || user.emailOtpExpiry.getTime() <= Date.now()) {
      return res.status(400).render("verify-email", {
        pageTitle: "Verify Email - ZenoPay",
        otpMode: true,
        email,
        success: null,
        error: "OTP has expired. Please request a new OTP.",
      });
    }

    const otpMatches = await bcrypt.compare(otp, user.emailOtp);
    if (!otpMatches) {
      return res.status(400).render("verify-email", {
        pageTitle: "Verify Email - ZenoPay",
        otpMode: true,
        email,
        success: null,
        error: "Invalid OTP. Please try again.",
      });
    }

    user.isEmailVerified = true;
    user.EmailVerified = true;
    user.EmailVerifiedAt = new Date();
    user.emailOtp = undefined;
    user.emailOtpExpiry = undefined;
    await user.save();

    if (req.session?.user) {
      req.session.user.isEmailVerified = true;
      req.session.user.EmailVerified = true;
    }

    if (req.session?.pendingVerificationEmail) {
      delete req.session.pendingVerificationEmail;
    }

    const rewardResult = await ReferralController.creditReferralRewards(user.ZenoPayID);
    const rewardMessage = rewardResult?.success
      ? ` ₹${Number(rewardResult.refereeBonus || 50).toFixed(0)} referral bonus credited to your wallet!`
      : "";

    return res.render("verify-email", {
      pageTitle: "Verify Email - ZenoPay",
      otpMode: true,
      email,
      success: `Email verified successfully! You can now access your dashboard.${rewardMessage}`,
      error: null,
    });
  } catch (error) {
    console.error("Verify email OTP error:", error);
    return res.status(500).render("verify-email", {
      pageTitle: "Verify Email - ZenoPay",
      otpMode: true,
      email,
      success: null,
      error: "Unable to verify OTP right now. Please try again.",
    });
  }
};

const postResendOtp = async (req, res) => {
  const email = resolveVerificationIdentity(req, req.body?.email);

  if (!email) {
    return res.status(400).render("verify-email", {
      pageTitle: "Verify Email - ZenoPay",
      otpMode: true,
      email: "",
      success: null,
      error: "Email is required to resend OTP.",
    });
  }

  try {
    const user = await ZenoPayDetails.findOne({
      $or: [{ Email: email }, { email }],
    });

    if (!user) {
      return res.status(404).render("verify-email", {
        pageTitle: "Verify Email - ZenoPay",
        otpMode: true,
        email,
        success: null,
        error: "No account found for this email.",
      });
    }

    if (user.isEmailVerified || user.EmailVerified) {
      return res.render("verify-email", {
        pageTitle: "Verify Email - ZenoPay",
        otpMode: true,
        email,
        success: "Your email is already verified. You can continue to login.",
        error: null,
      });
    }

    const otpCode = generateEmailOtp();
    user.emailOtp = await bcrypt.hash(otpCode, BCRYPT_ROUNDS);
    user.emailOtpExpiry = new Date(Date.now() + OTP_TTL_MS);
    await user.save();

    req.session.pendingVerificationEmail = email;

    const emailResult = await sendEmailOtp(user, otpCode);
    if (!emailResult?.sent) {
      return res.status(500).render("verify-email", {
        pageTitle: "Verify Email - ZenoPay",
        otpMode: true,
        email,
        success: null,
        error: "Failed to send OTP email. Please try again.",
      });
    }

    return res.render("verify-email", {
      pageTitle: "Verify Email - ZenoPay",
      otpMode: true,
      email,
      success: "A new OTP has been sent to your email.",
      error: null,
    });
  } catch (error) {
    console.error("Resend OTP error:", error);
    return res.status(500).render("verify-email", {
      pageTitle: "Verify Email - ZenoPay",
      otpMode: true,
      email,
      success: null,
      error: "Unable to resend OTP right now. Please try again.",
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
  getVerifyEmail,
  postVerifyEmail,
  postResendOtp,
};
