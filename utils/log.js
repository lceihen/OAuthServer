const winston = require("winston");
const { format, transports } = require("winston");
const os = require("os");
const path = require("path");
require("winston-daily-rotate-file");
const { asyncLocalStorage } = require("../store/asyncLocalStorage");

function createLogger(label, type = "app") {
  return winston.createLogger({
    defaultMeta: {
      serverName: os.hostname(),
      // 指定日志类型，如 SQL / Request / Access
      label,
    },
    format: format.combine(format.timestamp(), format.json()),
    transports: [
      //   new transports.Console(),
      new transports.DailyRotateFile({
        dirname: path.join(__dirname, "../logs", type),
        filename: "%DATE%.log",
        format: format.combine(
          format.timestamp({ format: "MMM-DD-YYYY HH:mm:ss" })
        ),
      }),
    ],
  });
}

const accessLogger = createLogger("access", "app");
const dbLogger = createLogger("sql", "db");
module.exports = {
  accessLogger,
  dbLogger,
};
