const Redis = require("ioredis");

const { createClient } = require("redis");
const { isProd } = require("../../utils/index");

const host = isProd ? "120.24.253.52" : "localhost";

const port = 6379;

// 半个小时
const redisExpireDate = 30 * 60;

const config = {
  host,
  port,
};

const redis = new Redis(config);
const pubRedisClient = createClient(config);
const subRedisClient = pubRedisClient.duplicate();

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
  pubRedisClient,
  subRedisClient,
};
