const express = require("express");
const PinController = require("../Controllers/PinController");
const UserPinController = require("../Controllers/UserPinController");

const router = express.Router();

router.get("/set", (req, res) => res.redirect("/user/set-pin"));
router.post("/set", UserPinController.postSetPin);
router.post("/verify", PinController.verifyPin);

module.exports = router;
