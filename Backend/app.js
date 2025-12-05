require("dotenv").config();
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);

const PORT = process.env.PORT || 3000;``
const DB_PATH = process.env.MONGO_URI;


app.enable("trust proxy");


const store = new MongoDBStore({
  uri: DB_PATH,
  collection: "sessions",
});


app.use(cors({
  origin: true,
  credentials: true
}));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "Hey are you a developer?",
    resave: false,
    saveUninitialized: false,
    store,
    cookie: {
      httpOnly: true,
      secure: true, // always false in local development; set to true on hosting 
      sameSite: "lax",
    },
  })
);

app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.isLoggedIn = req.session.isLoggedIn || false;
  next();
});


app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());


app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));


app.use(require("./Routes/routes"));


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
