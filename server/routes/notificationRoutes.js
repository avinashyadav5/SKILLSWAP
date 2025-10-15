const express = require("express");
const router = express.Router();
const {
  createNotification,
  getNotifications,
  markAsRead,
  toggleMute,
} = require("../controllers/notificationController");

// ✅ POST notification
router.post("/", createNotification);

// ✅ GET notifications for a user
router.get("/:userId", getNotifications);

// ✅ Mark single notification as read
router.patch("/read/:id", markAsRead);

// ✅ Toggle mute
router.post("/mute/:userId", toggleMute);

module.exports = router;
