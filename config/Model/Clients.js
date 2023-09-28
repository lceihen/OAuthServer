const { DataTypes } = require("sequelize");
const Instance = require("../func/instance");

const Clients = Instance.define("Clients", {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },

  secret: {
    type: DataTypes.STRING,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
  },
  redirectUri: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  remark: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});

module.exports = Clients;
