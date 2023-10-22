const axios = require("axios");
const zipkin_api_url = "https://zipkin.abclive.cloud/api/v2/spans";
const headers = { "Content-Type": "application/json" };

const post = async (url, data) => {
  axios(url, {
    method: "post",
    data: JSON.stringify(data),
    headers,
  }).catch();
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
  post(zipkin_api_url, data);
};

module.exports = {
  zipkinTracing: traceing,
};
