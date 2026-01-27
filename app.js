require("dotenv").config();

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const generateQRWithLogo = require("./Services/generateQR");

const PORT = process.env.PORT || 3000;
const DB_PATH = process.env.MONGO_URI;

app.set("trust proxy", 1);

const store = new MongoDBStore({
  uri: DB_PATH,
  collection: "sessions",
});

store.on("error", (error) => {
  console.error("Session Store Error:", error);
});

app.use(
  cors({})
);

app.use(
  session({
    name: "zenopay.sid",
    secret: process.env.SESSION_SECRET || "default_secret",
    resave: false,
    saveUninitialized: false,
    store,
    proxy: true, 
    cookie: {
      httpOnly: true,       
      secure: true,        
      sameSite: "none",      
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Admin static files
app.use("/admin/assets", express.static(path.join(__dirname, "Admin/Public")));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Add admin views path
app.set("views", [
  path.join(__dirname, "views"),
  path.join(__dirname, "Admin/Views")
]);

app.use(async (req, res, next) => {
  if (req.session.user && !req.session.qrCode) {
    const user = req.session.user;
    const fixedUrl = `https://zenopay.me/pay/${user.ZenoPayId}`;
    req.session.qrCode = await generateQRWithLogo(fixedUrl);
  }
  next();
});

// Admin routes - AUTHENTICATION TEMPORARILY DISABLED
console.log("Debugging: Loading Admin Routes...");
app.use("/admin", (req, res, next) => {
  console.log(`[Admin Access] ${req.method} ${req.url}`);
  
  // Create fake admin session for all admin routes (TEMPORARY - FOR DESIGN REVIEW)
  if (!req.session.user) {
    req.session.isLoggedIn = true;
    req.session.user = {
      ZenoPayID: "ZP-ADMIN001",
      FullName: "System Administrator",
      Email: "admin@zenopay.com",
      Role: "admin",
      ImagePath: ""
    };
    console.log("[Admin Session] Fake session created for design review");
  }
  
  next();
}, require("./Admin/Routes/adminRoutes"));

// User routes
app.use(require("./Routes/routes"));

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

mongoose
  .connect(DB_PATH)
  .then(() => {
    console.log("MongoDB Connected");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });