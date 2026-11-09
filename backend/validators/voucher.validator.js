const { z } = require("zod");

const createVoucherSchema = z.object({
  code: z.string().min(2, "Voucher code must be at least 2 characters").toUpperCase().trim(),
  description: z.string().optional(),
  discountType: z.enum(["percent", "amount"]),
  discountValue: z.number().min(0, "Discount value must be non-negative"),
  maxDiscountAmount: z.number().min(0).optional(),
  minOrderValue: z.number().min(0).optional().default(0),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  usageLimit: z.number().int().min(1).optional().default(100),
  isActive: z.boolean().optional().default(true),
}).strict();

const updateVoucherSchema = createVoucherSchema.partial();

const validateVoucherCodeSchema = z.object({
  code: z.string().min(1, "Code is required").toUpperCase().trim(),
  orderSubtotal: z.number().min(0, "Subtotal must be non-negative"),
}).strict();

module.exports = {
  createVoucherSchema,
  updateVoucherSchema,
  validateVoucherCodeSchema,
};
