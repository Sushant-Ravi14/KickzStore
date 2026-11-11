const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const mongoSanitize = require("express-mongo-sanitize");
const rateLimit = require("express-rate-limit");
const swaggerUi = require("swagger-ui-express");
const mongoose = require("mongoose");

const config = require("./config/env");
const connectDB = require("./config/db");
const apiRouter = require("./routes/index");
const swaggerSpec = require("./docs/swaggerSpec");
const { logger, httpLogger } = require("./utils/logger");
const errorHandler = require("./middlewares/errorHandler");

const app = express();

// 1. Security Headers
app.use(
  helmet({
    contentSecurityPolicy: false, // Allow Swagger UI inline scripts/styles
    crossOriginEmbedderPolicy: false,
  })
);

// 2. Strict CORS Configuration
const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g. mobile apps, postman, curl)
    if (!origin) return callback(null, true);
    if (config.corsOrigins === "*") return callback(null, true);

    if (Array.isArray(config.corsOrigins) && config.corsOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-request-id", "Idempotency-Key"],
};
app.use(cors(corsOptions));

// 3. Structured HTTP Logging with Request IDs
app.use(httpLogger);

// 4. Rate Limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests from this IP, please try again later." },
});
app.use("/api", globalLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many authentication attempts, please try again later." },
});
app.use("/api/auth", authLimiter);
app.use("/api/v1/auth", authLimiter);

// 5. Body Parsing with Strict Size Limits
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// 6. Data Sanitization against NoSQL query injection (Express 5 compatible)
app.use((req, _res, next) => {
  if (req.body && typeof req.body === "object") {
    mongoSanitize.sanitize(req.body);
  }
  if (req.params && typeof req.params === "object") {
    mongoSanitize.sanitize(req.params);
  }
  next();
});

// 7. Health Check Probe
const healthHandler = (_req, res) => {
  const isConnected = mongoose.connection.readyState === 1;
  const status = isConnected ? 200 : 503;
  res.status(status).json({
    status: isConnected ? "ok" : "degraded",
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    database: isConnected ? "connected" : "disconnected",
    version: "1.0.0",
    environment: config.NODE_ENV,
  });
};
app.get("/health", healthHandler);
app.get("/api/health", healthHandler);
app.get("/api/v1/health", healthHandler);

// 8. Interactive Swagger / OpenAPI Documentation
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/api/v1/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// 9. API Routes (v1 and alias /api for backwards compatibility)
app.use("/api/v1", apiRouter);
app.use("/api", apiRouter);

// 10. 404 Route Not Found
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

// 11. Centralized Error Handler
app.use(errorHandler);

// Connect Database & Start Server (skipped in automated tests to use in-memory database)
let server;
if (config.NODE_ENV !== "test") {
  connectDB();
  server = app.listen(config.PORT, "0.0.0.0", () => {
    logger.info(`KickzStore API server started successfully on port ${config.PORT}`);
    logger.info(` - Health check: http://localhost:${config.PORT}/api/health`);
    logger.info(` - Swagger Docs: http://localhost:${config.PORT}/api/docs`);

    // Pre-warm product catalog cache in background for instant sub-millisecond first load
    const serpApiService = require("./services/serpApi.service");
    serpApiService.fetchProducts().catch((err) => {
      logger.warn(`Initial catalog pre-warm note: ${err.message}`);
    });
  });
}

// Graceful Shutdown Handler
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} signal received: closing HTTP server and database connection.`);
  const closeDb = async () => {
    try {
      await mongoose.connection.close(false);
      logger.info("MongoDB connection closed gracefully.");
      process.exit(0);
    } catch (err) {
      logger.error("Error during MongoDB disconnection:", err);
      process.exit(1);
    }
  };

  if (server) {
    server.close(async () => {
      logger.info("HTTP server closed.");
      await closeDb();
    });
  } else {
    await closeDb();
  }

  // Force close if graceful shutdown hangs
  setTimeout(() => {
    logger.error("Could not close connections in time, forcefully shutting down");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

module.exports = { app, server };
