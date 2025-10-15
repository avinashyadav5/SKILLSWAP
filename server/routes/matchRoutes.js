// server/routes/matchRoutes.js
const express = require('express');
const { Op } = require('sequelize');
const User = require('../models/userModel');

const router = express.Router();

function getAvatarUrl(user) {
  if (user.avatar) {
    return `${process.env.BASE_URL || 'http://localhost:5000'}/uploads/${user.avatar}`;
  }
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`;
}

// GET matches for a user
router.get('/:userId', async (req, res) => {
  try {
    const currentUser = await User.findByPk(req.params.userId);
    if (!currentUser) return res.status(404).json({ error: 'User not found' });

    const currentTeach = Array.isArray(currentUser.teach)
      ? currentUser.teach
      : JSON.parse(currentUser.teach || '[]');
    const currentLearn = Array.isArray(currentUser.learn)
      ? currentUser.learn
      : JSON.parse(currentUser.learn || '[]');

    const allOthers = await User.findAll({ where: { id: { [Op.ne]: currentUser.id } } });

    const matches = allOthers
      .map(u => {
        const uTeach = Array.isArray(u.teach) ? u.teach : JSON.parse(u.teach || '[]');
        const uLearn = Array.isArray(u.learn) ? u.learn : JSON.parse(u.learn || '[]');

        const canLearnFrom = currentLearn.filter(s => uTeach.includes(s));
        const canTeachTo = currentTeach.filter(s => uLearn.includes(s));

        if (canLearnFrom.length || canTeachTo.length) {
          return {
            id: u.id,
            name: u.name,
            email: u.email,
            avatar: getAvatarUrl(u),
            teach: uTeach,
            learn: uLearn,
            canLearnFrom,
            canTeachTo,
          };
        }
        return null;
      })
      .filter(Boolean);

    res.json(matches);
  } catch (err) {
    console.error('Match error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
