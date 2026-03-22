const express = require("express");
const router = express.Router();

const authRoutes = require("./authRoutes");
const userRoutes = require("./userRoutes");
const merchantRoutes = require("./merchantRoutes");
const adminRoutes = require("./adminRoutes");
const apiRoutes = require("./apiRoutes");

// Preserve existing route behavior/order while splitting by domain
router.use(authRoutes);
router.use(userRoutes);
router.use(merchantRoutes);
router.use(adminRoutes);
router.use(apiRoutes);

module.exports = router;
