const Notification = require("../Models/Notification");

const getNotifications = async (req, res) => {
  try {
    if (!req.session.isLoggedIn || !req.session.user) {
      return res.redirect("/login");
    }

    const zenoPayId = req.session.user.ZenoPayID;
    const notifications = await Notification.find({ ZenoPayId: zenoPayId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.render("notifications", {
      notifications,
      user: req.session.user,
      isLoggedIn: true,
      qrCode: req.session.qrCode || null,
      currentPage: "notifications",
      pageTitle: "Notifications",
    });
  } catch (err) {
    console.error("Error fetching notifications:", err);
    res.redirect("/dashboard");
  }
};

const getNotificationCount = async (req, res) => {
  try {
    if (!req.session.isLoggedIn || !req.session.user) {
      return res.status(401).json({ success: false });
    }

    const zenoPayId = req.session.user.ZenoPayID;
    const count = await Notification.countDocuments({
      ZenoPayId: zenoPayId,
      IsRead: false,
    });

    res.status(200).json({ success: true, count });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error fetching count" });
  }
};

const getRecentNotifications = async (req, res) => {
  try {
    if (!req.session.isLoggedIn || !req.session.user) {
      return res.status(401).json({ success: false });
    }

    const zenoPayId = req.session.user.ZenoPayID;
    const notifications = await Notification.find({ ZenoPayId: zenoPayId })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    res.status(200).json({ success: true, notifications });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error fetching data" });
  }
};

const markAsRead = async (req, res) => {
  try {
    if (!req.session.isLoggedIn || !req.session.user) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    const zenoPayId = req.session.user.ZenoPayID;

    // Mark all unread notifications as read for this user
    await Notification.updateMany(
      { ZenoPayId: zenoPayId, IsRead: false },
      { IsRead: true }
    );

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Error in markAsRead:", err);
    res.status(500).json({ success: false, message: "Error marking notifications as read" });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    if (!req.session.isLoggedIn || !req.session.user) {
      return res.redirect("/login");
    }

    const zenoPayId = req.session.user.ZenoPayID;

    await Notification.updateMany(
      { ZenoPayId: zenoPayId, IsRead: false },
      { IsRead: true }
    );

    res.redirect("/notifications");
  } catch (err) {
    console.error("Error in markAllAsRead:", err);
    res.redirect("/notifications");
  }
};

const deleteReadNotifications = async (req, res) => {
  try {
    if (!req.session.isLoggedIn || !req.session.user) {
      return res.redirect("/login");
    }

    const zenoPayId = req.session.user.ZenoPayID;
    await Notification.deleteMany({
      ZenoPayId: zenoPayId,
      IsRead: true,
    });

    res.redirect("/notifications");
  } catch (err) {
    console.error("Error in deleteReadNotifications:", err);
    res.redirect("/notifications");
  }
};

module.exports = {
  getNotifications,
  getNotificationCount,
  getRecentNotifications,
  markAsRead,
  markAllAsRead,
  deleteReadNotifications,
};
