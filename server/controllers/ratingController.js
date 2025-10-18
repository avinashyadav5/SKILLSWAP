const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./userModel');

const Rating = sequelize.define('Rating', {
  raterId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  ratedId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  stars: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1, max: 5 },
  },
  review: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
});

Rating.belongsTo(User, { as: 'rater', foreignKey: 'raterId' });
Rating.belongsTo(User, { as: 'rated', foreignKey: 'ratedId' });

module.exports = Rating;
