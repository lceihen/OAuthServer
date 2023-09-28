const Koa = require("koa");
const app = new Koa();
const views = require("koa-views");
const json = require("koa-json");
const onerror = require("koa-onerror");
const bodyparser = require("koa-bodyparser");
var cors = require("koa2-cors");
const { Server } = require("socket.io");
const { createServer } = require("http");
const useRoomRouter = require("./routes/rtc/room");
const { rtcOrigin } = require("./utils");
const { handleAuth } = require("./middleway/auth");
const { log, useSocketLog } = require("./middleway/log");
const index = require("./routes/index");
const user = require("./routes/user");
const auth = require("./routes/auth");
const { createAdapter } = require("@socket.io/redis-adapter");
const { handleAuth: useRtcAuth } = require("./middleway/rtc/auth");
const httpServer = createServer();
const { subRedisClient, pubRedisClient } = require("./config/redis/index");

require("dotenv").config();
require("./config/func/init");

// error handler
onerror(app);

// middlewares
app.use(
  bodyparser({
    enableTypes: ["json", "form", "text"],
  })
);
app.use(json());

app.use(require("koa-static")(__dirname + "/public"));

app.use(
  views(__dirname + "/views", {
    extension: "pug",
  })
);

// logger
app.use(async (ctx, next) => await log(ctx, next));

app.use(
  cors({
    origin: (ctx) => {
      if (ctx.header.origin) {
        return ctx.header.origin;
      }
      if (ctx.header.host) {
        return ctx.header.host;
      }
    },
    credentials: true,
  })
);

app.use(async (ctx, next) => await handleAuth(ctx, next));
app.use(index.routes(), index.allowedMethods());
app.use(user.routes(), user.allowedMethods());
app.use(auth.routes(), auth.allowedMethods());

app.on("error", (err, ctx) => {
  console.error("server error", err, ctx);
});

//websocket

// Promise.all([pubRedisClient.connect(), subRedisClient.connect()]).then(() => {

//   });
// });
//console.log()

httpServer.listen(3001);

console.log("websocket listen 3001");

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    credentials: true,
  },
});

// 定义rtc的命名空间
const rtcSocket = io.of("/rtc");

// io.adapter(createAdapter(pubRedisClient, subRedisClient));

rtcSocket.on("connection", async (socket) => {
  // 这两个在connect初始化主要是connect的时候不会走use中间件
  await useRtcAuth([], socket);

  await useSocketLog([], socket, rtcSocket);

  socket.use(async (...args) => await useRtcAuth(args, socket));

  socket.use(async (...args) => await useSocketLog(args, socket, rtcSocket));

  useRoomRouter(socket);
});

// error-handling

console.log("koa listen 3000");

module.exports = app;
