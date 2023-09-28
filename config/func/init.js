const Instance = require("./instance");

const Users = require("../Model/User");
const Clients = require("../Model/Clients");
const AuthTokens = require("../Model/AuthTokens");
const AuthCodes = require("../Model/AuthCodes");
const Rooms = require("../Model/rtc/Rooms");
require("../Model/rtc/RoomUsers");

const { isProd } = require("../../utils");

Users.hasMany(AuthTokens, {
  foreignKey: "userId",
});

AuthTokens.belongsTo(Users, {
  foreignKey: "userId",
});

Users.hasMany(AuthCodes, {
  foreignKey: "userId",
});

AuthCodes.belongsTo(Users, {
  foreignKey: "userId",
});

AuthTokens.belongsTo(AuthCodes, {
  foreignKey: "userId",
});

Clients.hasMany(AuthCodes, {
  foreignKey: "clientId",
});

AuthCodes.belongsTo(Clients, {
  foreignKey: "clientId",
});

Users.hasMany(Rooms, {
  foreignKey: "creataRoomUserId",
});

Rooms.belongsTo(Users, {
  foreignKey: "creataRoomUserId",
});

// Users.hasMany(Rooms, {
//   foreignKey: "anchorRoomUserId",
// });

// Rooms.belongsTo(Users, {
//   foreignKey: "anchorRoomUserId",
// });

Instance.authenticate()
  .then(() => {
    console.log("Database connection has been established successfully.");
    require("./sync");
  })
  .catch((error) => {
    console.error("Unable to connect to the database:", error);
  });
