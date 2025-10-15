const User = require('./userModel');
const Match = require('./matchModel');
const Message = require('./messageModel'); // if needed
const Rating = require('./ratingModel');   // if needed

// Optional associations if required
 //Match.belongsTo(User, { as: 'user1', foreignKey: 'user1Id' });
 //Match.belongsTo(User, { as: 'user2', foreignKey: 'user2Id' });

module.exports = { User, Match, Message, Rating };
