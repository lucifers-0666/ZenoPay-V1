const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const generateQRWithLogo = require("./Services/generateQR");
const authRoutes = require("./Routes/authRoutes");
const userRoutes = require("./Routes/userRoutes");
const walletRoutes = require("./Routes/walletRoutes");
const profileRoutes = require("./Routes/profileRoutes");
const pinRoutes = require("./Routes/pinRoutes");
const merchantFeatureRoutes = require("./Routes/merchantRoutes");
const adminApiRoutes = require("./Routes/adminRoutes");
const apiRoutes = require("./Routes/apiRoutes");
const { isAuthenticated: authMiddleware } = require("./Middleware/authGuards");
const expressLayouts = require("express-ejs-layouts");
const {
  startScheduledPaymentsRunner,
  stopScheduledPaymentsRunner,
} = require("./Services/scheduledPaymentsRunner");


const DB_PATH = process.env.MONGO_URI;
const isProduction = process.env.NODE_ENV === "production";
const INACTIVITY_TIMEOUT_MS = Math.max(
  60 * 1000,
  Number(process.env.INACTIVITY_TIMEOUT_MS || 30 * 60 * 1000)
);
const INACTIVITY_WARNING_MS = Math.max(
  30 * 1000,
  Math.min(
    INACTIVITY_TIMEOUT_MS - 1000,
    Number(process.env.INACTIVITY_WARNING_MS || 60 * 1000)
  )
);

app.set("trust proxy", 1);

// ============ SESSION STORE SETUP WITH FALLBACK ============
let store = null;
let usingMemoryStore = false;
let hasLoggedSessionFallback = false;

// Only use MongoDB store if connection string is valid
if (DB_PATH && DB_PATH !== 'your_mongodb_connection_string') {
  try {
    store = new MongoDBStore({
      uri: DB_PATH,
      collection: "sessions",
      connectionOptions: {
        serverSelectionTimeoutMS: 30000, // Increased from 5000ms to 30000ms
        socketTimeoutMS: 45000,
      },
    }, function(error) {
      if (error) {
        console.warn("⚠️  MongoDB session store connection callback error:", error.message);
      }
    });

    // Handle store errors gracefully without crashing
    store.on("error", (error) => {
      if (!hasLoggedSessionFallback) {
        console.warn("⚠️  Session store error:", error.message);
        console.warn("⚠️  Sessions using fallback memory store");
        hasLoggedSessionFallback = true;
      }
      // Sticky fallback: once Mongo session store fails, stay on memory store
      // until the process is restarted.
      usingMemoryStore = true;
    });

    store.on("connected", () => {
      if (!usingMemoryStore) {
        console.log("✓ Session store: MongoDB persistent storage");
      }
    });
  } catch (error) {
    console.warn("⚠️  MongoDB session store initialization failed:", error.message);
    console.warn("⚠️  Using memory store (sessions restart on server restart)");
    store = null;
    usingMemoryStore = true;
  }
} else {
  if (isProduction) {
    console.error("❌ No MongoDB URI configured in production. Refusing to start with memory sessions.");
    process.exit(1);
  }
  console.warn("⚠️  No MongoDB URI configured. Using memory store for sessions.");
  usingMemoryStore = true;
}

app.use(
  cors({})
);

// Session configuration with automatic fallback
const sessionConfig = {
  name: "zenopay.sid",
  secret: process.env.SESSION_SECRET || "zenopay_default_secret_change_in_production",
  resave: false,
  saveUninitialized: false,
  rolling: true,
  proxy: true,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? "none" : "lax",
    maxAge: 1000 * 60 * 60 * 24, // 24 hours
  },
};

const memoryStore = new session.MemoryStore();
const mongoSessionMiddleware = store ? session({ ...sessionConfig, store: store }) : null;
const memorySessionMiddleware = session({ ...sessionConfig, store: memoryStore });

const adminSessionConfig = {
  ...sessionConfig,
  name: "zenopay.admin.sid",
  cookie: {
    ...sessionConfig.cookie,
    path: "/admin",
  },
};

const adminMongoSessionMiddleware = store
  ? session({ ...adminSessionConfig, store: store })
  : null;
const adminMemorySessionMiddleware = session({ ...adminSessionConfig, store: memoryStore });

// Path-aware session dispatcher:
// - /admin* routes use a dedicated admin cookie/session
// - all other routes use the regular user cookie/session
app.use((req, res, next) => {
  const isAdminPath = req.path === "/admin" || req.path.startsWith("/admin/");

  const primaryMiddleware = isAdminPath
    ? (usingMemoryStore || !adminMongoSessionMiddleware ? adminMemorySessionMiddleware : adminMongoSessionMiddleware)
    : (usingMemoryStore || !mongoSessionMiddleware ? memorySessionMiddleware : mongoSessionMiddleware);

  const fallbackMiddleware = isAdminPath ? adminMemorySessionMiddleware : memorySessionMiddleware;

  return primaryMiddleware(req, res, (error) => {
    if (error) {
      if (!hasLoggedSessionFallback) {
        console.warn("⚠️  Session middleware fallback triggered:", error.message);
        console.warn("⚠️  Sessions using fallback memory store");
        hasLoggedSessionFallback = true;
      }
      usingMemoryStore = true;
      return fallbackMiddleware(req, res, next);
    }
    return next();
  });
});

// Auto logout on inactivity for both user and admin sessions
app.use((req, res, next) => {
  if (!req.session) return next();

  const isAdminPath = req.path === "/admin" || req.path.startsWith("/admin/");
  const cookieName = isAdminPath ? "zenopay.admin.sid" : "zenopay.sid";
  const cookiePath = isAdminPath ? "/admin" : "/";
  const loginPath = isAdminPath ? "/admin/login?timeout=1" : "/login?timeout=1";

  const now = Date.now();
  const lastActivityAt = Number(req.session.lastActivityAt || now);
  const isLoggedIn = isAdminPath
    ? !!req.session.admin
    : !!req.session.user;

  if (isLoggedIn && now - lastActivityAt > INACTIVITY_TIMEOUT_MS) {
    return req.session.destroy(() => {
      res.clearCookie(cookieName, { path: cookiePath });

      const acceptsJson =
        req.xhr ||
        String(req.headers.accept || "").includes("application/json") ||
        req.path.startsWith("/api/");

      if (acceptsJson) {
        return res.status(401).json({
          success: false,
          message: "Session expired due to inactivity. Please login again.",
          reason: "INACTIVITY_TIMEOUT",
        });
      }

      return res.redirect(loginPath);
    });
  }

  req.session.lastActivityAt = now;
  return next();
});

// Make auth/session state available to every EJS view by default
app.use((req, res, next) => {
  const isAdminPath = req.path === "/admin" || req.path.startsWith("/admin/");
  const sessionPrincipal = isAdminPath
    ? (req.session?.admin || null)
    : (req.session?.user || null);
  res.locals.user = sessionPrincipal;
  res.locals.isLoggedIn = !!sessionPrincipal;
  res.locals.inactivityTimeoutMs = INACTIVITY_TIMEOUT_MS;
  res.locals.inactivityWarningMs = INACTIVITY_WARNING_MS;
  res.locals.sessionPingUrl = isAdminPath ? "/admin/session/ping" : "/session/ping";
  res.locals.sessionLogoutUrl = isAdminPath ? "/admin/login?timeout=1" : "/login?timeout=1";
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Prevent favicon.ico 404 noise
app.get("/favicon.ico", (req, res) => res.status(204).end());

// Session keep-alive endpoints used by inactivity warning prompt
app.get("/session/ping", (req, res) => {
  if (req.session?.user) {
    req.session.lastActivityAt = Date.now();
    return res.json({ success: true, lastActivityAt: req.session.lastActivityAt });
  }
  return res.status(401).json({ success: false, message: "Not authenticated" });
});

app.get("/admin/session/ping", (req, res) => {
  const adminRole = req.session?.admin?.Role || req.session?.admin?.role;
  if (req.session?.admin && adminRole === "admin") {
    req.session.lastActivityAt = Date.now();
    return res.json({ success: true, lastActivityAt: req.session.lastActivityAt });
  }
  return res.status(401).json({ success: false, message: "Not authenticated" });
});

// Admin static files
app.use("/admin/assets", express.static(path.join(__dirname, "Admin/Public")));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
if (process.env.NODE_ENV !== "production") {
  app.set("view cache", false);
}

// EJS Layouts - admin routes set res.locals.layout in their router middleware
// Non-admin routes use the pass-through views/layout.ejs (just <%- body %>)
app.use(expressLayouts);

// Attach RBAC permissions to all requests
const { attachPermissions } = require("./Admin/Middleware/rbacMiddleware");
app.use(attachPermissions);

// QR Code generation middleware
app.use(async (req, res, next) => {
  if (req.session?.user && !req.session.qrCode) {
    const user = req.session.user;
    const zenopayId = user.ZenoPayID || user.ZenoPayId || user.userId || '';
    const fixedUrl = `https://zenopay.me/pay/${zenopayId}`;
    try {
      req.session.qrCode = await generateQRWithLogo(fixedUrl);
    } catch (err) {
      console.error("QR Code generation failed:", err);
      req.session.qrCode = null;
    }
  }
  next();
});

// ============ ROUTE MOUNTING ============

// Admin routes (with proper authentication)
app.use("/admin", require("./Admin/Routes/adminRoutes"));

// Merchant routes (requires merchant role)
try {
  const merchantRoutes = require("./Merchant/Routes/merchantRoutes");
  app.use("/merchant", merchantRoutes);
  console.log("✓ Merchant routes loaded successfully");
} catch (error) {
  console.warn("⚠ Merchant routes not loaded:", error.message);
}

// User routes
app.use(authRoutes);
app.use("/wallet", authMiddleware, walletRoutes);
app.use("/profile", authMiddleware, profileRoutes);
app.use("/pin", authMiddleware, pinRoutes);
app.use(userRoutes);
app.use(merchantFeatureRoutes);
app.use(adminApiRoutes);
app.use(apiRoutes);

// Error handling middleware
// 404 handler - must be after all other routes
app.use((req, res, next) => {
  res.status(404).render('error-404', {
    pageTitle: '404 - Page Not Found',
    path: req.path
  });
});

// 500 handler - catches all errors
app.use((err, req, res, next) => {
  console.error('Error:', err);
  const errorId = 'ERR-' + Date.now().toString(36).toUpperCase();
  res.status(500).render('error-500', {
    pageTitle: '500 - Server Error',
    errorId: errorId
  });
});



const DB = process.env.MONGO_URI;
const PORT = process.env.PORT || 3000;

mongoose.connect(DB).then(()=>{
  console.log("✓ MongoDB Connected Successfully");
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });

}).catch((err)=>{
  console.error("❌ MongoDB connection failed:", err.message);
  console.error("⚠️  Server starting without database (limited functionality)");
});