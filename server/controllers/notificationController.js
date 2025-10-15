const Notification = require('../models/notificationModel');

// ✅ Create notification
exports.createNotification = async (req, res) => {
  const { userId, message } = req.body;
  try {
    const note = await Notification.create({ userId, message });

    // Real-time push only if user not muted
    if (global.io) {
      global.io.to(userId.toString()).emit("notification", {
        id: note.id,
        message: note.message,
        createdAt: note.createdAt,
      });
    }

    res.status(201).json(note);
  } catch (err) {
    console.error("Create Notification Error:", err);
    res.status(500).json({ error: "Failed to create notification" });
  }
};

// ✅ Get notifications for user
exports.getNotifications = async (req, res) => {
  const userId = req.params.userId;
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

// ✅ Toggle mute (server-side)
let mutedUsers = new Set();

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

// Helper for backend to check before pushing notifications
exports.isMuted = (userId) => mutedUsers.has(userId.toString());
