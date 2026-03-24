const ZenoPayDetails = require("../Models/ZenoPayUser");
const emailService = require("../Services/EmailService");
const { uploadToAzure } = require("../Services/azureStorage"); 
const bcrypt = require("bcryptjs");

const BCRYPT_ROUNDS = Number.parseInt(process.env.BCRYPT_ROUNDS || "12", 10);
const nameRegex = /^[A-Za-z\s.'·-]{3,60}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const mobileRegex = /^[6-9]\d{9}$/;
const pincodeRegex = /^\d{6}$/;

const isAtLeast18 = (dob) => {
  if (!dob) return false;
  const birthDate = new Date(dob);
  if (Number.isNaN(birthDate.getTime())) return false;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }
  return age >= 18;
};

const validatePayload = (data = {}, file = null) => {
  const fieldErrors = {};

  const fullName = String(data.FullName || "").trim();
  const email = String(data.Email || "").trim().toLowerCase();
  const mobile = String(data.Mobile || "").replace(/\D/g, "").slice(0, 10);
  const password = String(data.Password || "");
  const confirmPassword = String(data.ConfirmPassword || "");
  const dob = String(data.DOB || "");
  const gender = String(data.Gender || "").trim();
  const fatherName = String(data.FatherName || "").trim();
  const motherName = String(data.MotherName || "").trim();
  const address = String(data.Address || "").trim();
  const city = String(data.City || "").trim();
  const state = String(data.State || "").trim();
  const pincode = String(data.Pincode || "").replace(/\D/g, "").slice(0, 6);
  const role = String(data.Role || "user").trim().toLowerCase();
  const businessName = String(data.BusinessName || "").trim();
  const tncAccepted = data.tnc === "on" || data.tnc === "true" || data.tnc === true;

  if (!nameRegex.test(fullName)) {
    fieldErrors.FullName = "Enter your full name (letters only, 3–60 chars).";
  }

  if (!emailRegex.test(email)) {
    fieldErrors.Email = "Enter a valid email address.";
  }

  if (!mobileRegex.test(mobile)) {
    fieldErrors.Mobile = "Enter a valid 10-digit mobile number.";
  }

  const passwordChecks = {
    minLength: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    digit: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
  const passwordScore = Object.values(passwordChecks).filter(Boolean).length;

  if (passwordScore < 4) {
    fieldErrors.Password = "Password must meet the required strength rules.";
  }

  if (!confirmPassword || password !== confirmPassword) {
    fieldErrors.ConfirmPassword = "Passwords do not match.";
  }

  if (!isAtLeast18(dob)) {
    fieldErrors.DOB = "You must be at least 18 years old.";
  }

  if (!gender) {
    fieldErrors.Gender = "Please select your gender.";
  }

  if (!nameRegex.test(fatherName)) {
    fieldErrors.FatherName = "Enter a valid father's name.";
  }

  if (motherName && !nameRegex.test(motherName)) {
    fieldErrors.MotherName = "Enter a valid mother's name.";
  }

  if (address.length < 10) {
    fieldErrors.Address = "Enter your complete address (minimum 10 characters).";
  }

  if (city.length < 2) {
    fieldErrors.City = "Enter your city name.";
  }

  if (!state) {
    fieldErrors.State = "Please select your state.";
  }

  if (!pincodeRegex.test(pincode)) {
    fieldErrors.Pincode = "Enter a valid 6-digit pincode.";
  }

  if (!["user", "merchant"].includes(role)) {
    fieldErrors.Role = "Please select a valid account type.";
  }

  if (role === "merchant" && (businessName.length < 3 || businessName.length > 80)) {
    fieldErrors.BusinessName = "Enter your business name (3–80 chars).";
  }

  if (!tncAccepted) {
    fieldErrors.tnc = "You must accept the terms to continue.";
  }

  if (file) {
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedMimeTypes.includes(file.mimetype) || file.size > 5 * 1024 * 1024) {
      fieldErrors.ImagePath = "Profile photo must be JPG/PNG/WebP and under 5 MB.";
    }
  }

  return {
    fieldErrors,
    normalized: {
      FullName: fullName,
      Email: email,
      Mobile: mobile,
      Password: password,
      ConfirmPassword: confirmPassword,
      DOB: dob,
      Gender: gender,
      FatherName: fatherName,
      MotherName: motherName,
      Address: address,
      City: city,
      State: state,
      Pincode: pincode,
      Role: role,
      BusinessName: businessName,
      tnc: tncAccepted,
    },
  };
};

const getRegisterZenoPay = (req, res) => {
  res.render("register",{
    isLoggedIn: req.session.isLoggedIn || false,
    user: req.session.user || null,
    currentPage: "ZenoPay Registration",
    qrCode : req.session.qrCode || null,
  });
};

const postRegisterZenoPay = async (req, res) => {
  try {
    const data = req.body || {};
    const file = req.file;

    const { fieldErrors, normalized } = validatePayload(data, file);
    if (Object.keys(fieldErrors).length > 0) {
      return res.status(400).json({
        success: false,
        message: "Please fix the highlighted fields and try again.",
        fieldErrors,
      });
    }

    const existingEmail = await ZenoPayDetails.findOne({ Email: normalized.Email });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: "This email is already registered.",
        fieldErrors: {
          Email: "Email already registered. Please use a different email.",
        },
      });
    }

    const existingMobile = await ZenoPayDetails.findOne({ Mobile: normalized.Mobile });
    if (existingMobile) {
      return res.status(400).json({
        success: false,
        message: "This mobile number is already registered.",
        fieldErrors: {
          Mobile: "Mobile number already registered. Please use another number.",
        },
      });
    }

    const ZenoPayID = "ZENO-" + Date.now();

    // Upload image to Azure Blob Storage if file is provided
    let imageUrl = null;
    if (file) {
      try {
        imageUrl = await uploadToAzure(file.buffer, file.originalname);
        console.log("Image uploaded to Azure:", imageUrl);
      } catch (uploadError) {
        console.error("Failed to upload image to Azure:", uploadError);
        return res.status(500).json({
          success: false,
          message: "Failed to upload profile image. Please try again.",
        });
      }
    }

    const passwordHash = await bcrypt.hash(normalized.Password, BCRYPT_ROUNDS);

    const newZenoPay = new ZenoPayDetails({
      ZenoPayID,
      Password: passwordHash,
      FullName: normalized.FullName,
      DOB: normalized.DOB,
      Gender: normalized.Gender,
      Mobile: normalized.Mobile,
      Email: normalized.Email,
      FatherName: normalized.FatherName,
      MotherName: normalized.MotherName || "",
      Address: normalized.Address,
      City: normalized.City,
      State: normalized.State,
      Pincode: normalized.Pincode,
      Role: normalized.Role || "user",
      BusinessName: normalized.BusinessName || "",
      ImagePath: imageUrl, // Store Azure Blob URL instead of local path
    });

    await newZenoPay.save();

    // Send Email (optional)
    try {
      await emailService.sendZenoPayRegistrationEmail(
        normalized.Email,
        normalized.FullName,
        ZenoPayID
      );
    } catch (emailError) {
      console.log("Email sending failed:", emailError);
    }

    res.json({
      success: true,
      message: "Registration successful.",
      ZenoPayID,
    });
  } catch (err) {
    console.log("Registration error:", err);

    // Handle duplicate key errors
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Account already exists with this information.",
      });
    }

    // Handle validation errors
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        message: messages.join(", ") || "Please check your input and try again.",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
};

const VerifyZenoPayId = async (req, res) => {
  const { zenoPayId } = req.body;
  console.log("Verifying ZenoPay ID:", zenoPayId);

  try {
    const user = await ZenoPayDetails.findOne({ ZenoPayID: zenoPayId });

    if (user) {
      return res.status(200).json({
        success: true,
        message: "ZenoPay ID verified successfully!",
        details: {
          FullName: user.FullName,
          DOB: user.DOB,
          Gender: user.Gender,
          Mobile: user.Mobile,
          Email: user.Email,
          City: user.City,
          State: user.State,
          Pincode: user.Pincode,
        },
      });
    } else {
      return res.status(404).json({
        success: false,
        message: "ZenoPay ID not found in database.",
      });
    }
  } catch (err) {
    console.log(err);
    res
      .status(500)
      .json({ success: false, message: "Server error during verification." });
  }
};

module.exports = {
  getRegisterZenoPay,
  postRegisterZenoPay,
  VerifyZenoPayId,
};
