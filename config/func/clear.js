const Instance = require("./instance");
// 清空数据库中的所有表
const clearDatabase = async () => {
  try {
    await Instance.getQueryInterface().dropAllTables();
    console.log("数据库中的所有表已清空");
  } catch (error) {
    console.error("清空数据库中的所有表时出错:", error);
  }
};
clearDatabase();
module.exports = {
  clearDatabase,
};
