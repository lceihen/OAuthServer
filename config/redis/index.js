const Redis = require("ioredis");

const { createClient } = require("redis");
const { isLocal, projectEnv } = require("../../utils/index");

const host = isLocal ? "localhost" : "120.78.130.60";

const port = 6379;

// 半个小时
const redisExpireDate = 30 * 60;

const config = {
  host,
  port,
  keyPrefix: projectEnv,
};

const redis = new Redis(config);

redis.ping((err, result) => {
  if (err) {
    console.error("Redis is not reachable");
  } else {
    console.log("Redis is reachable");
  }
});

module.exports = {
  redis,
  redisExpireDate,
};
