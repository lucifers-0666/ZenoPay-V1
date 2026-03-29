const express = require("express");
const PinController = require("../Controllers/PinController");

const router = express.Router();

router.get("/set", PinController.getSetPin);
router.post("/set", PinController.setPin);
router.post("/verify", PinController.verifyPin);

module.exports = router;
