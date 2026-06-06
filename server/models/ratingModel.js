// models/ratingModel.js
const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./userModel');

class Rating extends Model {}

Rating.init(
  {
    raterId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    ratedId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    stars: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },
    review: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Rating',
  }
);

// Associations
Rating.belongsTo(User, { foreignKey: 'raterId', as: 'rater' });
Rating.belongsTo(User, { foreignKey: 'ratedId', as: 'rated' });

module.exports = Rating;
