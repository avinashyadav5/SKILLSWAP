const Message = require("../models/messageModel");
const Notification = require("../models/notificationModel");
const { isMuted } = require("./notificationController");

exports.sendMessage = async (req, res) => {
  try {
    const { senderId, receiverId, text } = req.body;

    if (!text?.trim()) return res.status(400).json({ error: "Message empty" });

    const msg = await Message.create({ senderId, receiverId, text });

    // Send real-time chat
    if (global.io) {
      global.io.to(receiverId.toString()).emit("receive_message", msg);
    }

    // ✅ Create unread notification
    if (global.io && !isMuted(receiverId)) {
      const note = await Notification.create({
        userId: receiverId,
        message: `💬 New message from user ${senderId}`,
        read: false,
      });

      global.io.to(receiverId.toString()).emit("notification", note);
    }

    res.status(201).json(msg);
  } catch (err) {
    console.error("Send Message Error:", err);
    res.status(500).json({ error: "Failed to send message" });
  }
};
