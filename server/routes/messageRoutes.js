// routes/messageRoutes.js
const express = require('express');
const router = express.Router();
const Message = require('../models/messageModel');
const { Op } = require('sequelize');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload folder exists
const uploadDir = path.join(__dirname, '../uploads/chat');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage for chat images
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) =>
    cb(null, `msg_${Date.now()}${path.extname(file.originalname)}`)
});
const upload = multer({ storage });

// ✅ POST /api/messages - Save text + images
router.post('/', upload.array('images', 5), async (req, res) => {
  try {
    const { senderId, receiverId, text } = req.body;
    const imageFiles = req.files ? req.files.map((f) => f.filename) : [];

    const saved = await Message.create({
      senderId,
      receiverId,
      text: text || '',
      images: imageFiles, // thanks to getter/setter, auto stringifies
    });

    // Format for response
    const formatted = saved.toJSON();

    // Emit parsed message via socket
    if (global.io) {
      global.io.to(receiverId.toString()).emit('receive_message', formatted);
      global.io.to(senderId.toString()).emit('receive_message', formatted);
    }

    res.status(201).json(formatted);
  } catch (err) {
    console.error('❌ Failed to save message:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ✅ GET /api/messages/:user1/:user2 - Fetch all messages
router.get('/:user1/:user2', async (req, res) => {
  const { user1, user2 } = req.params;
  try {
    const messages = await Message.findAll({
      where: {
        [Op.or]: [
          { senderId: user1, receiverId: user2 },
          { senderId: user2, receiverId: user1 },
        ],
      },
      order: [['createdAt', 'ASC']],
    });

    res.json(messages.map(m => m.toJSON()));
  } catch (err) {
    console.error('❌ Error fetching messages:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
