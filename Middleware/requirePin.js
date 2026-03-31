const requirePin = (req, res, next) => {
  if (!req.session?.user) {
    return res.redirect("/login");
  }

  const pinVerified = req.session.pinVerified === true;
  const expiresAt = Number(req.session.pinVerifiedExpiresAt || 0);
  const stillValid = pinVerified && expiresAt > Date.now();

  if (stillValid) {
    return next();
  }

  req.session.pinVerified = false;
  req.session.pinVerifiedExpiresAt = null;

  const intendedUrl = req.originalUrl || req.url || "/dashboard";
  req.session.intendedUrl = intendedUrl;

  const accept = String(req.headers?.accept || "").toLowerCase();
  const expectsJson =
    req.xhr ||
    req.is("application/json") ||
    accept.includes("application/json") ||
    String(req.path || "").startsWith("/api/");

  if (expectsJson) {
    return res.status(403).json({
      success: false,
      message: "Transaction PIN verification required",
      redirect: "/verify-pin",
    });
  }

  return res.redirect("/verify-pin");
};

module.exports = requirePin;
