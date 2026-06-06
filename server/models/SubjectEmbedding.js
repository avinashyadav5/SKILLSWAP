// server/models/SubjectEmbedding.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const SubjectEmbedding = sequelize.define('SubjectEmbedding', {
  text: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  vector: {
    // store normalized vector
    type: DataTypes.JSONB,
    allowNull: false,
  },
}, {
  indexes: [
    { unique: true, fields: ['text'] },
  ]
});

module.exports = SubjectEmbedding;
