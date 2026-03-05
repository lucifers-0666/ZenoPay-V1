const mongoose = require("mongoose");
const Announcement = require("../../Models/Announcement");

const toInt = (value, fallback = 1) => {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(String(id || "").trim());

exports.announcementsList = async (req, res) => {
  try {
    const { status = "all", type = "all", page = 1 } = req.query;
    const limit = 10;
    const currentPage = toInt(page, 1);
    const skip = (currentPage - 1) * limit;

    const query = {};
    if (status && status !== "all") query.status = status;
    if (type && type !== "all") query.type = type;

    const [announcements, totalCount, publishedCount, draftCount, scheduledCount] = await Promise.all([
      Announcement.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Announcement.countDocuments(query),
      Announcement.countDocuments({ status: "published" }),
      Announcement.countDocuments({ status: "draft" }),
      Announcement.countDocuments({ status: "scheduled" }),
    ]);

    res.locals.adminPage = "announcements";
    return res.render("admin/announcements/admin-announcements", {
      announcements,
      totalCount,
      publishedCount,
      draftCount,
      scheduledCount,
      currentPage,
      totalPages: Math.max(1, Math.ceil(totalCount / limit)),
      filters: { status, type },
      pageTitle: "Announcements",
      page: "announcements",
      adminPage: "announcements",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).send("Server Error");
  }
};

exports.create = async (req, res) => {
  try {
    const { title, content, type, targetAudience, priority, scheduledAt, status } = req.body;

    await Announcement.create({
      title,
      content,
      type: type || "info",
      targetAudience: targetAudience || "all",
      priority: Number.parseInt(priority, 10) || 3,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      status: status || "draft",
      createdAt: new Date(),
    });

    return res.json({ success: true, message: "Announcement created successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.update = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid announcement id" });
    }

    const { title, content, type, targetAudience, priority, scheduledAt, status } = req.body;
    const patch = {
      title,
      content,
      type,
      targetAudience,
      priority: Number.parseInt(priority, 10) || 3,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      updatedAt: new Date(),
    };

    if (status) patch.status = status;

    const updated = await Announcement.findByIdAndUpdate(req.params.id, patch, { new: true });
    if (!updated) {
      return res.status(404).json({ success: false, message: "Announcement not found" });
    }

    return res.json({ success: true, message: "Announcement updated" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.publish = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid announcement id" });
    }

    const updated = await Announcement.findByIdAndUpdate(
      req.params.id,
      {
        status: "published",
        publishedAt: new Date(),
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Announcement not found" });
    }

    return res.json({ success: true, message: "Announcement published" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.unpublish = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid announcement id" });
    }

    const updated = await Announcement.findByIdAndUpdate(
      req.params.id,
      { status: "draft", updatedAt: new Date() },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Announcement not found" });
    }

    return res.json({ success: true, message: "Moved to draft" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.delete = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid announcement id" });
    }

    const deleted = await Announcement.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Announcement not found" });
    }

    return res.json({ success: true, message: "Announcement deleted" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
