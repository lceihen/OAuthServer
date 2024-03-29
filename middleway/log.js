// const { asyncLocalStorage } = require("../store/asyncLocalStorage");
const { accessLogger } = require("../utils/log");

const { v4: uuidv4 } = require("uuid");
const { handleParseCookieString } = require("../utils/index");

const { default: axios } = require("axios");

const feishuOauthProdWebHookUrl =
  "https://open.feishu.cn/open-apis/bot/v2/hook/7681b246-49d3-4b81-8ed2-1c4cce3f1125";

const feishuOauthBetaLocalWebHookUrl =
  "https://open.feishu.cn/open-apis/bot/v2/hook/ca8c9f79-03a8-4037-a2c1-c979d6e19cb5";

const feishuOauthBetaErrorWebHookUrl =
  "https://open.feishu.cn/open-apis/bot/v2/hook/8232074d-2d2f-4c0c-9035-6ec29ab2092c";

const feishuOauthProdErrorWebHookUrl =
  "https://open.feishu.cn/open-apis/bot/v2/hook/33b7ffbd-054a-42f7-9930-91ccf0059514";

const FeiShuWebHookUrl =
  process.env.NODE_ENV === "production"
    ? feishuOauthProdWebHookUrl
    : feishuOauthBetaLocalWebHookUrl;

const FeiShuErrorWebHookUrl =
  process.env.NODE_ENV === "production"
    ? feishuOauthProdErrorWebHookUrl
    : feishuOauthBetaErrorWebHookUrl;

const log = async (ctx, next) => {
  // 飞书错误的结构体
  let content = {};

  let cookie = handleParseCookieString(ctx.header.cookie);

  let { traceId, token, userId, appTag } = cookie || {};

  console.log(ctx);

  const preTraceId = traceId;

  traceId = uuidv4().replace(/-/g, "").slice(0, 16);

  ctx.cookies.set("traceId", traceId, { httpOnly: false });
  ctx.cookies.set("preTraceId", preTraceId, { httpOnly: false });

  delete cookie["traceId"];
  delete cookie["preTraceId"];

  content = {
    preTraceId,
    traceId,
    token,
    userId,
    appTag: appTag,
    url: ctx.url,
    body: ctx.request.body,
    method: ctx.request.method,
    referer: ctx.request.header.referer,
    cookie: cookie,
    env: process.env.NODE_ENV,
  };
  try {
    let startTime = Date.now();
    await next();
    const endTime = Date.now();
    content.ms = endTime - startTime;
  } catch (error) {
    content.error = JSON.stringify(error.message);
    if (process.env.NODE_ENV !== "development") {
      axios(FeiShuErrorWebHookUrl, {
        method: "post",
        data: {
          msg_type: "text",
          content: {
            text: JSON.stringify(content),
          },
        },
        headers: { "Content-Type": "application/json" },
      });
    }
  } finally {
    accessLogger.info(JSON.stringify(content));
    if (process.env.NODE_ENV === "development") return;
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
  }
};

module.exports = {
  log,
};
