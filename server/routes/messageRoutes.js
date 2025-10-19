// routes/messageRoutes.js
const express = require('express');
const router = express.Router();
const Message = require('../models/messageModel');
const { Op } = require('sequelize');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// === 1️⃣ Ensure upload folder exists ===
const uploadDir = path.join(__dirname, '..', 'uploads', 'chat');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// === 2️⃣ Multer storage: save only filenames ===
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const safeName = `msg_${Date.now()}${path.extname(file.originalname)}`;
    cb(null, safeName);
  },
});

const upload = multer({ storage });

// === 3️⃣ POST /api/messages (text + images) ===
router.post('/', upload.array('images', 5), async (req, res) => {
  try {
    const { senderId, receiverId, text } = req.body;

    // 🧠 IMPORTANT: Only save the filename, not any subfolder prefix.
    const imageFiles = req.files ? req.files.map((f) => path.basename(f.filename)) : [];

    const saved = await Message.create({
      senderId,
      receiverId,
      text: text || '',
      images: imageFiles, // Sequelize handles array (JSON or TEXT)
    });

    const formatted = saved.toJSON();

    // 🧠 Send to both sender and receiver via socket
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

// === 4️⃣ GET /api/messages/:user1/:user2 ===
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

    // Ensure images are parsed as array (for TEXT columns)
    const formatted = messages.map((m) => {
      const msg = m.toJSON();
      if (typeof msg.images === 'string') {
        try {
          msg.images = JSON.parse(msg.images);
        } catch {
          msg.images = msg.images ? [msg.images] : [];
        }
      }
      return msg;
    });

    res.json(formatted);
  } catch (err) {
    console.error('❌ Error fetching messages:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
