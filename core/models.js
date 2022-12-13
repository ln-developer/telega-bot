const sequelize = require('../db');
const { DataTypes } = require('sequelize');

const Gamer = sequelize.define('gamer', {
    id: { type: DataTypes.INTEGER, primaryKey: true, unique: true, autoIncrement: true },
    chatId: { type: DataTypes.INTEGER, unique: true },
    name: { type: DataTypes.STRING },
    hobby: { type: DataTypes.STRING, defaultValue: '' }
})

module.exports = Gamer;
