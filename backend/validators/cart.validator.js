const { z } = require("zod");

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const addToCartSchema = z.object({
  productId: z.string().regex(objectIdRegex, "Invalid productId format"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  size: z.union([z.string(), z.number()]),
  color: z.string(),
}).strict();

const updateCartItemSchema = z.object({
  quantity: z.number().int().min(0, "Quantity cannot be negative"),
  size: z.union([z.string(), z.number()]).optional(),
  color: z.string().optional(),
}).strict();

module.exports = {
  addToCartSchema,
  updateCartItemSchema,
};
