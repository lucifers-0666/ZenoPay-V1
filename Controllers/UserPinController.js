const bcrypt = require("bcryptjs");
const ZenoPayUser = require("../Models/ZenoPayUser");

const SALT_ROUNDS = 12;
const PIN_SESSION_TTL_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 3;
const LOCK_MINUTES = 15;

const pinVerificationTimers = new Map();

const resolveCurrentUser = async (req) => {
  const sessionUser = req.session?.user || {};
  const userId = sessionUser._id || req.session?.userId;

  if (userId) {
    const byId = await ZenoPayUser.findById(userId);
    if (byId) return byId;
  }

  const zenoPayId = sessionUser.ZenoPayID || sessionUser.ZenoPayId || sessionUser.userId;
  const email = sessionUser.Email || sessionUser.email;

  const or = [];
  if (zenoPayId) {
    or.push({ ZenoPayID: zenoPayId }, { userId: zenoPayId });
  }
  if (email) {
    or.push({ Email: email }, { email: String(email).toLowerCase() });
  }

  if (!or.length) return null;
  return ZenoPayUser.findOne({ $or: or });
};

const getPinLockMessage = (user) => {
  if (!user?.pinLockedUntil || new Date(user.pinLockedUntil).getTime() <= Date.now()) {
    return null;
  }

  const minutesLeft = Math.max(
    1,
    Math.ceil((new Date(user.pinLockedUntil).getTime() - Date.now()) / (1000 * 60))
  );

  return `PIN is locked. Try again in ${minutesLeft} minute${minutesLeft > 1 ? "s" : ""}.`;
};

const setPinVerifiedSession = (req) => {
  req.session.pinVerified = true;
  req.session.pinVerifiedExpiresAt = Date.now() + PIN_SESSION_TTL_MS;

  const sid = req.sessionID;
  if (sid && pinVerificationTimers.has(sid)) {
    clearTimeout(pinVerificationTimers.get(sid));
  }

  if (sid) {
    const timer = setTimeout(() => {
      try {
        if (req.session) {
          req.session.pinVerified = false;
          req.session.pinVerifiedExpiresAt = null;
          req.session.save(() => {});
        }
      } catch (error) {
        console.error("[PIN] Failed to expire pinVerified session:", error.message);
      } finally {
        pinVerificationTimers.delete(sid);
      }
    }, PIN_SESSION_TTL_MS);

    pinVerificationTimers.set(sid, timer);
  }
};

const persistPinState = async (user, pinAttempts, pinLockedUntil) => {
  if (!user?._id) return;

  await user.constructor.updateOne(
    { _id: user._id },
    {
      $set: {
        pinAttempts: Number(pinAttempts || 0),
        pinLockedUntil: pinLockedUntil || null,
      },
    }
  );

  user.pinAttempts = Number(pinAttempts || 0);
  user.pinLockedUntil = pinLockedUntil || null;
};

const persistTransactionPin = async (user, hashedPin) => {
  if (!user?._id) return;

  await user.constructor.updateOne(
    { _id: user._id },
    {
      $set: {
        transactionPin: hashedPin,
        isPinSet: true,
        pinAttempts: 0,
        pinLockedUntil: null,
      },
    }
  );

  user.transactionPin = hashedPin;
  user.isPinSet = true;
  user.pinAttempts = 0;
  user.pinLockedUntil = null;
};

const getSetPin = async (req, res) => {
  try {
    const user = await resolveCurrentUser(req);
    const isGuestPreview = process.env.NODE_ENV !== "production" && !user;
    if (!user && !isGuestPreview) return res.redirect("/login");

    if (user?.isPinSet) {
      return res.redirect("/user/change-pin");
    }

    return res.render("user/set-pin", {
      pageTitle: "Set Transaction PIN - ZenoPay",
      user: req.session?.user || user || { FullName: "Guest Preview", ZenoPayID: "ZP-PREVIEW" },
      isLoggedIn: !!req.session?.user,
      previewMode: isGuestPreview,
      errors: {},
      success: null,
    });
  } catch (error) {
    console.error("[PIN] getSetPin error:", error);
    return res.status(500).render("error-500", {
      pageTitle: "Server Error - ZenoPay",
      errorId: `ERR-${Date.now().toString(36).toUpperCase()}`,
    });
  }
};

const postSetPin = async (req, res) => {
  try {
    const user = await resolveCurrentUser(req);
    if (!user) return res.redirect("/login");

    if (user.isPinSet) {
      return res.redirect("/user/change-pin");
    }

    const pin = String(req.body?.pin || "").trim();
    const confirmPin = String(req.body?.confirmPin || "").trim();
    const errors = {};

    if (!/^\d{6}$/.test(pin)) {
      errors.pin = "PIN must be exactly 6 digits.";
    }

    if (!/^\d{6}$/.test(confirmPin)) {
      errors.confirmPin = "Confirm PIN must be exactly 6 digits.";
    }

    if (pin !== confirmPin) {
      errors.confirmPin = "PIN and confirm PIN do not match.";
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).render("user/set-pin", {
        pageTitle: "Set Transaction PIN - ZenoPay",
        user: req.session?.user || user,
        isLoggedIn: !!req.session?.user,
        errors,
        success: null,
      });
    }

    const hashedPin = await bcrypt.hash(pin, SALT_ROUNDS);
    await persistTransactionPin(user, hashedPin);

    req.session.pinVerified = false;
    req.session.pinVerifiedExpiresAt = null;

    return res.redirect("/dashboard?pinSuccess=Transaction%20PIN%20set%20successfully");
  } catch (error) {
    console.error("[PIN] postSetPin error:", error);
    return res.status(500).render("error-500", {
      pageTitle: "Server Error - ZenoPay",
      errorId: `ERR-${Date.now().toString(36).toUpperCase()}`,
    });
  }
};

const getChangePin = async (req, res) => {
  try {
    const user = await resolveCurrentUser(req);
    if (!user) return res.redirect("/login");

    if (!user.isPinSet) {
      return res.redirect("/user/set-pin");
    }

    return res.render("user/change-pin", {
      pageTitle: "Change Transaction PIN - ZenoPay",
      user: req.session?.user || user,
      isLoggedIn: !!req.session?.user,
      errors: {},
      success: null,
    });
  } catch (error) {
    console.error("[PIN] getChangePin error:", error);
    return res.status(500).render("error-500", {
      pageTitle: "Server Error - ZenoPay",
      errorId: `ERR-${Date.now().toString(36).toUpperCase()}`,
    });
  }
};

const postChangePin = async (req, res) => {
  try {
    const user = await resolveCurrentUser(req);
    if (!user) return res.redirect("/login");

    if (!user.isPinSet || !user.transactionPin) {
      return res.redirect("/user/set-pin");
    }

    const currentPin = String(req.body?.currentPin || "").trim();
    const newPin = String(req.body?.newPin || "").trim();
    const confirmPin = String(req.body?.confirmPin || "").trim();

    const errors = {};

    if (!/^\d{6}$/.test(currentPin)) {
      errors.currentPin = "Current PIN must be exactly 6 digits.";
    }

    if (!/^\d{6}$/.test(newPin)) {
      errors.newPin = "New PIN must be exactly 6 digits.";
    }

    if (!/^\d{6}$/.test(confirmPin)) {
      errors.confirmPin = "Confirm PIN must be exactly 6 digits.";
    }

    if (newPin !== confirmPin) {
      errors.confirmPin = "New PIN and confirm PIN do not match.";
    }

    if (Object.keys(errors).length === 0) {
      const matches = await bcrypt.compare(currentPin, user.transactionPin);
      if (!matches) {
        errors.currentPin = "Current PIN is incorrect.";
      }
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).render("user/change-pin", {
        pageTitle: "Change Transaction PIN - ZenoPay",
        user: req.session?.user || user,
        isLoggedIn: !!req.session?.user,
        errors,
        success: null,
      });
    }

    const hashedPin = await bcrypt.hash(newPin, SALT_ROUNDS);
    await persistTransactionPin(user, hashedPin);

    req.session.pinVerified = false;
    req.session.pinVerifiedExpiresAt = null;

    return res.redirect("/dashboard?pinSuccess=Transaction%20PIN%20changed%20successfully");
  } catch (error) {
    console.error("[PIN] postChangePin error:", error);
    return res.status(500).render("error-500", {
      pageTitle: "Server Error - ZenoPay",
      errorId: `ERR-${Date.now().toString(36).toUpperCase()}`,
    });
  }
};

const getVerifyPin = async (req, res) => {
  try {
    const user = await resolveCurrentUser(req);
    const isGuestPreview = process.env.NODE_ENV !== "production" && !user;
    if (!user && !isGuestPreview) return res.redirect("/login");

    if (user && (!user.isPinSet || !user.transactionPin)) {
      return res.redirect("/user/set-pin");
    }

    return res.render("user/verify-pin", {
      pageTitle: "Verify Transaction PIN - ZenoPay",
      user: req.session?.user || user || { FullName: "Guest Preview", ZenoPayID: "ZP-PREVIEW" },
      isLoggedIn: !!req.session?.user,
      previewMode: isGuestPreview,
      error: user ? getPinLockMessage(user) : null,
    });
  } catch (error) {
    console.error("[PIN] getVerifyPin error:", error);
    return res.status(500).render("error-500", {
      pageTitle: "Server Error - ZenoPay",
      errorId: `ERR-${Date.now().toString(36).toUpperCase()}`,
    });
  }
};

const postVerifyPin = async (req, res) => {
  try {
    const user = await resolveCurrentUser(req);
    if (!user) return res.redirect("/login");

    if (!user.isPinSet || !user.transactionPin) {
      return res.redirect("/user/set-pin");
    }

    const submittedPin = String(req.body?.pin || "")
      .replace(/\D/g, "")
      .slice(0, 6);

    if (!/^\d{6}$/.test(submittedPin)) {
      return res.status(400).render("user/verify-pin", {
        pageTitle: "Verify Transaction PIN - ZenoPay",
        user: req.session?.user || user,
        isLoggedIn: !!req.session?.user,
        error: "Please enter a valid 6-digit PIN.",
      });
    }

    if (user.pinLockedUntil && new Date(user.pinLockedUntil).getTime() > Date.now()) {
      return res.status(423).render("user/verify-pin", {
        pageTitle: "Verify Transaction PIN - ZenoPay",
        user: req.session?.user || user,
        isLoggedIn: !!req.session?.user,
        error: getPinLockMessage(user),
      });
    }

    const pinMatches = await bcrypt.compare(submittedPin, user.transactionPin);

    if (!pinMatches) {
      user.pinAttempts = Number(user.pinAttempts || 0) + 1;

      if (user.pinAttempts >= MAX_ATTEMPTS) {
        user.pinLockedUntil = new Date(Date.now() + LOCK_MINUTES * 60 * 1000);
        user.pinAttempts = MAX_ATTEMPTS;
      }

      await persistPinState(user, user.pinAttempts, user.pinLockedUntil);

      const attemptsLeft = Math.max(0, MAX_ATTEMPTS - Number(user.pinAttempts || 0));
      const errorMessage = attemptsLeft > 0
        ? `Invalid PIN. ${attemptsLeft} attempt${attemptsLeft > 1 ? "s" : ""} left.`
        : `Too many wrong attempts. PIN locked for ${LOCK_MINUTES} minutes.`;

      return res.status(400).render("user/verify-pin", {
        pageTitle: "Verify Transaction PIN - ZenoPay",
        user: req.session?.user || user,
        isLoggedIn: !!req.session?.user,
        error: errorMessage,
      });
    }

    await persistPinState(user, 0, null);

    setPinVerifiedSession(req);

    const redirectTo = String(req.session?.intendedUrl || "/dashboard");
    delete req.session.intendedUrl;

    return res.redirect(redirectTo);
  } catch (error) {
    console.error("[PIN] postVerifyPin error:", error);
    return res.status(500).render("error-500", {
      pageTitle: "Server Error - ZenoPay",
      errorId: `ERR-${Date.now().toString(36).toUpperCase()}`,
    });
  }
};

module.exports = {
  getSetPin,
  postSetPin,
  getChangePin,
  postChangePin,
  getVerifyPin,
  postVerifyPin,
};
