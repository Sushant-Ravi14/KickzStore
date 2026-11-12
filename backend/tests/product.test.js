const request = require("supertest");
const { app } = require("../server");
const Product = require("../models/Product");

describe("Product Service & Controller Integration", () => {
  beforeEach(async () => {
    await Product.insertMany([
      {
        name: "Air Jordan 1 Retro",
        price: 180,
        quantity: 20,
        brand: "Jordan",
        category: "Basketball",
        img: "https://example.com/jordan1.png",
        size: [40, 41, 42],
        color: ["Red", "Black"],
        isFeatured: true,
      },
      {
        name: "Adidas Ultraboost Light",
        price: 190,
        quantity: 15,
        brand: "Adidas",
        category: "Running",
        img: "https://example.com/ultraboost.png",
        size: [41, 42, 43],
        color: ["White"],
        isFeatured: false,
      },
      {
        name: "Nike Air Force 1",
        price: 110,
        quantity: 35,
        brand: "Nike",
        category: "Lifestyle",
        img: "https://example.com/af1.png",
        size: [40, 41, 42, 43],
        color: ["White"],
        isFeatured: true,
      },
    ]);
  });

  it("should return all products with pagination", async () => {
    const res = await request(app).get("/api/v1/products?page=1&limit=2");
    expect(res.status).toBe(200);
    expect(res.body.products.length).toBe(2);
    expect(res.body.pagination.total).toBe(3);
  });

  it("should filter products by brand", async () => {
    const res = await request(app).get("/api/v1/products?brand=Jordan");
    expect(res.status).toBe(200);
    const list = res.body.products || res.body;
    expect(list.length).toBe(1);
    expect(list[0].brand).toBe("Jordan");
  });

  it("should filter products by isFeatured", async () => {
    const res = await request(app).get("/api/v1/products?isFeatured=true");
    expect(res.status).toBe(200);
    const list = res.body.products || res.body;
    expect(list.length).toBe(2);
  });

  it("should search products by keyword", async () => {
    const res = await request(app).get("/api/v1/products/search?q=Ultraboost");
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].name).toContain("Ultraboost");
  });

  it("should return product by valid ID and 404 for unknown ID", async () => {
    const sample = await Product.findOne({ brand: "Jordan" });
    const res = await request(app).get(`/api/v1/products/${sample._id}`);
    expect(res.status).toBe(200);
    expect(res.body.name).toBe(sample.name);

    const nonExistentId = "507f1f77bcf86cd799439011";
    const notFoundRes = await request(app).get(`/api/v1/products/${nonExistentId}`);
    expect(notFoundRes.status).toBe(404);
  });
});
