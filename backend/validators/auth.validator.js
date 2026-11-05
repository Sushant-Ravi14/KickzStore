const { z } = require("zod");

const registerSchema = z.object({
  firstName: z.string().min(1, "First name is required").trim(),
  lastName: z.string().min(1, "Last name is required").trim(),
  email: z.string().email("Invalid email address").toLowerCase().trim(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phoneNumber: z.string().optional(),
  address: z.union([
    z.string(),
    z.object({
      street: z.string().optional(),
      district: z.string().optional(),
      city: z.string().optional(),
      country: z.string().optional(),
    }),
  ]).optional(),
  // Disallow client from asserting elevated roles
  role: z.enum(["user", "customer"]).optional().default("user"),
}).strict();

const loginSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase().trim(),
  password: z.string().min(1, "Password is required"),
}).strict();

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
}).strict();

module.exports = {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
};
