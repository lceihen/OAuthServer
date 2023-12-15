const { asyncLocalStorage } = require("../store/asyncLocalStorage");
const { accessLogger } = require("../utils/log");

const { v4: uuidv4 } = require("uuid");
const { handleParseCookieString } = require("../utils/index");

const { default: axios } = require("axios");

const FeiShuWebHookUrl =
  "https://open.feishu.cn/open-apis/bot/v2/hook/7681b246-49d3-4b81-8ed2-1c4cce3f1125";

const log = async (ctx, next) => {
  // 飞书错误的结构体
  let content = {};

  let { traceId, token, userId } = handleParseCookieString(ctx.header.cookie);

  const preTraceId = traceId;

  traceId = uuidv4().replace(/-/g, "").slice(0, 16);

  ctx.cookies.set("traceId", traceId, { httpOnly: false });
  ctx.cookies.set("preTraceId", preTraceId, { httpOnly: false });

  content = {
    ...content,
    preTraceId,
    traceId,
    token,
    userId,
  };
  try {
    await asyncLocalStorage.run({ traceId, preTraceId }, async () => {
      let startTime = Date.now();
      await next();
      const endTime = Date.now();
      content.ms = endTime - startTime;
    });
  } catch (error) {
    console.log("error", error);
    content.error = error;
    axios(FeiShuWebHookUrl, {
      method: "post",
      data: {
        msg_type: "text",
        content: {
          text: JSON.stringify(content),
        },
      },
      headers: { "Content-Type": "application/json" },
    });
  } finally {
  }
};

module.exports = {
  log,
};
