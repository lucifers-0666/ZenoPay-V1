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

// Session store with fallback
let store;
try {
  store = new MongoDBStore({
    uri: DB_PATH,
    collection: "sessions",
    connectionOptions: {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    },
  });

  store.on("error", (error) => {
    console.error("❌ Session Store Error:", error.message);
    console.error("⚠️  Sessions may not persist correctly");
  });

  store.on("connected", () => {
    console.log("✓ Session store connected to MongoDB");
  });
} catch (error) {
  console.error("❌ Failed to initialize MongoDB session store:", error.message);
  console.warn("⚠️  Falling back to memory store (sessions will not persist)");
  store = null;
}

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

// Prevent favicon.ico 404 noise
app.get("/favicon.ico", (req, res) => res.status(204).end());

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

// MongoDB connection with retry logic and graceful degradation
const connectDB = async () => {
  const maxRetries = 5;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      await mongoose.connect(DB_PATH, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });
      console.log("✓ MongoDB Connected Successfully");
      return true;
    } catch (err) {
      retries++;
      console.error(`❌ MongoDB connection attempt ${retries}/${maxRetries} failed:`, err.message);
      
      if (retries < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, retries), 10000);
        console.log(`⏳ Retrying in ${delay/1000}s...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  console.error("⚠️  Could not connect to MongoDB after", maxRetries, "attempts");
  console.error("⚠️  Server starting in degraded mode - database features disabled");
  return false;
};

// Handle MongoDB connection events
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected. Attempting to reconnect...');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err.message);
});

mongoose.connection.on('reconnected', () => {
  console.log('✓ MongoDB reconnected');
});

// Start server with or without DB connection
(async () => {
  const dbConnected = await connectDB();
  
  app.listen(PORT, () => {
    console.log(`\n🚀 Server running on port ${PORT}`);
    console.log(`📊 Database status: ${dbConnected ? '✓ Connected' : '❌ Disconnected (degraded mode)'}`);
    console.log(`🔒 Session store: ${dbConnected ? '✓ MongoDB' : '⚠️  Memory (not persistent)'}\n`);
  });
})();