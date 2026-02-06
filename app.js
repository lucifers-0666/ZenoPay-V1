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

// ============ SESSION STORE SETUP WITH FALLBACK ============
let store = null;
let usingMemoryStore = false;

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
    });

    // Handle store errors gracefully without crashing
    store.on("error", (error) => {
      console.warn("⚠️  Session store error:", error.message);
      console.warn("⚠️  Sessions using fallback memory store");
      usingMemoryStore = true;
    });

    store.on("connected", () => {
      console.log("✓ Session store: MongoDB persistent storage");
      usingMemoryStore = false;
    });
  } catch (error) {
    console.warn("⚠️  MongoDB session store initialization failed:", error.message);
    console.warn("⚠️  Using memory store (sessions restart on server restart)");
    store = null;
    usingMemoryStore = true;
  }
} else {
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
  proxy: true,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? "none" : "lax",
    maxAge: 1000 * 60 * 60 * 24, // 24 hours
  },
};

// Add MongoDB store if available, otherwise use default memory store
if (store) {
  sessionConfig.store = store;
}

app.use(session(sessionConfig));

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

// Attach RBAC permissions to all requests
const { attachPermissions } = require("./Admin/Middleware/rbacMiddleware");
app.use(attachPermissions);

// QR Code generation middleware
app.use(async (req, res, next) => {
  if (req.session.user && !req.session.qrCode) {
    const user = req.session.user;
    const fixedUrl = `https://zenopay.me/pay/${user.ZenoPayId}`;
    req.session.qrCode = await generateQRWithLogo(fixedUrl);
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

// ============ MONGODB CONNECTION WITH RETRY LOGIC ============
const connectDB = async () => {
  if (!DB_PATH || DB_PATH === 'your_mongodb_connection_string') {
    console.error("⚠️  MongoDB URI not configured in .env file");
    console.error("⚠️  Server starting without database (limited functionality)");
    return false;
  }

  const maxRetries = 3;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      await mongoose.connect(DB_PATH, {
        serverSelectionTimeoutMS: 30000, // Increased from 5000ms to 30000ms
        socketTimeoutMS: 45000,
        connectTimeoutMS: 30000,
        maxPoolSize: 10,
        minPoolSize: 5,
      });
      console.log("✓ MongoDB Connected Successfully");
      return true;
    } catch (err) {
      retries++;
      console.error(`❌ MongoDB connection attempt ${retries}/${maxRetries} failed:`);
      console.error(`   ${err.message}`);
      
      if (retries < maxRetries) {
        const delay = 2000 * retries; // 2s, 4s, 6s
        console.log(`⏳ Retrying in ${delay/1000}s...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        console.error("\n⚠️  MongoDB connection failed after", maxRetries, "attempts");
        console.error("⚠️  Possible reasons:");
        console.error("   • MongoDB Atlas IP whitelist not configured (add 0.0.0.0/0 for testing)");
        console.error("   • Invalid credentials in MONGO_URI");
        console.error("   • Network/firewall blocking connection");
        console.error("   • MongoDB Atlas cluster paused/deleted");
        console.error("\n⚠️  Server starting in DEGRADED MODE (database features disabled)\n");
      }
    }
  }
  
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

// ============ START SERVER ============
(async () => {
  console.log("\n" + "=".repeat(60));
  console.log("🚀 ZenoPay Application Starting...");
  console.log("=".repeat(60) + "\n");

  const dbConnected = await connectDB();
  
  app.listen(PORT, () => {
    console.log("\n" + "=".repeat(60));
    console.log(`✅ Server Status: RUNNING`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log(`📊 Database: ${dbConnected ? '✅ Connected to MongoDB' : '⚠️  Disconnected (degraded mode)'}`);
    console.log(`🔒 Sessions: ${!usingMemoryStore && store ? '✅ MongoDB (persistent)' : '⚠️  Memory (clears on restart)'}`);
    console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log("=".repeat(60) + "\n");
    
    if (!dbConnected) {
      console.log("⚠️  IMPORTANT: Running without database connection!");
      console.log("⚠️  To fix: Check MongoDB URI in .env file\n");
    }
  });
})();

// ============ GRACEFUL SHUTDOWN ============
process.on('SIGTERM', async () => {
  console.log('\n⏹️  SIGTERM received, shutting down gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\n⏹️  SIGINT received, shutting down gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});