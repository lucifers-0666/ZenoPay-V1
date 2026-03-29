const bcrypt = require("bcryptjs");
const ZenoPayUser = require("../Models/ZenoPayUser");
const { verifyTransactionPinForUser } = require("../utils/transactionPin");

const SALT_ROUNDS = 10;

const setFlash = (req, payload) => {
  req.session.pinFlash = payload;
};

const popFlash = (req) => {
  const flash = req.session.pinFlash || null;
  delete req.session.pinFlash;
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

const getSetPin = async (req, res) => {
  try {
    const currentUser = await resolveCurrentUser(req);
    if (!currentUser) return res.redirect("/login");

    return res.render("pin/set-pin", {
      pageTitle: "Transaction PIN - ZenoPay",
      isLoggedIn: !!req.session?.isLoggedIn,
      user: req.session?.user || currentUser,
      hasPin: !!currentUser.transactionPin,
      errors: {},
      flash: popFlash(req),
    });
  } catch (error) {
    console.error("[PIN] getSetPin error:", error);
    return res.status(500).render("error-500", {
      pageTitle: "Server Error - ZenoPay",
      errorId: `ERR-${Date.now().toString(36).toUpperCase()}`,
    });
  }
};

const setPin = async (req, res) => {
  try {
    const currentUser = await resolveCurrentUser(req);
    if (!currentUser) return res.redirect("/login");

    const pin = String(req.body?.pin || "").trim();
    const confirmPin = String(req.body?.confirmPin || "").trim();

    const errors = {};

    if (!/^\d{6}$/.test(pin)) {
      errors.pin = "PIN must be exactly 6 digits.";
    }

    if (pin !== confirmPin) {
      errors.confirmPin = "PIN and confirmation PIN do not match.";
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).render("pin/set-pin", {
        pageTitle: "Transaction PIN - ZenoPay",
        isLoggedIn: !!req.session?.isLoggedIn,
        user: req.session?.user || currentUser,
        hasPin: !!currentUser.transactionPin,
        errors,
        flash: null,
      });
    }

    currentUser.transactionPin = await bcrypt.hash(pin, SALT_ROUNDS);
    currentUser.pinAttempts = 0;
    currentUser.pinLockedUntil = null;
    await currentUser.save();

    setFlash(req, {
      type: "success",
      message: "Transaction PIN saved successfully.",
    });

    return res.redirect("/pin/set");
  } catch (error) {
    console.error("[PIN] setPin error:", error);
    return res.status(500).render("error-500", {
      pageTitle: "Server Error - ZenoPay",
      errorId: `ERR-${Date.now().toString(36).toUpperCase()}`,
    });
  }
};

const verifyPin = async (req, res) => {
  try {
    const currentUser = await resolveCurrentUser(req);
    if (!currentUser) {
      return res.status(401).json({ valid: false, attemptsLeft: 0 });
    }

    const pin = String(req.body?.pin || "").trim();
    const result = await verifyTransactionPinForUser(currentUser, pin);

    if (result.valid) {
      return res.json({ valid: true });
    }

    return res.status(400).json({
      valid: false,
      attemptsLeft: typeof result.attemptsLeft === "number" ? result.attemptsLeft : 0,
      message: result.message || "Invalid transaction PIN",
      lockedUntil: result.lockedUntil || null,
    });
  } catch (error) {
    console.error("[PIN] verifyPin error:", error);
    return res.status(500).json({ valid: false, attemptsLeft: 0 });
  }
};

module.exports = {
  getSetPin,
  setPin,
  verifyPin,
};
