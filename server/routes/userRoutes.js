// server/routes/userRoutes.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { registerUser, loginUser } = require('../controllers/userController');
const User = require('../models/userModel');

const router = express.Router();

// Utility: Avatar URL
function getAvatarUrl(user) {
  if (user.avatar) {
    return `${process.env.BASE_URL || 'http://localhost:5000'}/uploads/${user.avatar}`;
  }
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`;
}

// ================= AUTH =================
router.post('/register', registerUser);
router.post('/login', loginUser);

// ================= PROFILE UPDATE =================
router.put('/:id', async (req, res) => {
  try {
    const { name, email, bio, social } = req.body;
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.name = name ?? user.name;
    user.email = email ?? user.email;
    user.bio = bio ?? user.bio;
    user.social = social ?? user.social;
    await user.save();

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      bio: user.bio,
      social: user.social,
      avatar: getAvatarUrl(user),
      teach: user.teach,
      learn: user.learn,
    });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ================= AVATAR UPLOAD =================
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) =>
    cb(null, `avatar_${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage });

// Upload avatar
router.post('/avatar/:id', upload.single('avatar'), async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.avatar) {
      const oldPath = path.join(__dirname, '..', 'uploads', user.avatar);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    user.avatar = req.file.filename;
    await user.save();

    res.json({ avatar: getAvatarUrl(user) });
  } catch (err) {
    console.error('Avatar upload error:', err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Delete avatar
router.delete('/avatar/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user || !user.avatar) return res.status(404).json({ error: 'No avatar' });

    const filePath = path.join(__dirname, '..', 'uploads', user.avatar);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    user.avatar = '';
    await user.save();
    res.json({ message: 'Avatar removed', avatar: getAvatarUrl(user) });
  } catch (err) {
    console.error('Remove avatar error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ================= SUBJECTS =================
router.get('/:id/subjects', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ teachSubjects: user.teach || [], learnSubjects: user.learn || [] });
  } catch {
    res.status(500).json({ error: 'Fetch subjects failed' });
  }
});

router.post('/:id/teach', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!user.teach.includes(req.body.subjectName)) {
      user.teach = [...(user.teach || []), req.body.subjectName];
      await user.save();
    }

    res.json({ teachSubjects: user.teach });
  } catch {
    res.status(500).json({ error: 'Add teach failed' });
  }
});

router.delete('/:id/teach/:subjectName', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.teach = (user.teach || []).filter(s => s !== req.params.subjectName);
    await user.save();
    res.json({ teachSubjects: user.teach });
  } catch {
    res.status(500).json({ error: 'Remove teach failed' });
  }
});

router.post('/:id/learn', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!user.learn.includes(req.body.subjectName)) {
      user.learn = [...(user.learn || []), req.body.subjectName];
      await user.save();
    }

    res.json({ learnSubjects: user.learn });
  } catch {
    res.status(500).json({ error: 'Add learn failed' });
  }
});

router.delete('/:id/learn/:subjectName', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.learn = (user.learn || []).filter(s => s !== req.params.subjectName);
    await user.save();
    res.json({ learnSubjects: user.learn });
  } catch {
    res.status(500).json({ error: 'Remove learn failed' });
  }
});

// ================= GET SINGLE USER =================
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: getAvatarUrl(user),
      teach: user.teach || [],
      learn: user.learn || [],
      bio: user.bio,
      social: user.social,
    });
  } catch (err) {
    console.error('User fetch error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
