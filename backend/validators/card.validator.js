const { z } = require("zod");

const addCardSchema = z.object({
  cardNumber: z
    .string()
    .transform((val) => val.replace(/\s+/g, ""))
    .refine((val) => /^\d{13,19}$/.test(val), "Card number must be between 13 and 19 digits"),
  cardHolderName: z.string().min(2, "Cardholder name is required").trim(),
  expiryDate: z
    .string()
    .trim()
    .regex(/^(0[1-9]|1[0-2])\/?([0-9]{2}|[0-9]{4})$/, "Expiry date must be in MM/YY or MM/YYYY format"),
  cvv: z.string().regex(/^\d{3,4}$/, "CVV must be 3 or 4 digits"),
  brand: z.string().trim().optional(),
}).strict();

module.exports = {
  addCardSchema,
};
