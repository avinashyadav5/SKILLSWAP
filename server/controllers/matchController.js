const { Op } = require('sequelize');
const User = require('../models/userModel');
const Match = require('../models/matchModel'); // ✅ Import Match model

exports.getMatches = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Find potential matches
    const matches = await User.findAll({
      where: {
        id: { [Op.ne]: user.id },
        teach: { [Op.overlap]: user.learn },
        learn: { [Op.overlap]: user.teach },
      },
    });

    // For each match, insert into Matches table if not already there
    for (const m of matches) {
      const exists = await Match.findOne({
        where: {
          [Op.or]: [
            { user1Id: user.id, user2Id: m.id },
            { user1Id: m.id, user2Id: user.id },
          ],
        },
      });

      if (!exists) {
        await Match.create({ user1Id: user.id, user2Id: m.id });
      }
      matchedUsers.push(match);
    }
    res.json(matches);
  } catch (err) {
    console.error('Error fetching matches:', err);
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
};
