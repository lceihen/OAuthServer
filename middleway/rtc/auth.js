const { handleParseCookieString, isOutOfDate } = require("../../utils/index");
const AuthTokensModel = require("../../config/Model/AuthTokens");
const UsersModel = require("../../config/Model/User");
const handleAuth = async (args, socket) => {
  const next = args[1];

  const cookie = socket.handshake.headers.cookie;

  if (!cookie) {
    socket.emit("login");
    return;
  }
  const queryObject = handleParseCookieString(cookie);

  const userName = queryObject.userName;

  const token = queryObject.token;

  if (!token || !userName) {
    socket.emit("login");
    return;
  }
  const tokenRecord = await AuthTokensModel.findOne({
    where: {
      token: token,
    },
    include: [
      {
        model: UsersModel,
        where: {
          userName: userName,
        },
      },
    ],
  });

  if (!tokenRecord) {
    socket.emit("login");
    return;
  }
  const { expires } = tokenRecord;
  if (isOutOfDate(expires)) {
    socket.emit("login");
    return;
  }
  next && next();
};
module.exports = {
  handleAuth,
};
