const User = require("../../config/Model/User");
const Rooms = require("../../config/Model/rtc/Rooms");
const { redis } = require("../../config/redis/index");
const { v4: uuidv4 } = require("uuid");

const { SOCKER_INSTANCE_MAP: Socket_Uid_Map } = require("../../config/index");

const {
  handleParseCookieString,
  computedOffset,
} = require("../../utils/index");

// const Socket_Uid_Map = {};

module.exports = (socket) => {
  socket.on("createOrJoinRoom", async (...args) => {
    console.log("args", args);
    const [payload, cb] = args;
    const { operateType, roomName, roomType } = payload;
    const cookie = socket.handshake.headers.cookie;
    const { uid } = handleParseCookieString(cookie);

    let res = {};
    if (operateType === "join") {
      res = await Rooms.findOne({
        where: {
          id: payload.roomId,
        },
      });
    } else {
      // create
      res = await Rooms.create({
        roomName,
        roomType,
        creataRoomUserId: String(uid),
        anchorRoomUserId: String(uid),
        status: "open",
      });
    }

    const uidsOfRoom = await redis.get(`uids_of_room_${res.id}`);

    // 获取房间信息
    await redis.set(`room_info_${res.id}`, JSON.stringify(res));

    if (uidsOfRoom) {
      const uidsOfRoomObject = JSON.parse(uidsOfRoom);
      if (!uidsOfRoomObject.include(res.id))
        // 根据房间信息获取所有用户
        await redis.set(
          `uids_of_room_${res.id}`,
          JSON.stringify([...uidsOfRoomObject, res.id])
        );
    }
    // 根据 roomid获取room信息

    await redis.set(`uid_of_room_${res.id}`, res);
    // 根据uid 获取用户信息
    const userInfoString = await redis.get(`token_userinfo_${uid}`);
    const userInfo = JSON.parse(userInfoString);
    userInfo.roomId = res.id;
    // 设置用户所在房间id
    await redis.set(`token_userinfo_${uid}`, JSON.stringify(userInfo));

    // 保留加入者的socket

    cb &&
      cb({
        code: "0",
        data: res,
      });
  });

  socket.on("webrtc_join_socket_group", (payload, cb) => {
    // 加入房间，以便进行candidate 和offer分发

    socket.join(payload.roomId);
    // 设置joinuid 的socket
    const createJoinUid = uuidv4();
    Socket_Uid_Map[createJoinUid] = socket;
    cb &&
      cb({
        joinUid: createJoinUid,
      });
  });

  socket.on("handleGetMeetRecordList", async (payload, cb) => {
    const cookie = socket.handshake.headers.cookie;
    const { uid } = handleParseCookieString(cookie);

    console.log("handleGetMeetRecordList", payload);
    const { current, pageSize } = payload;
    const offset = computedOffset(+current, +pageSize);

    let recordList = null;
    if (current && pageSize) {
      recordList = await Rooms.findAll({
        offset,
        limit: +pageSize,
        where: {
          creataRoomUserId: uid,
        },
        include: {
          model: User,
        },
        order: ["createdAt"],
      });
    } else {
      recordList = await Rooms.findAll({
        where: {
          creataRoomUserId: uid,
        },
        include: {
          model: User,
        },
        order: [["createdAt", "DESC"]],
      });
    }

    cb &&
      cb({
        code: "0",
        data: recordList,
      });
  });

  // 1、触发房间内其他客户端自己发起peerconnect连接
  socket.on("webrtc_dispatch_work", async (...args) => {
    const [payload] = args;

    const cookie = socket.handshake.headers.cookie;
    const { uid } = handleParseCookieString(cookie);
    const userInfoString = await redis.get(`token_userinfo_${uid}`);
    const roomId = JSON.parse(userInfoString).roomId;

    // 加入者广播peer📢
    socket.broadcast.to(roomId).emit("webrtc_dispatch_work", {
      ...payload,
    });
  });

  // 3、发送reciver的offer给join 5、收到join发给reciver的offer
  socket.on("webrtc_dispatch_offer", async (payload) => {
    // 两次回调offer都会进来这里
    const cookie = socket.handshake.headers.cookie;
    const { uid } = handleParseCookieString(cookie);

    const { joinUid, reciverUid } = payload;
    // 先拿到reciver 的offer，第二次才拿的是join的offer
    if (payload?.joinOffer) {
      console.log("加入者传递的信息");
      // 设置joinuid的socket
      Socket_Uid_Map[uid] = socket;
      Socket_Uid_Map[reciverUid].emit("webrtc_set_offer", payload);
    } else {
      console.log("房间成员传递的信息", payload);
      // 设置reciverid 的socket
      const createReciverUid = uuidv4();
      Socket_Uid_Map[createReciverUid] = socket;
      Socket_Uid_Map[joinUid].emit("webrtc_dispatch_work", {
        ...payload,
        reciverUid: createReciverUid,
      });
    }
  });
  // 为reciver设置candidate
  socket.on("webrtc_setCandidate", async (payload) => {
    console.log("webrtc_setCandidate", payload);
    const { reciverUid, joinUid, reciverRole } = payload;

    if (reciverRole) {
      Socket_Uid_Map[joinUid].emit("webrtc_setCandidate", payload);
    } else {
      Socket_Uid_Map[reciverUid].emit("webrtc_setCandidate", payload);
    }
  });
};
