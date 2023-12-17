require("dotenv").config({
  path: `.env`,
});
require("dotenv").config({
  path: `.env.${process.env.NODE_ENV}`,
  override: true,
});

const Koa = require("koa");

const app = new Koa();
const views = require("koa-views");
const json = require("koa-json");
const onerror = require("koa-onerror");
const bodyparser = require("koa-bodyparser");
var cors = require("koa2-cors");

const { handleAuth } = require("./middleway/auth");
const { log } = require("./middleway/log");

const index = require("./routes/index");
const user = require("./routes/user");
const auth = require("./routes/auth");
const { isProd } = require("./utils");

const {
  initDataBaseModelConnect,
  syncDataBase,
} = require("@lceihen/mysql-utils");

initDataBaseModelConnect();
syncDataBase();

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

if (!isProd) console.log("koa listen 3000");

module.exports = app;
