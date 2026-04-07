const CashbackRule = require("../../Models/CashbackRule");

exports.listRules = async (req, res) => {
  try {
    const rules = await CashbackRule.find().sort({ createdAt: -1 }).lean();
    return res.json({ success: true, rules });
  } catch (error) {
    console.error("[Admin Cashback] listRules failed:", error);
    return res.status(500).json({ success: false, message: "Failed to load cashback rules" });
  }
};

exports.createRule = async (req, res) => {
  try {
    const {
      ruleType = "flat_percent",
      percent,
      maxCashback = 0,
      minTransactionAmount = 0,
      isActive = true,
      validFrom,
      validUntil,
    } = req.body || {};

    if (!Number.isFinite(Number(percent)) || Number(percent) <= 0) {
      return res.status(400).json({ success: false, message: "percent must be greater than 0" });
    }

    const created = await CashbackRule.create({
      ruleType,
      percent: Number(percent),
      maxCashback: Number(maxCashback || 0),
      minTransactionAmount: Number(minTransactionAmount || 0),
      isActive: Boolean(isActive),
      validFrom: validFrom ? new Date(validFrom) : new Date(),
      validUntil: validUntil ? new Date(validUntil) : null,
    });

    return res.status(201).json({ success: true, rule: created });
  } catch (error) {
    console.error("[Admin Cashback] createRule failed:", error);
    return res.status(500).json({ success: false, message: "Failed to create cashback rule" });
  }
};

exports.toggleRule = async (req, res) => {
  try {
    const rule = await CashbackRule.findById(req.params.id);
    if (!rule) {
      return res.status(404).json({ success: false, message: "Rule not found" });
    }

    rule.isActive = !rule.isActive;
    await rule.save();

    return res.json({ success: true, rule });
  } catch (error) {
    console.error("[Admin Cashback] toggleRule failed:", error);
    return res.status(500).json({ success: false, message: "Failed to toggle rule" });
  }
};
