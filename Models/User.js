// Backward-compatibility alias:
// This project uses `ZenoPayUser` as the canonical user model.
// Keep this shim to avoid breaking older imports of `Models/User`.
const User = require("./ZenoPayUser");

module.exports = User;
