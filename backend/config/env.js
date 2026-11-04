const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const { z } = require("zod");

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(5000),
  MONGO_URI: z.string().min(1, "MONGO_URI is required"),
  DBNAME: z.string().default("KickzStore"),
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters long"),
  JWT_REFRESH_SECRET: z.string().min(16, "JWT_REFRESH_SECRET must be at least 16 characters long").default("kickzstore_refresh_token_secret_key_2026"),
  JWT_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  CORS_ORIGIN: z.string().default("*"),
  SERPAPI_KEY: z.string().optional().default(""),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ CRITICAL: Invalid environment configuration:", parsed.error.format());
  throw new Error("Application cannot start due to invalid environment variables.");
}

const config = {
  ...parsed.data,
  isProduction: parsed.data.NODE_ENV === "production",
  corsOrigins: parsed.data.CORS_ORIGIN === "*"
    ? "*"
    : parsed.data.CORS_ORIGIN.split(",").map((o) => o.trim()).filter(Boolean),
};

module.exports = config;
