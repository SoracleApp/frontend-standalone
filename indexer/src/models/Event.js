const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Event = sequelize.define('Event', {
    marketId: {
        type: DataTypes.STRING,
        allowNull: false,
        index: true
    },
    creator: {
        type: DataTypes.STRING,
        allowNull: false
    },
    timestamp: {
        type: DataTypes.STRING,
        allowNull: false
    },
    transactionHash: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    blockNumber: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    indexes: [
        {
            unique: true,
            fields: ['transactionHash']
        },
        {
            fields: ['marketId']
        }
    ]
});

module.exports = Event;
