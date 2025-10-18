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
    const { userId } = jwt.verify(token,  process.env.JWT_SECRET);
    const admin = await User.findByPk(userId);
    if (!admin || !admin.isAdmin) return res.status(403).json({ error: 'Forbidden' });

    const users = await User.findAll();
    res.json(users);
  } catch (err) {
    res.status(403).json({ error: 'Invalid token' });
  }
});

module.exports = router;