const { DataTypes } = require("sequelize");
const Instance = require("../instance");
const Users = require("./User");
const Clients = require("./Clients");

const AuthCodes = Instance.define("AuthCodes", {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  code: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: DataTypes.UUIDV4,
  },
  userId: {
    type: DataTypes.STRING,
  },
  expires: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW,
  },
  clientId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

module.exports = AuthCodes;
