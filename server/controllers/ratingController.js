// server/controllers/ratingController.js
// ✅ Fixed: was incorrectly a Sequelize model definition — moved to actual controller logic
// The real Rating model is in server/models/ratingModel.js

const Rating = require('../models/ratingModel');
const { Sequelize } = require('sequelize');

// POST a new rating
exports.createRating = async (req, res) => {
  const { raterId, ratedId, stars, review } = req.body;
  if (!raterId || !ratedId || !stars) {
    return res.status(400).json({ error: 'raterId, ratedId, and stars are required' });
  }
  if (stars < 1 || stars > 5) {
    return res.status(400).json({ error: 'Stars must be between 1 and 5' });
  }
  try {
    const newRating = await Rating.create({ raterId, ratedId, stars, review });
    res.status(201).json(newRating);
  } catch (err) {
    console.error('❌ Failed to submit rating:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// GET average rating for a user
exports.getAverageRating = async (req, res) => {
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
};

// GET ratings for a user
exports.getRatings = async (req, res) => {
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
};
