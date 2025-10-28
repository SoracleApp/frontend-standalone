import { DataTypes } from 'sequelize';
import sequelize from '../db/index.js';

const Token = sequelize.define('Token', {
    tokenaddress: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    deployer: {
        type: DataTypes.STRING,
        allowNull: false
    },
    name: DataTypes.STRING,
    symbol: DataTypes.STRING,
    supply: DataTypes.STRING, // Changed to STRING to match TEXT in SQL
    image_url: DataTypes.STRING
}, {
    timestamps: true,
    underscored: true
});

export default Token;
