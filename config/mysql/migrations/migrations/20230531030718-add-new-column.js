"use strict";
const Sequelize = require("Sequelize");
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn("Users", "id", {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
    });
    await queryInterface.changeColumn("AuthTokens", "userId", {
      type: Sequelize.UUID,
    });
    await queryInterface.changeColumn("AuthCodes", "userId", {
      type: Sequelize.UUID,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn("Users", "id", {
      type: Sequelize.INTEGER,
    });
    await queryInterface.changeColumn("AuthTokens", "userId", {
      type: Sequelize.INTEGER,
    });
    await queryInterface.changeColumn("AuthCodes", "userId", {
      type: Sequelize.INTEGER,
    });
  },
};
