const { Sequelize } = require('sequelize');

module.exports = new Sequelize(
    'telega_bot_db',
    'admin',
    'admin',
    {
        host: '185.10.187.140',
        port: '6432',
        dialect: 'postgres'
    }
)
