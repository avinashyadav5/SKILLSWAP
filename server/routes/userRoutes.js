const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { registerUser, loginUser } = require('../controllers/userController');
const User = require('../models/userModel');
const { normalizeSkills } = require('../services/geminiService');
const { authenticateToken } = require('../middleware/auth');

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
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    // Ownership check: only the logged-in user can update their own profile
    if (parseInt(req.params.id) !== req.userId) {
      return res.status(403).json({ error: 'Forbidden: cannot edit another user\'s profile' });
    }

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

// ✅ Upload avatar (auth required)
router.post('/avatar/:id', authenticateToken, upload.single('avatar'), async (req, res) => {
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

// ✅ Delete avatar (auth required)
router.delete('/avatar/:id', authenticateToken, async (req, res) => {
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

// ✅ Add teach subject (auth required, ownership enforced)
router.post('/:id/teach', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    let subject = req.body.subjectName?.trim().toLowerCase();
    if (!subject) return res.status(400).json({ error: 'Subject required' });

    if (!user.teach.includes(subject)) {
      const normalized = await normalizeSkills([subject]);
      const normSubject = normalized[0] || subject;

      user.set('teach', [...(user.teach || []), subject]);
      user.set('teach_normalized', [...(user.teach_normalized || []), normSubject]);
      
      user.changed('teach', true);
      user.changed('teach_normalized', true);
      await user.save();
    }

    res.json({ teachSubjects: user.teach });
  } catch (err) {
    console.error('Add teach error:', err);
    res.status(500).json({ error: 'Add teach failed' });
  }
});

// ✅ Remove teach subject (auth required)
router.delete('/:id/teach/:subjectName', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const subjectName = req.params.subjectName;
    const indexToRemove = (user.teach || []).indexOf(subjectName);
    
    if (indexToRemove !== -1) {
      const newTeach = [...user.teach];
      newTeach.splice(indexToRemove, 1);
      
      // Re-normalize from scratch to ensure no orphaned synonyms
      const newTeachNorm = await normalizeSkills(newTeach);
      
      user.set('teach', newTeach);
      user.set('teach_normalized', newTeachNorm);
      user.changed('teach', true);
      user.changed('teach_normalized', true);
      await user.save();
    }

    res.json({ teachSubjects: user.teach });
  } catch (err) {
    console.error('Remove teach error:', err);
    res.status(500).json({ error: 'Remove teach failed' });
  }
});

// ✅ Add learn subject (auth required)
router.post('/:id/learn', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    let subject = req.body.subjectName?.trim().toLowerCase();
    if (!subject) return res.status(400).json({ error: 'Subject required' });

    if (!user.learn.includes(subject)) {
      const normalized = await normalizeSkills([subject]);
      const normSubject = normalized[0] || subject;

      user.set('learn', [...(user.learn || []), subject]);
      user.set('learn_normalized', [...(user.learn_normalized || []), normSubject]);
      
      user.changed('learn', true);
      user.changed('learn_normalized', true);
      await user.save();
    }

    res.json({ learnSubjects: user.learn });
  } catch (err) {
    console.error('Add learn error:', err);
    res.status(500).json({ error: 'Add learn failed' });
  }
});

// ✅ Remove learn subject (auth required)
router.delete('/:id/learn/:subjectName', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const subjectName = req.params.subjectName;
    const indexToRemove = (user.learn || []).indexOf(subjectName);
    
    if (indexToRemove !== -1) {
      const newLearn = [...user.learn];
      newLearn.splice(indexToRemove, 1);
      
      const newLearnNorm = await normalizeSkills(newLearn);
      
      user.set('learn', newLearn);
      user.set('learn_normalized', newLearnNorm);
      user.changed('learn', true);
      user.changed('learn_normalized', true);
      await user.save();
    }

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
