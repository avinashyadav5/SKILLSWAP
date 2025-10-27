const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { registerUser, loginUser } = require('../controllers/userController');
const User = require('../models/userModel');

const router = express.Router();

// ✅ Utility: Build full avatar URL (local or deployed)
function getAvatarUrl(user) {
  if (user.avatar) {
    return `${process.env.BASE_URL || 'http://localhost:5000'}/uploads/${user.avatar}`;
  }
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}`;
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

// ✅ Upload avatar
router.post('/avatar/:id', upload.single('avatar'), async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Delete old avatar if exists
    if (user.avatar) {
      const oldPath = path.join(__dirname, '..', 'uploads', user.avatar);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    user.avatar = req.file.filename;
    await user.save();

    res.json({
      success: true,
      avatar: getAvatarUrl(user),
    });
  } catch (err) {
    console.error('Avatar upload error:', err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// ✅ Delete avatar
router.delete('/avatar/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user || !user.avatar) return res.status(404).json({ error: 'No avatar found' });

    const filePath = path.join(__dirname, '..', 'uploads', user.avatar);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    user.avatar = '';
    await user.save();

    res.json({
      success: true,
      message: 'Avatar removed',
      avatar: getAvatarUrl(user),
    });
  } catch (err) {
    console.error('Avatar delete error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ================= SUBJECTS =================
router.get('/:id/subjects', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ teachSubjects: user.teach || [], learnSubjects: user.learn || [] });
  } catch (err) {
    console.error('Subjects fetch error:', err);
    res.status(500).json({ error: 'Fetch subjects failed' });
  }
});

// ✅ Add teach subject
router.post('/:id/teach', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const subject = req.body.subjectName?.trim();
    if (!subject) return res.status(400).json({ error: 'Subject required' });

    if (!user.teach.includes(subject)) {
      user.teach = [...(user.teach || []), subject];
      await user.save();
    }

    res.json({ teachSubjects: user.teach });
  } catch (err) {
    console.error('Add teach error:', err);
    res.status(500).json({ error: 'Add teach failed' });
  }
});

// ✅ Remove teach subject
router.delete('/:id/teach/:subjectName', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.teach = (user.teach || []).filter(s => s !== req.params.subjectName);
    await user.save();

    res.json({ teachSubjects: user.teach });
  } catch (err) {
    console.error('Remove teach error:', err);
    res.status(500).json({ error: 'Remove teach failed' });
  }
});

// ✅ Add learn subject
router.post('/:id/learn', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const subject = req.body.subjectName?.trim();
    if (!subject) return res.status(400).json({ error: 'Subject required' });

    if (!user.learn.includes(subject)) {
      user.learn = [...(user.learn || []), subject];
      await user.save();
    }

    res.json({ learnSubjects: user.learn });
  } catch (err) {
    console.error('Add learn error:', err);
    res.status(500).json({ error: 'Add learn failed' });
  }
});

// ✅ Remove learn subject
router.delete('/:id/learn/:subjectName', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.learn = (user.learn || []).filter(s => s !== req.params.subjectName);
    await user.save();

    res.json({ learnSubjects: user.learn });
  } catch (err) {
    console.error('Remove learn error:', err);
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
