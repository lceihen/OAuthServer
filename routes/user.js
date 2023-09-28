const router = require("koa-router")();

const {
  isOutOfDate,
  computedOffset,
  handleParseCookieString,
  encryptPassword,
} = require("../utils/index");

const { redis, redisExpireDate } = require("../config/redis/index");

const AuthTokensModel = require("../config/Model/AuthTokens");
const UsersModel = require("../config/Model/User");

router.prefix("/api");

router.get("/user", async function (ctx, next) {
  const cookie = ctx.header.cookie;

  const { token, uid } = handleParseCookieString(cookie) || {};

  if (!token) {
    ctx.body = {
      code: "-10000",
      message: "token is null",
    };
    return;
  }

  const redisRecord = await redis.get(`token_userinfo_${uid}`);

  if (redisRecord) {
    const redisRecordObject = JSON.parse(redisRecord);

    ctx.body = {
      code: "0",
      data: redisRecordObject,
    };
    return;
  }

  const tokenRecord = await AuthTokensModel.findOne({
    where: {
      token,
    },
    include: [
      {
        model: UsersModel,
        attributes: {
          exclude: ["salt", "hashedPassword", "phone"],
        },
      },
    ],
  });

  if (!tokenRecord) {
    ctx.body = {
      code: "-10000",
      message: "登录失败，token不存在",
    };
    return;
  }

  if (isOutOfDate(tokenRecord?.expires)) {
    ctx.body = {
      code: "-10000",
      message: "token is out of Date",
    };
    return;
  }

  // 设置redis过期时间为30分钟
  await redis.set(
    `token_userinfo_${uid}`,
    JSON.stringify(tokenRecord?.User),
    "EX",
    redisExpireDate
  );

  ctx.body = {
    code: "0",
    data: tokenRecord?.User,
  };
});

router.get("/bar", function (ctx, next) {
  ctx.body = "this is a users/bar response";
});

router.get("/user/getUserList", async function (ctx, next) {
  const { pageSize, current } = ctx.query;

  const offset = computedOffset(+current, +pageSize);
  console.log("pageSize,current", pageSize, current, offset);
  const userRecordList = await UsersModel.findAll({
    offset,
    limit: +pageSize,
    attributes: {
      exclude: ["salt", "hashedPassword"],
    },
  });
  const total = await UsersModel.count();
  ctx.body = {
    code: "0",
    data: userRecordList,
    total,
  };
});

router.post("/user/updateUser", async (ctx, next) => {
  const { record = {} } = ctx.request.body;
  if (record?.hashedPassword) {
    const { hashedPassword, salt } = encryptPassword(record?.hashedPassword);
    record.hashedPassword = hashedPassword;
    record.salt = salt;
  }

  const res = await UsersModel.update(
    {
      ...record,
    },
    {
      where: {
        id: record.id,
      },
    }
  );
  console.log(res);
  if (res[0] === 1) {
    ctx.body = {
      code: "0",
      message: "操作成功",
    };
  } else {
    ctx.body = {
      code: "-1",
      message: "请重试",
    };
  }

  return;
});

router.put("/user/createUser", async (ctx, next) => {
  const { record = {} } = ctx.request.body;
  if (record?.hashedPassword) {
    const { hashedPassword, salt } = encryptPassword(record?.hashedPassword);
    record.hashedPassword = hashedPassword;
    record.salt = salt;
  }

  const res = await UsersModel.create({
    ...record,
  });
  console.log(res);
  ctx.body = {
    code: "0",
    message: "操作成功",
  };
  return;
});

router.put("/user/delUser", async (ctx, next) => {
  const { id } = ctx.request.body;
  const res = await UsersModel.destroy({
    where: {
      id,
    },
  });
  console.log(res);
  ctx.body = {
    code: res === "0" ? "0" : "-1",
    message: res === "0" ? "" : "请重试",
  };
});

module.exports = router;
