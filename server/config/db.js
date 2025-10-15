const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('skillswap', 'skillswap_user', 'pass123', {
  host: 'localhost',
  dialect: 'postgres',
  logging: false,
});

module.exports = sequelize;
