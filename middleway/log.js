const { asyncLocalStorage } = require("../store/asyncLocalStorage");
const { accessLogger } = require("../utils/log");
const { zipkinTracing } = require("../utils/zipkin");
const { v4: uuidv4 } = require("uuid");
const { handleParseCookieString } = require("../utils/index");
const { Client: Client7 } = require("@elastic/elasticsearch");
const { default: axios } = require("axios");

const client7 = new Client7({
  node: "http://elasticsearch.abclive.cloud",
});

const FeiShuWebHookUrl =
  "https://open.feishu.cn/open-apis/bot/v2/hook/7681b246-49d3-4b81-8ed2-1c4cce3f1125";

const log = async (ctx, next) => {
  // 飞书错误的结构体
  let content = null;

  const {
    traceId: preTraceId,
    spanId: preSpanId,
    token,
    userName,
    uid,
  } = handleParseCookieString(ctx.header.cookie);
  const traceId = preTraceId || uuidv4().replace(/-/g, "").slice(0, 16);
  const parentId = preSpanId;
  const spanId = uuidv4().replace(/-/g, "").slice(0, 16);
  const requestInfo = {
    body: JSON.stringify(ctx.request.body),
    query: JSON.stringify(ctx.request.query),
  };
  ctx.cookies.set("spanId", spanId, { httpOnly: false });
  ctx.cookies.set("traceId", traceId, { httpOnly: false });
  ctx.spanId = spanId;
  ctx.traceId = traceId;
  let ms = null;
  let errorData = null;
  let startTime = null;

  content = {
    spanId,
    traceId,
    token,
    uid,
  };
  try {
    await asyncLocalStorage.run({ traceId, spanId }, async () => {
      startTime = Date.now();
      await next();
      const endTime = Date.now();
      ms = endTime - startTime;
    });
  } catch (error) {
    if (typeof error === "object") {
      errorData = {
        title: "Error occurred in Koa Auth App",
        message: error.message,
        content: content,
      };
    } else {
      errorData = {
        title: "Error occurred in Koa Auth App",
        message: error,
        content: content,
      };
    }

    const headers = { "Content-Type": "application/json" };
    axios(FeiShuWebHookUrl, {
      method: "post",
      data: {
        msg_type: "text",
        content: {
          text: JSON.stringify(errorData),
        },
      },
      headers,
    });
  } finally {
    console.log(`${ctx.method} ${ctx.url} - ${ms}ms-date:${new Date()}`);
    accessLogger.info(`${ctx.method} ${ctx.url} - ${ms}ms-date:${new Date()}`, {
      req: requestInfo,
    });
    const reportData = {
      name: ctx.request.path,
      local: ctx.header.referer,
      traceId,
      id: spanId,
      spanId: spanId,
      uid,
      parentId,
      userName,
      data: {
        short: `${ctx.method} ${ctx.url} - ${ms}ms-date:${new Date()}`,
        req: requestInfo,
      },
      remote: ctx.request.href,
      duration: ms,
      serverStartTime: startTime,
      serverEndTime: Date.now(),
    };
    if (errorData) {
      delete errorData["content"];
      reportData.error = errorData;
    }
    content = reportData;
    try {
      await client7.index({
        index: "koa-server-logs", // Replace with your desired index name
        body: reportData,
      });
      zipkinTracing(reportData);
    } catch (error) {
      accessLogger.info(
        `elasticsearch 、zipkin上报错误` + JSON.stringify(reportData)
      );
    }
    if (errorData) {
      ctx.body = {
        code: "-1",
        message: errorData.message || errorData.message?.error,
      };
    }
  }
};

const useSocketLog = async (useArgs, socket, rtcSocket) => {
  // eventName emit发送的api
  // body 数据体
  // rtcSocket rtc
  let reportData = {};
  let ms = 0;

  const [eventName = "entry", body] = useArgs[0] || [];
  try {
    let startTime = Date.now();

    const next = useArgs[1];

    const cookie = socket.handshake.headers.cookie;

    const queryObject = handleParseCookieString(cookie);

    const {
      traceId: preTraceId,
      spanId: preSpanId,
      token,
      userName,
    } = queryObject;

    const spanId = uuidv4().replace(/-/g, "").slice(0, 16);

    const parentId = preSpanId;

    const traceId = preTraceId || uuidv4().replace(/-/g, "").slice(0, 16);

    reportData = {
      name: eventName,
      local: socket.handshake.headers.origin,
      traceId,
      id: spanId,
      spanId: spanId,
      parentId,
      token,
      userName,
      data: body,
      duration: ms,
      serverStartTime: startTime,
      serverEndTime: Date.now(),
    };
    if (next) await next();
    const endTime = Date.now();
    ms = endTime - startTime;
    socket.emit("cookie", `spanId=${spanId}`);
  } catch (error) {
    console.log("next error", error);
    reportData.errorData = error.message;
    const errorData = {
      title: "Error occurred in Koa Rtc App",
      message: JSON.stringify(reportData),
    };
    reportData.errorData = errorData;

    const headers = { "Content-Type": "application/json" };
    axios(FeiShuWebHookUrl, {
      method: "post",
      data: {
        msg_type: "text",
        content: {
          text: JSON.stringify(errorData),
        },
      },
      headers,
    });
  } finally {
    accessLogger.info(
      `label - access ${
        socket.handshake.headers.origin
      } url- ${eventName} - ${ms}ms-date:${new Date()}`,
      {
        body: reportData,
      }
    );
    try {
      // await client7.index({
      //   index: "rtc-koa-server-logs", // Replace with your desired index name
      //   body: reportData,
      // });
      zipkinTracing(reportData);
    } catch (error) {
      console.log("上报错误-----", error);

      accessLogger.info(
        `elasticsearch 、zipkin上报错误` + JSON.stringify(reportData)
      );
    }
  }
};

module.exports = {
  log,
  useSocketLog,
};
