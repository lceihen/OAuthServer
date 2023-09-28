const { Sequelize } = require("sequelize");
const { isProd } = require("../../utils/index");
const { dbLogger } = require("../../utils/log");

const host = isProd ? "120.24.253.52" : "127.0.0.1";

const sequelize = new Sequelize("Auth", "root", "lc9800481", {
  host: host, //数据库地址
  dialect: "mysql", //指定连接的数据库类型
  pool: {
    max: 5, //连接池最大连接数量
    min: 0, //最小连接数量
    idle: 10000, //如果一个线程 10秒内么有被使用过的话，就释放
  },
  define: {
    timestamps: true,
  },
  dialectOptions: {
    dateStrings: true,
  },
  timezone: "+08:00",
  logging: (...args) => {
    dbLogger.info(args[0]);
  },
});

module.exports = sequelize;
