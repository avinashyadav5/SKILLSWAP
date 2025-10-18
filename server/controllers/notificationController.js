// backend/controllers/notificationController.js
const Notification = require("../models/notificationModel");

let mutedUsers = new Set();

// ✅ Create notification
exports.createNotification = async (req, res) => {
  const { userId, message } = req.body;
  try {
    const note = await Notification.create({ userId, message, read: false });

    if (global.io && !mutedUsers.has(userId)) {
      global.io.to(userId.toString()).emit("notification", note);
    }

    res.status(201).json(note);
  } catch (err) {
    console.error("Create Notification Error:", err);
    res.status(500).json({ error: "Failed to create notification" });
  }
};

// ✅ Get all notifications
exports.getNotifications = async (req, res) => {
  const { userId } = req.params;
  try {
    const notes = await Notification.findAll({
      where: { userId },
      order: [["createdAt", "DESC"]],
    });
    res.json(notes);
  } catch (err) {
    console.error("Fetch Notification Error:", err);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
};

// ✅ Mark as read
exports.markAsRead = async (req, res) => {
  const { id } = req.params;
  try {
    await Notification.update({ read: true }, { where: { id } });
    res.json({ success: true });
  } catch (err) {
    console.error("Mark As Read Error:", err);
    res.status(500).json({ error: "Failed to update notification" });
  }
};

// ✅ Get unread count
exports.getUnreadCount = async (req, res) => {
  const { userId } = req.params;
  try {
    const count = await Notification.count({ where: { userId, read: false } });
    res.json({ count });
  } catch (err) {
    console.error("Unread count error:", err);
    res.status(500).json({ error: "Failed to get unread count" });
  }
};

// ✅ Toggle mute
exports.toggleMute = (req, res) => {
  const { userId } = req.params;
  if (mutedUsers.has(userId)) {
    mutedUsers.delete(userId);
    return res.json({ muted: false });
  } else {
    mutedUsers.add(userId);
    return res.json({ muted: true });
  }
};

// ✅ Helper
exports.isMuted = (userId) => mutedUsers.has(userId.toString());
