const hasAuthenticatedUser = (req) => {
  if (!req.session?.user) {
    return false;
  }

  // Self-heal legacy sessions where user exists but isLoggedIn flag wasn't set.
  if (!req.session.isLoggedIn) {
    req.session.isLoggedIn = true;
  }

  return true;
};

const isDevelopmentPreviewEnabled = () => process.env.NODE_ENV !== "production";

const normalizePath = (value = "") => {
  try {
    return String(value).split("?")[0];
  } catch (_) {
    return "";
  }
};

const isPreviewAllowedPath = (req) => {
  if (String(req.method || "GET").toUpperCase() !== "GET") return false;
  if (!isDevelopmentPreviewEnabled()) return false;

  const path = normalizePath(req.originalUrl || req.path || "");

  const exact = new Set([
    "/request-money",
    "/payment-links",
    "/split-requests",
    "/beneficiaries",
    "/send-money",
    "/wallet/send",
    "/user/analytics",
    "/user/cashback",
    "/user/scheduled-payments/history",
    "/user/set-pin",
    "/verify-pin",
    "/create-api-key",
  ]);

  if (exact.has(path)) return true;

  return (
    path.startsWith("/request-money/") ||
    path.startsWith("/pay/request/") ||
    path.startsWith("/pay/") ||
    path.startsWith("/ref/")
  );
};

const isAuthenticated = (req, res, next) => {
  if (isPreviewAllowedPath(req)) {
    return next();
  }

  if (hasAuthenticatedUser(req)) {
    const isVerified = !!(
      req.session?.user?.isEmailVerified ??
      req.session?.user?.EmailVerified
    );

    if (!isVerified) {
      req.session.returnTo = "/dashboard";
      return res.redirect("/verify-email");
    }

    return next();
  }

  return res.redirect("/login");
};

const isAuthenticatedApi = (req, res, next) => {
  if (hasAuthenticatedUser(req)) {
    const isVerified = !!(
      req.session?.user?.isEmailVerified ??
      req.session?.user?.EmailVerified
    );

    if (!isVerified) {
      return res.status(403).json({
        success: false,
        message: "Email verification required",
        redirect: "/verify-email",
      });
    }

    return next();
  }

  return res.status(401).json({ success: false, message: "Authentication required" });
};

// Prevent logged-in users from visiting guest-only auth pages
const redirectIfAuthenticated = (req, res, next) => {
  if (hasAuthenticatedUser(req)) {
    return res.redirect("/dashboard");
  }
  return next();
};

module.exports = {
  isAuthenticated,
  isAuthenticatedApi,
  redirectIfAuthenticated,
  isDevelopmentPreviewEnabled,
};
