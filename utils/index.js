const crypto = require("crypto");

const generateRandomString = (length) => {
  const randomBytes = crypto.randomBytes(Math.ceil(length / 2));
  const hash = crypto.createHash("sha256").update(randomBytes).digest("hex");
  return hash.slice(0, length);
};

// 加密密码
const encryptPassword = (password) => {
  const salt = crypto.randomBytes(16).toString("hex"); // 生成随机盐值
  const hashedPassword = crypto
    .pbkdf2Sync(password, salt, 1000, 64, "sha512")
    .toString("hex"); // 使用 PBKDF2 算法进行加密
  return {
    salt,
    hashedPassword,
  };
};

// 验证密码
const verifyPassword = (password, salt, hashedPassword) => {
  const inputHashedPassword = crypto
    .pbkdf2Sync(password, salt, 1000, 64, "sha512")
    .toString("hex");
  return inputHashedPassword === hashedPassword;
};

const handleExpiresTime = (second = 30 * 60 * 1000 * 8) => {
  return Date.now() + second;
};

const isOutOfDate = (time) =>
  time && new Date(time).getTime() < new Date().getTime();

const computedOffset = (current, pageSize) => (current - 1) * pageSize;

const isProd = process.env.NODE_ENV === "production";

// 解析cookie  string
const handleParseCookieString = (query) => {
  if (!query) return {};
  const resultArr = query.split("; ");
  const resultObj = {};
  resultArr.forEach((item) => {
    if (!item) return;
    const key = item.split("=")[0];
    const value = item.split("=")[1];
    resultObj[key] = value;
  });
  return resultObj;
};

const rtcOrigin = isProd
  ? "https://rtc.abclive.cloud"
  : "http://localhost:5173";

module.exports = {
  generateRandomString,
  encryptPassword,
  verifyPassword,
  handleExpiresTime,
  isOutOfDate,
  computedOffset,
  isProd,
  handleParseCookieString,
  rtcOrigin,
};
