const { redis } = require("./index");

redis.flushdb((err, result) => {
  if (err) {
    console.error("Error clearing database:", err);
  } else {
    console.log("Database cleared:", result);
  }
});
