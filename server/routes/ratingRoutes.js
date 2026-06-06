// routes/ratingRoutes.js
const express = require('express');
const router = express.Router();
const Rating = require('../models/ratingModel');
const User = require('../models/userModel');
const { Sequelize } = require('sequelize');

// POST a new rating
router.post('/', async (req, res) => {
  const { raterId, ratedId, stars, review } = req.body;
  try {
    const newRating = await Rating.create({ raterId, ratedId, stars, review });
    res.status(201).json(newRating);
  } catch (err) {
    console.error('❌ Failed to submit rating:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Static routes first to avoid routing conflicts

// GET ratings with rater and rated user names (last 10)
router.get('/with-users', async (req, res) => {
  try {
    const result = await Rating.findAll({
      attributes: ['id', 'review', 'stars', 'createdAt'],
      include: [
        {
          model: User,
          as: 'rater',
          attributes: ['id', 'name'],
        },
        {
          model: User,
          as: 'rated',
          attributes: ['id', 'name'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: 10,
    });
    res.json(result);
  } catch (err) {
    console.error('❌ Error fetching ratings with users:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET average rating for a user
router.get('/average/:ratedId', async (req, res) => {
  try {
    const result = await Rating.findAll({
      where: { ratedId: req.params.ratedId },
      attributes: [[Sequelize.fn('AVG', Sequelize.col('stars')), 'avgStars']],
    });
    const avgStars = parseFloat(result[0].dataValues.avgStars || 0).toFixed(1);
    res.json({ avgStars });
  } catch (err) {
    console.error('❌ Failed to calculate average rating:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Dynamic route last to prevent conflicts
router.get('/:ratedId', async (req, res) => {
  try {
    const ratings = await Rating.findAll({
      where: { ratedId: req.params.ratedId },
      order: [['createdAt', 'DESC']],
    });
    res.json(ratings);
  } catch (err) {
    console.error('❌ Error fetching ratings:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
