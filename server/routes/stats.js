const express = require('express');
const router = express.Router();
const { User, Message, Rating } = require('../models');
const { Op } = require('sequelize');

router.get('/', async (req, res) => {
  try {
    const users = await User.findAll();

    let matchCount = 0;
    for (let i = 0; i < users.length; i++) {
      for (let j = i + 1; j < users.length; j++) {
        const u1 = users[i];
        const u2 = users[j];

        const u1_teach = u1.teach || [];
        const u1_learn = u1.learn || [];
        const u2_teach = u2.teach || [];
        const u2_learn = u2.learn || [];

        const isMatch =
          u1_teach.some(skill => u2_learn.includes(skill)) &&
          u2_teach.some(skill => u1_learn.includes(skill));

        if (isMatch) matchCount++;
      }
    }

    const messageCount = await Message.count();
    const ratingResult = await Rating.findAll({
      attributes: [
        [require('sequelize').fn('AVG', require('sequelize').col('stars')), 'avgRating']
      ],
      raw: true
    });
    const avgRating = parseFloat(ratingResult[0].avgRating) || 0;

    res.json({
      users: users.length,
      matches: matchCount,
      messages: messageCount,
      rating: avgRating
    });
  } catch (err) {
    console.error('❌ Error in stats route:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
