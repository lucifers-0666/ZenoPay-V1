/**
 * Input Validation & Sanitization Utilities
 */

const { body, param, query, validationResult } = require("express-validator");

// Validation rules
const passwordRules = () => {
  return body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    );
};

const emailRules = () => {
  return body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Invalid email address");
};

const phoneRules = () => {
  return body("phoneNumber", "Mobile")
    .matches(/^[0-9]{10}$/)
    .withMessage("Phone number must be 10 digits");
};

const nameRules = () => {
  return body("name", "Name")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters")
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage("Name can only contain letters and spaces");
};

const idRules = () => {
  return param("id")
    .isMongoId()
    .withMessage("Invalid ID format");
};

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map((err) => ({
        field: err.param,
        message: err.msg,
      })),
    });
  }
  next();
};

// Sanitization utilities
const sanitizeInput = (input) => {
  if (typeof input !== "string") return input;
  
  // Remove HTML tags and escape special characters
  return input
    .replace(/<[^>]*>/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .trim();
};

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePhone = (phone) => {
  const phoneRegex = /^[0-9]{10}$/;
  return phoneRegex.test(phone.replace(/\D/g, "").slice(-10));
};

const validatePassword = (password) => {
  return password.length >= 8 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password) &&
    /[@$!%*?&]/.test(password);
};

const validateZenoPayID = (id) => {
  // ZenoPay ID format: Z followed by 10 alphanumeric characters
  const zenoPayIDRegex = /^Z[A-Z0-9]{10}$/i;
  return zenoPayIDRegex.test(id);
};

module.exports = {
  // Validation rules
  passwordRules,
  emailRules,
  phoneRules,
  nameRules,
  idRules,

  // Error handling
  handleValidationErrors,

  // Sanitization
  sanitizeInput,

  // Validators
  validateEmail,
  validatePhone,
  validatePassword,
  validateZenoPayID,
};
