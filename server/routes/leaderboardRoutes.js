const express = require('express');
const router = express.Router();
const User = require('../models/userModel');
const Rating = require('../models/ratingModel');
const { Sequelize } = require('sequelize');

// Add association dynamically to avoid circular dependencies
User.hasMany(Rating, { foreignKey: 'ratedId', as: 'ratings_received' });
Rating.belongsTo(User, { foreignKey: 'ratedId', as: 'ratedUser' });

// GET top users by rating
router.get('/', async (req, res) => {
  try {
    const topUsers = await User.findAll({
      attributes: {
        include: [
          [
            Sequelize.fn('AVG', Sequelize.col('ratings_received.stars')),
            'avgRating'
          ]
        ],
        exclude: ['password']
      },
      include: [
        {
          model: Rating,
          as: 'ratings_received', // Need to check if this association alias exists
          attributes: []
        }
      ],
      group: ['User.id'],
      order: [[Sequelize.literal('"avgRating"'), 'DESC']],
      limit: 10,
      subQuery: false
    });

    res.json(topUsers);
  } catch (err) {
    console.error('Leaderboard fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

module.exports = router;
