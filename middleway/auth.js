const { whiteRouterList } = require("../config/auth");

const { AuthTokensModel, UsersModel } = require("@lceihen/mysql-utils");

const { isOutOfDate, handleParseCookieString } = require("../utils");

const handleAuth = async (ctx, next) => {
  const url = ctx.request.url.split("?")[0];
  console.log("url------", url);
  if (whiteRouterList.includes(url)) {
    await next();
    return;
  }
  const cookie = ctx.header.cookie || "";

  const queryObject = handleParseCookieString(cookie);

  const userName = queryObject.userName;

  const token = queryObject.token;

  if (!token) {
    ctx.body = {
      code: "-10000",
      message: "请先登录",
    };

    return;
  }
  const tokenRecord = await AuthTokensModel.findOne({
    where: {
      token: token,
    },
  });

  if (!tokenRecord) {
    ctx.body = {
      code: "-10000",
      message: "请先登录",
    };
    return;
  }
  const { expires } = tokenRecord;
  if (isOutOfDate(expires)) {
    ctx.body = {
      code: "-10000",
      message: "code over expires Or code had used",
    };
    return;
  }
  await next();
};
module.exports = {
  handleAuth,
};
