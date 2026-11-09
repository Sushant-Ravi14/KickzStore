const { z } = require("zod");

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const createOrderSchema = z.object({
  selectedItems: z.array(
    z.object({
      productId: z.string().regex(objectIdRegex, "Invalid productId format"),
      size: z.union([z.string(), z.number()]),
      color: z.string(),
    })
  ).min(1, "At least one item must be selected for checkout"),
  shippingMethod: z.enum(["standard", "express"]).default("standard"),
  address: z.string().min(3, "Delivery address is required").trim(),
  paymentMethod: z.enum(["credit_card", "paypal", "cod"]).default("cod"),
  voucherCode: z.string().trim().optional(),
  cardId: z.string().regex(objectIdRegex, "Invalid cardId format").optional(),
  cvv: z.string().regex(/^\d{3,4}$/, "CVV must be 3 or 4 digits").optional(),
}).strict();

const updateOrderStatusSchema = z.object({
  status: z.enum(["pending", "paid", "processing", "shipped", "completed", "cancelled"]),
}).strict();

module.exports = {
  createOrderSchema,
  updateOrderStatusSchema,
};
