const express = require("express");
const router = express.Router();
const {
  createNotification,
  getNotifications,
  markAsRead,
  getUnreadCount,
  toggleMute,
} = require("../controllers/notificationController");

router.post("/", createNotification);
router.get("/:userId", getNotifications);
router.patch("/read/:id", markAsRead);
router.get("/unread/:userId", getUnreadCount);
router.post("/mute/:userId", toggleMute);

module.exports = router;
