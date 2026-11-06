const mongoose = require("mongoose");
const schema = mongoose.Schema;

const ProductSchema = new schema(
  {
    name: { type: String, required: true, trim: true },
    title: { type: String, trim: true },
    description: { type: String, trim: true, default: "" },
    price: { type: Number, required: true, min: 0 },
    extracted_price: { type: Number, min: 0 },
    quantity: { type: Number, default: 50, min: 0 },
    img: { type: schema.Types.Mixed, required: true },
    thumbnail: { type: String, default: "" },
    link: { type: String, default: "" },
    rating: { type: Number, default: 4.5 },
    reviews: { type: Number, default: 0 },
    source: { type: String, default: "" },
    brand: { type: String, required: true, trim: true, index: true },
    category: { type: String, default: "Shoes", trim: true, index: true },
    size: [{ type: Number }],
    color: [{ type: String }],
    isFeatured: { type: Boolean, default: false, index: true },
    serpapiId: { type: String, index: true, sparse: true },
  },
  { timestamps: true }
);

// Full-text search index for high performance search
ProductSchema.index({
  name: "text",
  title: "text",
  brand: "text",
  category: "text",
  description: "text",
});

ProductSchema.index({ brand: 1, price: 1 });
ProductSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Product", ProductSchema, "products");
