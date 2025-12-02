require("dotenv").config();
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);

app.enable("trust proxy");

// ------------------------
// CONFIG
// ------------------------
const PORT = process.env.PORT || 3000;
const DB_PATH = process.env.MONGO_URI;

// ------------------------
// SESSION STORE
// ------------------------
const store = new MongoDBStore({
  uri: DB_PATH,
  collection: "sessions",
});

// ------------------------
// MIDDLEWARES
// ------------------------
app.use(cors());

app.use(
  session({
    secret: process.env.SESSION_SECRET || "default_secret_key",
    resave: false,
    saveUninitialized: false,
    store,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // HTTPS only in production
      sameSite: "lax",
    },
  })
);

app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.isLoggedIn = req.session.isLoggedIn || false;
  next();
});

// Static + Body Parsing
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// EJS Views
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Routes
app.use(require("./Routes/routes"));

// ------------------------
// DATABASE CONNECT + SERVER START
// ------------------------
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
