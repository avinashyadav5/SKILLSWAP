const express = require('express');
const router = express.Router();
const SkillProgress = require('../models/skillProgressModel');

// GET progress for a user
router.get('/:userId', async (req, res) => {
  try {
    const progress = await SkillProgress.findAll({
      where: { userId: req.params.userId },
    });
    res.json(progress);
  } catch (err) {
    console.error('Fetch Skill Progress Error:', err);
    res.status(500).json({ error: 'Failed to fetch skill progress' });
  }
});

// POST update/create progress
router.post('/', async (req, res) => {
  const { userId, subject, type, status } = req.body;
  
  if (!['teach', 'learn'].includes(type) || !['not_started', 'in_progress', 'completed'].includes(status)) {
    return res.status(400).json({ error: 'Invalid type or status' });
  }

  try {
    const [progress] = await SkillProgress.upsert(
      { userId, subject, type, status },
      { returning: true }
    );
    res.json(progress);
  } catch (err) {
    console.error('Update Skill Progress Error:', err);
    res.status(500).json({ error: 'Failed to update skill progress' });
  }
});

module.exports = router;
