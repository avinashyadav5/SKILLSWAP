const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./userModel');

class SkillProgress extends Model {}

SkillProgress.init(
  {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    subject: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('teach', 'learn'),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('not_started', 'in_progress', 'completed'),
      defaultValue: 'not_started',
    },
  },
  {
    sequelize,
    modelName: 'SkillProgress',
    indexes: [
      {
        unique: true,
        fields: ['userId', 'subject', 'type'],
      },
    ],
  }
);

SkillProgress.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(SkillProgress, { foreignKey: 'userId' });

module.exports = SkillProgress;
