const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

// ✅ Get All Users (Admin-only)
router.get('/users', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });

  const token = authHeader.split(' ')[1];
  try {
    const { userId } = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await User.findByPk(userId);
    if (!admin || !admin.isAdmin) return res.status(403).json({ error: 'Forbidden' });

    const users = await User.findAll({ attributes: { exclude: ['password'] } });
    res.json(users);
  } catch (err) {
    res.status(403).json({ error: 'Invalid token' });
  }
});

// ✅ Fixed: Toggle admin role (was called from frontend but route was missing)
router.put('/toggle/:id', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });

  const token = authHeader.split(' ')[1];
  try {
    const { userId } = jwt.verify(token, process.env.JWT_SECRET);
    const requester = await User.findByPk(userId);
    if (!requester || !requester.isAdmin) return res.status(403).json({ error: 'Forbidden' });

    const target = await User.findByPk(req.params.id);
    if (!target) return res.status(404).json({ error: 'User not found' });

    // Prevent admin from removing their own admin status
    if (target.id === requester.id) {
      return res.status(400).json({ error: 'Cannot change your own admin status' });
    }

    target.isAdmin = !target.isAdmin;
    await target.save();

    res.json({ message: `User ${target.isAdmin ? 'promoted to' : 'removed from'} admin`, isAdmin: target.isAdmin });
  } catch (err) {
    res.status(403).json({ error: 'Invalid token' });
  }
});

module.exports = router;