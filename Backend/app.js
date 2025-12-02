const express = require("express");
const app = express();
const PORT = 3000;
const routes = require("./Routes/routes");
const DB_PATH =
  "mongodb+srv://root:sahashok@aa2.hrda1.mongodb.net/BankSystem?retryWrites=true&w=majority&appName=AA2";
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const store = new MongoDBStore({
  uri: DB_PATH,
  collection: "sessions",
});
app.use(cors());

app.use(
  session({
    secret: "I like to code in NodeJS",
    resave: false,
    saveUninitialized: false,
    store,
    cookie: {
      httpOnly: true,
      path: "/",
      secure: false,
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
app.use(routes);
mongoose
  .connect(DB_PATH)
  .then(() => {
    console.log("Database Connected");
    app.listen(PORT, () => {
      console.log(`Server is running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.log("Error while connecting");
  });
