const User = require('../models/userModel');

module.exports = async function isAdmin(req, res, next) {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ error: 'User ID required' });

    const user = await User.findByPk(userId);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ error: 'Access denied: Not an admin' });
    }

    next();
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};
