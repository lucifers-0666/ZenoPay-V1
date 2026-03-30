const express = require("express");
const router = express.Router();

const DashboardController = require("../Controllers/DashboardController");
const LoginController = require("../Controllers/AuthController");
const EmailVerificationController = require("../Controllers/EmailVerificationController");
const { isAuthenticated, redirectIfAuthenticated } = require("../Middleware/authGuards");

// Auth & Dashboard
router.get("/", DashboardController.getDashboard);
router.get("/dashboard", isAuthenticated, DashboardController.getDashboard);

// GET routes use redirectIfAuthenticated to prevent logged-in users seeing auth pages.
// POST routes must NOT use redirectIfAuthenticated — the handler manages session internally.
router.get("/register", redirectIfAuthenticated, LoginController.getRegister);
router.post("/register", LoginController.postRegister);
router.get("/signup", redirectIfAuthenticated, LoginController.getRegister);
router.post("/signup", LoginController.postRegister);
router.get("/login", redirectIfAuthenticated, LoginController.getLogin);
router.post("/login", LoginController.postLogin);
router.get("/logout", LoginController.logout);

// Password Reset
router.get("/forgot-password", redirectIfAuthenticated, LoginController.getForgotPassword);
router.post("/forgot-password", LoginController.postForgotPassword);
router.post("/forgot-password/resend", LoginController.postResendResetLink);

// OTP Email Verification (registration flow)
router.get("/verify-email", LoginController.getVerifyEmail);
router.post("/verify-email", LoginController.postVerifyEmail);
router.post("/resend-otp", LoginController.postResendOtp);

// Fallback when no token is provided so users see the error state instead of a 404
router.get("/reset-password", (req, res) => {
  return res.status(400).render("reset-password", {
    pageTitle: "Reset Password - ZenoPay",
    isLoggedIn: false,
    user: null,
    tokenValid: false,
    message: "Reset link is missing. Please use the link sent to your email or request a new one.",
  });
});
router.get("/reset-password/:token", LoginController.getResetPassword);
router.post("/reset-password", LoginController.postResetPassword);

// Email Verification
router.get("/verify-email/:token", EmailVerificationController.getVerifyEmail);
router.post("/api/auth/resend-verification", EmailVerificationController.resendVerificationEmail);
router.get("/api/auth/verification-status", EmailVerificationController.checkVerificationStatus);

// Design Preview Routes (for testing UI)
router.get("/verify-email-preview/:state", (req, res) => {
  const { state } = req.params;
  const validStates = ["success", "error", "expired", "loading"];

  if (!validStates.includes(state)) {
    return res.redirect("/verify-email-preview/success");
  }

  return res.render("verify-email", {
    status: state,
    message: state === "error" ? "This is a preview of the error state." : null,
    email: "user@example.com",
    pageTitle: `Email Verification ${state.charAt(0).toUpperCase() + state.slice(1)} - ZenoPay`,
  });
});

module.exports = router;
