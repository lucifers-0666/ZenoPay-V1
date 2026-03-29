const ZenoPayUser = require("../Models/ZenoPayUser");
const Wallet = require("../Models/Wallet");

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

const setFlash = (req, payload) => {
  req.session.profileFlash = payload;
};

const popFlash = (req) => {
  const flash = req.session.profileFlash || null;
  delete req.session.profileFlash;
  return flash;
};

const resolveCurrentUser = async (req) => {
  const id = req.user?._id || req.session?.user?._id;
  if (id) {
    const byId = await ZenoPayUser.findById(id);
    if (byId) return byId;
  }

  const zenoPayId =
    req.session?.user?.ZenoPayID || req.session?.user?.ZenoPayId || req.session?.user?.userId;
  const email = req.session?.user?.Email || req.session?.user?.email;

  const or = [];
  if (zenoPayId) or.push({ ZenoPayID: zenoPayId }, { userId: zenoPayId });
  if (email) or.push({ Email: email }, { email: String(email).toLowerCase() });

  if (!or.length) return null;
  return ZenoPayUser.findOne({ $or: or });
};

const getKycCompletionPercent = (user) => {
  const checks = [
    !!(user?.phone || user?.Mobile),
    !!(user?.dateOfBirth || user?.DOB),
    !!(user?.address || user?.Address),
    !!user?.panNumber,
    !!user?.aadhaarNumber,
  ];

  const complete = checks.filter(Boolean).length;
  return Math.round((complete / checks.length) * 100);
};

const getProfile = async (req, res) => {
  try {
    const currentUser = await resolveCurrentUser(req);
    if (!currentUser) return res.redirect("/login");

    const wallet = await Wallet.findOneAndUpdate(
      { userId: currentUser._id },
      {
        $setOnInsert: {
          userId: currentUser._id,
          balance: 0,
          currency: "INR",
          isActive: true,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res.render("profile/index", {
      pageTitle: "My Profile - ZenoPay",
      isLoggedIn: !!req.session?.isLoggedIn,
      user: req.session?.user || currentUser,
      profileUser: currentUser,
      wallet,
      kycCompletion: getKycCompletionPercent(currentUser),
      flash: popFlash(req),
      errors: {},
    });
  } catch (error) {
    console.error("[Profile] getProfile error:", error);
    return res.status(500).render("error-500", {
      pageTitle: "Server Error - ZenoPay",
      errorId: `ERR-${Date.now().toString(36).toUpperCase()}`,
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const currentUser = await resolveCurrentUser(req);
    if (!currentUser) return res.redirect("/login");

    const { name, phone, dateOfBirth, address } = req.body || {};

    if (typeof name === "string" && name.trim()) {
      currentUser.name = name.trim();
      currentUser.FullName = name.trim();
    }

    if (typeof phone === "string") {
      const normalized = phone.replace(/\D/g, "").slice(-10);
      currentUser.phone = normalized;
      currentUser.Mobile = normalized;
    }

    if (dateOfBirth) {
      const date = new Date(dateOfBirth);
      if (!Number.isNaN(date.getTime())) {
        currentUser.dateOfBirth = date;
        currentUser.DOB = date;
      }
    }

    if (typeof address === "string") {
      currentUser.address = address.trim();
      currentUser.Address = address.trim();
    }

    await currentUser.save();

    req.session.user = {
      ...(req.session.user || {}),
      _id: String(currentUser._id),
      name: currentUser.name || currentUser.FullName,
      Name: currentUser.name || currentUser.FullName,
      FullName: currentUser.FullName || currentUser.name,
      Email: currentUser.Email || currentUser.email,
      email: currentUser.Email || currentUser.email,
      ZenoPayID: currentUser.ZenoPayID || currentUser.userId,
      ZenoPayId: currentUser.ZenoPayID || currentUser.userId,
    };

    setFlash(req, { type: "success", message: "Profile updated successfully." });
    return res.redirect("/profile");
  } catch (error) {
    console.error("[Profile] updateProfile error:", error);
    return res.status(500).render("error-500", {
      pageTitle: "Server Error - ZenoPay",
      errorId: `ERR-${Date.now().toString(36).toUpperCase()}`,
    });
  }
};

const getKYC = async (req, res) => {
  try {
    const currentUser = await resolveCurrentUser(req);
    if (!currentUser) return res.redirect("/login");

    return res.render("profile/kyc", {
      pageTitle: "KYC Verification - ZenoPay",
      isLoggedIn: !!req.session?.isLoggedIn,
      user: req.session?.user || currentUser,
      profileUser: currentUser,
      flash: popFlash(req),
      errors: {},
      form: {},
    });
  } catch (error) {
    console.error("[Profile] getKYC error:", error);
    return res.status(500).render("error-500", {
      pageTitle: "Server Error - ZenoPay",
      errorId: `ERR-${Date.now().toString(36).toUpperCase()}`,
    });
  }
};

const submitKYC = async (req, res) => {
  try {
    const currentUser = await resolveCurrentUser(req);
    if (!currentUser) return res.redirect("/login");

    const { panNumber, dateOfBirth, aadhaarNumber, address } = req.body || {};
    const normalizedPan = String(panNumber || "").trim().toUpperCase();
    const normalizedAadhaar = String(aadhaarNumber || "").replace(/\D/g, "").slice(-4);

    const errors = {};

    if (!PAN_REGEX.test(normalizedPan)) {
      errors.panNumber = "Please enter a valid PAN number.";
    }

    if (!/^\d{4}$/.test(normalizedAadhaar)) {
      errors.aadhaarNumber = "Please enter last 4 digits of Aadhaar.";
    }

    const dobDate = new Date(dateOfBirth);
    if (!dateOfBirth || Number.isNaN(dobDate.getTime())) {
      errors.dateOfBirth = "Please enter a valid date of birth.";
    }

    if (!String(address || "").trim()) {
      errors.address = "Address is required.";
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).render("profile/kyc", {
        pageTitle: "KYC Verification - ZenoPay",
        isLoggedIn: !!req.session?.isLoggedIn,
        user: req.session?.user || currentUser,
        profileUser: currentUser,
        flash: null,
        errors,
        form: {
          panNumber,
          dateOfBirth,
          aadhaarNumber,
          address,
        },
      });
    }

    currentUser.panNumber = normalizedPan;
    currentUser.PANCard = normalizedPan;
    currentUser.dateOfBirth = dobDate;
    currentUser.DOB = dobDate;
    currentUser.aadhaarNumber = normalizedAadhaar;
    currentUser.AadharNumber = normalizedAadhaar;
    currentUser.address = String(address).trim();
    currentUser.Address = String(address).trim();
    currentUser.kycStatus = "submitted";
    currentUser.KYCStatus = "pending";

    await currentUser.save();

    setFlash(req, {
      type: "success",
      message: "KYC submitted successfully. Verification takes 1-2 business days.",
    });

    return res.redirect("/profile");
  } catch (error) {
    console.error("[Profile] submitKYC error:", error);
    return res.status(500).render("error-500", {
      pageTitle: "Server Error - ZenoPay",
      errorId: `ERR-${Date.now().toString(36).toUpperCase()}`,
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getKYC,
  submitKYC,
};
