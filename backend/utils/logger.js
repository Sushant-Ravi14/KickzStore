const pino = require("pino");
const pinoHttp = require("pino-http");
const crypto = require("crypto");
const config = require("../config/env");

const logger = pino({
  level: config.isProduction ? "info" : "debug",
  base: { service: "kickzstore-api", env: config.NODE_ENV },
  timestamp: pino.stdTimeFunctions.isoTime,
});

const httpLogger = pinoHttp({
  logger,
  genReqId: (req) => req.headers["x-request-id"] || crypto.randomUUID(),
  customLogLevel: (_req, res, err) => {
    if (res.statusCode >= 500 || err) return "error";
    if (res.statusCode >= 400) return "warn";
    return "info";
  },
  serializers: {
    req: (req) => ({
      id: req.id,
      method: req.method,
      url: req.url,
      remoteAddress: req.remoteAddress,
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
  },
});

module.exports = {
  logger,
  httpLogger,
};
