// server/routes/matchRoutes.js
// ✅ Fixed: now uses Op.overlap at DB level instead of fetching all users + JS filtering
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

const SYNONYMS = {
  'ml': ['machine learning', 'artificial intelligence'],
  'machine learning': ['machine learning', 'artificial intelligence'],
  'ai': ['artificial intelligence', 'machine learning'],
  'artificial intelligence': ['artificial intelligence', 'machine learning'],
  'js': ['javascript', 'web development'],
  'javascript': ['javascript', 'web development'],
  'ts': ['typescript', 'web development', 'javascript'],
  'typescript': ['typescript', 'web development', 'javascript'],
  'react': ['react', 'frontend web development', 'javascript'],
  'reactjs': ['react', 'frontend web development', 'javascript'],
  'node': ['nodejs', 'backend web development', 'javascript'],
  'nodejs': ['nodejs', 'backend web development', 'javascript'],
  'mern': ['mern stack', 'full stack web development', 'react', 'nodejs', 'mongodb', 'express'],
  'full stack': ['full stack web development', 'frontend web development', 'backend web development'],
  'full stack web development': ['full stack web development', 'frontend web development', 'backend web development'],
  'python': ['python', 'backend web development', 'data science'],
  'py': ['python', 'backend web development', 'data science'],
  'c++': ['c++', 'systems programming'],
  'cpp': ['c++', 'systems programming'],
  'java': ['java', 'backend web development', 'enterprise software'],
};

function getExpandedSet(skill) {
  const expanded = new Set([skill.toLowerCase()]);
  if (SYNONYMS[skill.toLowerCase()]) {
    SYNONYMS[skill.toLowerCase()].forEach(syn => expanded.add(syn));
  }
  return Array.from(expanded);
}

// GET matches for a user — ✅ DB-level array overlap using standardized normalized columns
router.get('/:userId', async (req, res) => {
  try {
    const currentUser = await User.findByPk(req.params.userId);
    if (!currentUser) return res.status(404).json({ error: 'User not found' });

    const currentTeach = currentUser.teach || [];
    const currentLearn = currentUser.learn || [];
    const currentTeachNormalized = currentUser.teach_normalized || [];
    const currentLearnNormalized = currentUser.learn_normalized || [];

    if (!currentTeachNormalized.length && !currentLearnNormalized.length) {
      return res.json([]);
    }

    // ✅ Use PostgreSQL Op.overlap with normalized synonyms directly on the database
    const matchedUsers = await User.findAll({
      where: {
        id: { [Op.ne]: currentUser.id },
        [Op.or]: [
          { teach_normalized: { [Op.overlap]: currentLearnNormalized } },  // they teach what I want to learn
          { learn_normalized: { [Op.overlap]: currentTeachNormalized } },  // they want to learn what I teach
        ],
      },
      attributes: { exclude: ['password'] },
    });

    const matches = matchedUsers.map(u => {
      const uTeach = u.teach || [];
      const uLearn = u.learn || [];
      const uTeachNormalized = u.teach_normalized || [];
      const uLearnNormalized = u.learn_normalized || [];

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        avatar: getAvatarUrl(u),
        teach: uTeach,
        learn: uLearn,
        canLearnFrom: currentLearn.filter(s => {
          const expandedS = getExpandedSet(s);
          return expandedS.some(syn => uTeachNormalized.includes(syn));
        }),
        canTeachTo: currentTeach.filter(s => {
          const expandedS = getExpandedSet(s);
          return expandedS.some(syn => uLearnNormalized.includes(syn));
        }),
      };
    });

    res.json(matches);
  } catch (err) {
    console.error('Match error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
