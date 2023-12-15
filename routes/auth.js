const router = require("koa-router")();
const {
  AuthCodesModel,
  AuthTokensModel,
  ClientsModel,
  UsersModel,
} = require("@lceihen/mysql-utils");

const { verifyPassword, handleExpiresTime } = require("../utils/index");
const axios = require("axios");
router.prefix("/api");
const crypto = require("crypto-js");
const nodeCeypto = require("node:crypto");
const { isOutOfDate, computedOffset } = require("../utils/index");

router.get("/auth/code", async (ctx, next) => {
  const {
    redirectUri,
    clientId,
    secret,
    authType = "",
    phone = "",
    userName = "",
    passWord = "",
  } = ctx.query;

  if (!redirectUri || !clientId || !secret) {
    ctx.body = {
      code: "-1",
      message: "redirectUri, clientId, secret 必传",
    };
    return;
  }

  if (!authType || !ctx.query[authType]) {
    ctx.body = {
      code: "-1",
      message: "用户登录信息和密码必传",
    };
    return;
  }
  const hasRecord = await ClientsModel.findOne({
    where: {
      redirectUri: decodeURIComponent(redirectUri),
      id: clientId,
      secret,
    },
  });

  if (!hasRecord) {
    ctx.body = {
      code: "-1",
      message: "redirectUri, clientId, secret 不正确",
      redirectUri,
      clientId,
      secret,
    };
    return;
  }

  const userRecord = await UsersModel.findOne({
    where: {
      [authType]: ctx.query[authType],
    },
  });

  if (!userRecord) {
    ctx.body = {
      code: "-1",
      message: "用户不存在",
    };
    return;
  }

  const { hashedPassword, salt } = userRecord;
  const verifyPasswordResult = verifyPassword(passWord, salt, hashedPassword);

  if (!verifyPasswordResult) {
    ctx.body = {
      code: "-1",
      message: "用户名或者密码错误",
    };
    return;
  }

  const AuthCodes = await AuthCodesModel.findOne({
    where: {
      clientId,
    },
  });

  let result = {};

  if (!AuthCodes || !AuthCodes?.length) {
    result = await AuthCodesModel.create({
      userId: userRecord.id,
      expires: handleExpiresTime(),
      clientId: clientId,
    });
  } else {
    resut = await AuthCodesModel.update(
      {
        expires: handleExpiresTime(),
      },
      {
        where: {
          id: AuthCodes[0].id,
        },
      }
    );
  }
  // ctx.set("Access-Control-Allow-Origin", "*");
  // ctx.set("Access-Control-Request-Method", "*");
  ctx.body = {
    data: {
      redirectUri: `${decodeURIComponent(redirectUri)}?code=${
        result.code
      }&userName=${userName}`,
    },
    code: "0",
  };
});

router.get("/auth/token", async (ctx, next) => {
  const { redirectUri, clientId, code, secret } = ctx.query;
  if (!redirectUri || !clientId || !code || !secret) {
    ctx.body = {
      code: "-1",
      message: "redirectUri, clientId, secret ,code必传",
    };
    return;
  }
  const codeRecord = await AuthCodesModel.findOne({
    where: {
      clientId,
      code,
    },
    include: [
      {
        model: ClientsModel,
        where: {
          secret,
          id: clientId,
          redirectUri,
        },
        required: false,
      },
      {
        model: UsersModel,
        attributes: {
          exclude: ["salt", "hashedPassword"],
        },
      },
    ],
  });

  if (!codeRecord) {
    ctx.body = {
      code: "-1",
      message: "no this code",
    };
    return;
  }
  const { userId, expires: codeExpires, id: codeId, User = {} } = codeRecord;
  const { userName, phone, id } = User;

  // todo 放开
  if (isOutOfDate(codeExpires)) {
    ctx.body = {
      code: "-10000",
      message: "code over expires Or code had used",
    };
    return;
  }

  // 创建token
  const result = await AuthTokensModel.create({
    clientId,
    userId,
    expires: handleExpiresTime(),
  });

  // 更新code
  await AuthCodesModel.update(
    {
      expires: handleExpiresTime(0),
    },
    {
      where: {
        id: codeId,
      },
    }
  );

  let domain = (ctx.headers.origin || ctx.headers.referer)
    .split("//")[1]
    .split("/")[0];

  if (domain === "micro.abclive.cloud") {
    domain = ".abclive.cloud";
  } else if (domain.includes("localhost")) {
    domain = "localhost";
  }
  ctx.cookies.set("token", result.token, {
    domain: domain,
    maxAge: 60 * 60 * 1000 * 24,
    httpOnly: true,
  });
  console.log("domain--------", domain);
  ctx.cookies.set("userId", id, {
    domain: domain,
    maxAge: 60 * 60 * 1000 * 24,
    httpOnly: true,
  });
  ctx.cookies.set("userName", userName, {
    domain: domain,
    maxAge: 60 * 60 * 1000 * 24,
    httpOnly: true,
  });

  ctx.body = {
    data: {
      token: result.token,
    },
    code: "0",
  };
});

router.get("/auth/getClient", async (ctx, next) => {
  const { pageSize, current } = ctx.query;

  const offset = computedOffset(+current, +pageSize);
  console.log("pageSize,current", pageSize, current, offset);
  const userRecordList = await ClientsModel.findAll({
    offset,
    limit: +pageSize,
  });
  const total = await ClientsModel.count();
  ctx.body = {
    code: "0",
    data: userRecordList,
    total,
  };
});

router.post("/auth/createOrUpdate", async (ctx, next) => {
  const { record = {} } = ctx.request.body;
  try {
    if (!record?.id) {
      const res = await ClientsModel.create({
        ...record,
      });
      console.log(res);
    } else {
      const res = await ClientsModel.update(
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
    }
  } catch (error) {
    ctx.body = {
      code: "-1",
      message: "请重试",
    };
    return;
  }
  ctx.body = {
    code: "0",
    message: "操作成功",
  };
  return;
});

router.put("/auth/delClient", async (ctx, next) => {
  const { id } = ctx.request.body;
  const res = await ClientsModel.destroy({
    where: {
      id,
    },
  });
  ctx.body = {
    code: res === 1 ? 0 : -1,
  };
});

router.get("/auth/loginOut", async (ctx, next) => {
  let domain = (ctx.headers.origin || ctx.headers.referer)
    .split("//")[1]
    .split("/")[0];

  if (domain === "micro.abclive.cloud") {
    domain = ".abclive.cloud";
  } else if (domain.includes("localhost")) {
    domain = "localhost";
  }
  ctx.cookies.set("token", "", {
    domain: domain,
    maxAge: 0,
    httpOnly: true,
  });
  ctx.body = {
    status: "0",
  };
});

router.get("/auth/getWxToken", async (ctx, next) => {
  const { token } = ctx.query;
  const grant_type = "client_credential";
  const appid = "wxc3a0c6721eb2a3a1";
  const secret = "eef6e3a00c71b317dac4557b66a5f1ee";

  // const res = await axios({
  //   method: "get",
  //   url: "https://api.weixin.qq.com/cgi-bin/token",
  //   params: {
  //     grant_type,
  //     appid,
  //     secret,
  //   },
  // });
  ctx.body = {
    code: "0",
    data: {
      token: "",
    },
  };
});

router.get("/auth/getTicket", async function (ctx, next) {
  const { token: url } = ctx.query;
  const type = "jsapi";
  console.log("url---", url);
  // const res = await axios({
  //   method: "get",
  //   url: "https://api.weixin.qq.com/cgi-bin/ticket/getticket",
  //   params: {
  //     type,
  //     access_token,
  //   },
  // });
  const getTimesTamp = () => {
    return parseInt(new Date().getTime() / 1000) + "";
  };
  const nonceStr = "lceihen";
  const timeStamp = getTimesTamp();

  const data = `jsapi_ticket=LIKLckvwlJT9cWIhEQTwfCVjJM4mAP8n-7VfkHj5rFl54F9xlRhYowAvk__Tj651J9ofuclwSnurODzSKk84bw&noncestr=${nonceStr}&timestamp=${timeStamp}&url=${url}`;

  const hash = nodeCeypto.createHash("sha1");
  hash.update(data);
  const signature = hash.digest("hex");
  const res = {
    signature: signature,
    nonceStr,
    timeStamp,
    url,
  };
  console.log("data-------", res);
  ctx.body = {
    code: "0",
    data: res,
  };
  // console.log(res);
});

router.get("/json", async (ctx, next) => {
  ctx.body = {
    title: "koa2 json",
  };
});

module.exports = router;
