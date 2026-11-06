const { z } = require("zod");

const createProductSchema = z.object({
  name: z.string().min(1, "Product name is required").trim(),
  price: z.number().min(0, "Price must be non-negative"),
  brand: z.string().min(1, "Brand is required").trim(),
  category: z.string().min(1, "Category is required").trim(),
  quantity: z.number().int().min(0, "Quantity must be non-negative"),
  description: z.string().optional().default(""),
  img: z.union([z.string(), z.array(z.string())]).default([]),
  sizes: z.array(z.union([z.string(), z.number()])).default([]),
  colors: z.array(z.string()).default([]),
}).strict();

const updateProductSchema = createProductSchema.partial();

module.exports = {
  createProductSchema,
  updateProductSchema,
};
