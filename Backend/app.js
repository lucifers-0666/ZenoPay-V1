require("dotenv").config();
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);

// PORT for Azure + fallback for local
const PORT = process.env.PORT || 3000;

// Database URI from Azure environment variables
const DB_PATH = process.env.MONGO_URI;

// Required for trusting Azure proxy (HTTPS redirects + secure cookies)
app.enable("trust proxy");

// Session store in MongoDB
const store = new MongoDBStore({
  uri: DB_PATH,
  collection: "sessions",
});

// CORS setup (works for local & Azure)
app.use(
  cors({
    origin: true, // Automatically allows the requesting origin
    credentials: true, // Allows cookies to be sent
  })
);

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || "Hey are you a developer?",
    resave: false,
    saveUninitialized: false,
    store,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Azure: true | Local: false
      sameSite: "lax",
    },
  })
);

// Make session data available to all views
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.isLoggedIn = req.session.isLoggedIn || false;
  next();
});

// Middleware for static files and body parsing
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// EJS setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Routes
app.use(require("./Routes/routes"));

// MongoDB connection + server start
mongoose
  .connect(DB_PATH)
  .then(() => {
    console.log("Database Connected");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.log("Error while connecting:", err);
  });
