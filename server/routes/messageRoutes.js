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
// ✅ Fixed: Added MIME type validation
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

const fileFilter = (req, file, cb) => {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed.'), false);
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const safeName = `msg_${Date.now()}${path.extname(file.originalname)}`;
    cb(null, safeName);
  },
});

// ✅ Fixed: Added fileFilter and size/count limits
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 5 }, // 5MB max, 5 files max
});

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
    const io = req.app.locals.io;
    if (io) {
      io.to(receiverId.toString()).emit('receive_message', formatted);
      io.to(senderId.toString()).emit('receive_message', formatted);
    }

    res.status(201).json(formatted);
  } catch (err) {
    console.error('❌ Failed to save message:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// === 4️⃣ GET /api/messages/:user1/:user2 ===
// ✅ Fixed: Added pagination — default limit 50, configurable via ?limit=&offset=
router.get('/:user1/:user2', async (req, res) => {
  const { user1, user2 } = req.params;
  const limit = Math.min(parseInt(req.query.limit) || 50, 100);
  const offset = parseInt(req.query.offset) || 0;
  try {
    const messages = await Message.findAll({
      where: {
        [Op.or]: [
          { senderId: user1, receiverId: user2 },
          { senderId: user2, receiverId: user1 },
        ],
      },
      order: [['createdAt', 'ASC']],
      limit,
      offset,
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
