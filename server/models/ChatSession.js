const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ChatSession = sequelize.define('ChatSession', {
  title: {
    type: DataTypes.STRING,
    defaultValue: 'New Chat',
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  timestamps: true,
});

module.exports = ChatSession;
