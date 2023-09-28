const axios = require("axios");
const zipkin_api_url = "http://zipkin.abclive.cloud/api/v2/spans";
const headers = { "Content-Type": "application/json" };

const post = async (url, data) => {
  await axios(url, {
    method: "post",
    data: JSON.stringify(data),
    headers,
  });
};

const traceing = (traceData) => {
  const data = [
    {
      id: traceData.id,
      traceId: traceData.traceId,
      name: traceData.name,
      timestamp: traceData.serverStartTime,
      duration: traceData.ms,
      parentId: traceData.parentId,
      kind: "SERVER",
      localEndpoint: {
        serviceName: traceData.local,
      },
      remoteEndpoint: {
        serviceName: traceData.remote,
      },
      annotations: [
        {
          timestamp: traceData.serverStartTime,
          value: "sr",
        },
        {
          timestamp: traceData.serverEndTime,
          value: "ss",
        },
      ],
      tags: {},
    },
  ];
  for (let p in traceData) {
    traceData[p] = JSON.stringify(traceData[p]);
  }

  data[0].tags = traceData;
  post(zipkin_api_url, data)
    .then()
    .catch((err) => {
      console.log(
        "err-----",
        err.response.data,
        traceData.id,
        traceData.traceId,
        traceData.id.length
      );
    });
};

module.exports = {
  zipkinTracing: traceing,
};
