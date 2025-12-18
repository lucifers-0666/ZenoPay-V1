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

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(async (req, res, next) => {
  if (req.session.user && !req.session.qrCode) {
    const user = req.session.user;
    const fixedUrl = `https://zenopay.me/pay/${user.ZenoPayId}`;
    req.session.qrCode = await generateQRWithLogo(fixedUrl);
  }
  next();
});

app.use(require("./Routes/routes"));

mongoose
  .connect(DB_PATH)
  .then(() => {
    console.log("MongoDB Connected");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });