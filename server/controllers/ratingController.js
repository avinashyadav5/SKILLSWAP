const { Rating } = require('../models/ratingModels');
const { User } = require('../models'); 

exports.getRatingsWithUsers = async (req, res) => {
  try {
    const ratings = await Rating.findAll({
      include: [
        { model: User, as: 'rater', attributes: ['id', 'name'] },
        { model: User, as: 'rated', attributes: ['id', 'name'] },
      ],
    });
    res.json(ratings);
  } catch (err) {
    console.error('Error fetching ratings:', err);
    res.status(500).json({ error: 'Failed to fetch ratings' });
  }
};
