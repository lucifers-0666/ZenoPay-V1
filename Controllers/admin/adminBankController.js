const mongoose = require("mongoose");
const Bank = require("../../Models/Bank");

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(String(id || "").trim());

exports.banksList = async (req, res) => {
  try {
    const { search = "", status = "all", type = "all" } = req.query;

    const query = {};
    if (status && status !== "all") query.status = status;
    if (type && type !== "all") query.type = type;
    if (search) {
      query.$or = [
        { bankName: { $regex: search, $options: "i" } },
        { ifscPrefix: { $regex: search, $options: "i" } },
        { bankCode: { $regex: search, $options: "i" } },
      ];
    }

    const [banks, totalCount, activeCount, upiCount, upiModeCount, neftModeCount, rtgsModeCount, impsModeCount] =
      await Promise.all([
        Bank.find(query).sort({ priority: 1, createdAt: -1 }).lean(),
        Bank.countDocuments(query),
        Bank.countDocuments({ ...query, status: "active" }),
        Bank.countDocuments({ ...query, upiEnabled: true }),
        Bank.countDocuments({ ...query, upiEnabled: true }),
        Bank.countDocuments({ ...query, neftEnabled: true }),
        Bank.countDocuments({ ...query, rtgsEnabled: true }),
        Bank.countDocuments({ ...query, impsEnabled: true }),
      ]);

    res.locals.adminPage = "banks";
    return res.render("admin/banks/admin-banks", {
      banks,
      totalCount,
      activeCount,
      upiCount,
      inactiveCount: Math.max(0, totalCount - activeCount),
      modeCoverage: {
        upi: upiModeCount,
        neft: neftModeCount,
        rtgs: rtgsModeCount,
        imps: impsModeCount,
      },
      filters: { search, status, type },
      pageTitle: "Banks",
      page: "banks",
      adminPage: "banks",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).send("Server Error");
  }
};

exports.addBank = async (req, res) => {
  try {
    const {
      bankName,
      bankCode,
      ifscPrefix,
      type,
      upiEnabled,
      neftEnabled,
      rtgsEnabled,
      impsEnabled,
      priority,
      logoUrl,
    } = req.body;

    const cleanCode = String(bankCode || "").trim().toUpperCase();
    if (!bankName || !cleanCode) {
      return res.status(400).json({ success: false, message: "Bank name and code are required" });
    }

    const existing = await Bank.findOne({ bankCode: cleanCode }).lean();
    if (existing) {
      return res.status(400).json({ success: false, message: "Bank code already exists" });
    }

    await Bank.create({
      bankName: String(bankName).trim(),
      bankCode: cleanCode,
      ifscPrefix: String(ifscPrefix || "").trim().toUpperCase(),
      type: type || "public",
      upiEnabled: String(upiEnabled) === "true" || upiEnabled === true,
      neftEnabled: String(neftEnabled) === "true" || neftEnabled === true,
      rtgsEnabled: String(rtgsEnabled) === "true" || rtgsEnabled === true,
      impsEnabled: String(impsEnabled) === "true" || impsEnabled === true,
      priority: Number.parseInt(priority, 10) || 99,
      logoUrl: String(logoUrl || "").trim(),
      status: "pending",
      updatedAt: new Date(),
    });

    return res.json({ success: true, message: "Bank added successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.pendingBanks = async (req, res) => {
  try {
    const { search = "" } = req.query;

    const query = { status: "pending" };
    if (search) {
      query.$or = [
        { bankName: { $regex: search, $options: "i" } },
        { bankCode: { $regex: search, $options: "i" } },
        { ifscPrefix: { $regex: search, $options: "i" } },
      ];
    }

    const [banks, totalPending, pendingToday, rejectedCount, approvedCount] = await Promise.all([
      Bank.find(query).sort({ createdAt: -1 }).lean(),
      Bank.countDocuments({ status: "pending" }),
      Bank.countDocuments({
        status: "pending",
        createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      }),
      Bank.countDocuments({ status: "rejected" }),
      Bank.countDocuments({ status: "active" }),
    ]);

    res.locals.adminPage = "banks";
    return res.render("admin/banks/admin-pending-banks", {
      banks,
      totalPending,
      pendingToday,
      rejectedCount,
      approvedCount,
      filters: { search: search || "" },
      pageTitle: "Pending Banks",
      page: "banks",
      adminPage: "banks",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).send("Server Error");
  }
};

exports.approveBank = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid bank id" });
    }

    const { adminNote } = req.body || {};
    const bank = await Bank.findByIdAndUpdate(
      req.params.id,
      {
        status: "active",
        approvedAt: new Date(),
        adminNote: adminNote || "",
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!bank) return res.status(404).json({ success: false, message: "Bank not found" });
    return res.json({ success: true, message: "Bank approved successfully" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.rejectBank = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid bank id" });
    }

    const { reason, notes } = req.body || {};
    const bank = await Bank.findByIdAndUpdate(
      req.params.id,
      {
        status: "rejected",
        rejectionReason: reason || "Rejected by admin",
        rejectionNotes: notes || "",
        rejectedAt: new Date(),
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!bank) return res.status(404).json({ success: false, message: "Bank not found" });
    return res.json({ success: true, message: "Bank rejected" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.bankInfo = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(404).json({});
    }
    const bank = await Bank.findById(req.params.id).lean();
    return res.json(bank || {});
  } catch (e) {
    return res.status(500).json({});
  }
};

exports.updateStatus = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid bank id" });
    }

    const { status } = req.body;
    const bank = await Bank.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: new Date() },
      { new: true }
    );

    if (!bank) return res.status(404).json({ success: false, message: "Bank not found" });
    return res.json({ success: true, message: `Bank ${status} successfully` });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.updatePriority = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid bank id" });
    }

    const { priority } = req.body;
    await Bank.findByIdAndUpdate(req.params.id, {
      priority: Number.parseInt(priority, 10) || 99,
      updatedAt: new Date(),
    });

    return res.json({ success: true, message: "Priority updated" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.updateBank = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid bank id" });
    }

    const body = req.body || {};
    const patch = { updatedAt: new Date() };

    if (body.bankName !== undefined) patch.bankName = String(body.bankName || "").trim();
    if (body.bankCode !== undefined) patch.bankCode = String(body.bankCode || "").trim().toUpperCase();
    if (body.ifscPrefix !== undefined) patch.ifscPrefix = String(body.ifscPrefix || "").trim().toUpperCase();
    if (body.type !== undefined) patch.type = body.type;
    if (body.logoUrl !== undefined) patch.logoUrl = String(body.logoUrl || "").trim();
    if (body.priority !== undefined) patch.priority = Number.parseInt(body.priority, 10) || 99;
    if (body.status !== undefined) patch.status = body.status;
    if (body.upiEnabled !== undefined) patch.upiEnabled = String(body.upiEnabled) === "true" || body.upiEnabled === true;
    if (body.neftEnabled !== undefined) patch.neftEnabled = String(body.neftEnabled) === "true" || body.neftEnabled === true;
    if (body.rtgsEnabled !== undefined) patch.rtgsEnabled = String(body.rtgsEnabled) === "true" || body.rtgsEnabled === true;
    if (body.impsEnabled !== undefined) patch.impsEnabled = String(body.impsEnabled) === "true" || body.impsEnabled === true;

    const bank = await Bank.findByIdAndUpdate(req.params.id, patch, { new: true });
    if (!bank) return res.status(404).json({ success: false, message: "Bank not found" });

    return res.json({ success: true, message: "Bank updated successfully", bank });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.deleteBank = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid bank id" });
    }

    const bank = await Bank.findByIdAndDelete(req.params.id);
    if (!bank) return res.status(404).json({ success: false, message: "Bank not found" });
    return res.json({ success: true, message: "Bank deleted successfully" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
