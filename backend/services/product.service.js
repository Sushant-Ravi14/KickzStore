const Product = require("../models/Product");
const Brand = require("../models/Brand");
const Category = require("../models/Category");
const serpApiService = require("./serpApi.service");
const AppError = require("../utils/AppError");

class ProductService {
  async getProducts({
    page = 1,
    limit = 50,
    brand,
    category,
    isFeatured,
    sort,
    q,
    refresh = false,
  } = {}) {
    // 1. Fetch products from SerpAPI service (with cache and DB fallback)
    const { products: allProducts, brands } = await serpApiService.fetchProducts({
      forceRefresh: refresh === "true" || refresh === true,
      query: q || "shoes",
    });

    let filtered = [...allProducts];

    // 2. Filter by brand (if not "All")
    if (brand && brand.toLowerCase() !== "all") {
      const lowerBrand = brand.toLowerCase();
      filtered = filtered.filter(
        (p) => (p.brand || "").toLowerCase() === lowerBrand
      );
    }

    // 3. Filter by category
    if (category) {
      const lowerCat = category.toLowerCase();
      filtered = filtered.filter(
        (p) => (p.category || "").toLowerCase() === lowerCat
      );
    }

    // 4. Filter by isFeatured
    if (isFeatured !== undefined) {
      const isFeatBool = isFeatured === "true" || isFeatured === true;
      filtered = filtered.filter((p) => Boolean(p.isFeatured) === isFeatBool);
    }

    // 5. Filter by search query if passed
    if (q && q.trim()) {
      const lowerQ = q.trim().toLowerCase();
      filtered = filtered.filter(
        (p) =>
          (p.name || "").toLowerCase().includes(lowerQ) ||
          (p.title || "").toLowerCase().includes(lowerQ) ||
          (p.brand || "").toLowerCase().includes(lowerQ) ||
          (p.description || "").toLowerCase().includes(lowerQ)
      );
    }

    // 6. Sorting
    if (sort === "price_asc") {
      filtered.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    } else if (sort === "price_desc") {
      filtered.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    } else if (sort === "brand_asc" || sort === "name") {
      filtered.sort((a, b) =>
        (a.brand || a.name || "").localeCompare(b.brand || b.name || "")
      );
    } else if (sort === "rating_desc") {
      filtered.sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0));
    }

    const total = filtered.length;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;
    const paginatedProducts = filtered.slice(skip, skip + limitNum);

    return {
      products: paginatedProducts,
      brands,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum) || 1,
      },
    };
  }

  async getProductById(id) {
    if (!id) {
      throw new AppError("Product ID is required", 400);
    }

    // Try finding by MongoDB _id first
    try {
      const product = await Product.findById(id).lean();
      if (product) return product;
    } catch (_e) {
      // id might not be a valid ObjectId
    }

    // Try finding by serpapiId or in cache
    const productBySerp = await Product.findOne({
      $or: [{ serpapiId: id }, { _id: id }],
    }).lean();

    if (productBySerp) return productBySerp;

    // Check SerpAPI in-memory cache
    if (serpApiService.cache.data) {
      const cached = serpApiService.cache.data.find(
        (p) => String(p._id) === String(id) || String(p.serpapiId) === String(id)
      );
      if (cached) return cached;
    }

    throw new AppError("Product not found", 404);
  }

  async searchProducts(query, limit = 30) {
    if (!query || !query.trim()) {
      return [];
    }
    const cleanQuery = query.trim().toLowerCase();

    // 1. Try in-memory / SerpAPI products first
    const { products } = await serpApiService.fetchProducts({ query: cleanQuery });
    const matches = products.filter(
      (p) =>
        (p.name || "").toLowerCase().includes(cleanQuery) ||
        (p.title || "").toLowerCase().includes(cleanQuery) ||
        (p.brand || "").toLowerCase().includes(cleanQuery) ||
        (p.category || "").toLowerCase().includes(cleanQuery)
    );

    if (matches.length > 0) {
      return matches.slice(0, limit);
    }

    // 2. Fallback to DB text search
    try {
      const dbResults = await Product.find({
        $or: [
          { name: { $regex: cleanQuery, $options: "i" } },
          { brand: { $regex: cleanQuery, $options: "i" } },
          { category: { $regex: cleanQuery, $options: "i" } },
        ],
      })
        .limit(limit)
        .lean();

      if (dbResults.length > 0) return dbResults;
    } catch (_e) {}

    return [];
  }

  async getBrands() {
    const { brands } = await serpApiService.fetchProducts();
    return brands;
  }

  async getCategories() {
    try {
      const categories = await Category.find().lean();
      if (categories && categories.length > 0) return categories;
    } catch (_e) {}

    return [
      { _id: "c1", name: "Running" },
      { _id: "c2", name: "Lifestyle" },
      { _id: "c3", name: "Basketball" },
      { _id: "c4", name: "Skateboarding" },
      { _id: "c5", name: "Training" },
    ];
  }
}

module.exports = new ProductService();
