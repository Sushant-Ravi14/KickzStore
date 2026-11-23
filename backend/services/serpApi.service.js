const Product = require("../models/Product");
const config = require("../config/env");
const { logger } = require("../utils/logger");

const KNOWN_BRANDS = [
  "Nike",
  "Adidas",
  "Puma",
  "Reebok",
  "Skechers",
  "Asics",
  "New Balance",
  "Crocs",
  "Jordan",
  "Converse",
  "Vans",
  "Under Armour",
  "Woodland",
  "Bata",
  "Fila",
  "Campus",
  "Red Tape",
  "Sparx",
  "Clarks",
  "Timberland",
];

class SerpApiService {
  constructor() {
    this.cache = {
      data: null,
      brands: [],
      timestamp: 0,
      ttl: 60 * 60 * 1000, // 60 minutes in-memory cache for instant loads
    };
  }

  /**
   * Derive the brand from the product title or merchant/source
   */
  extractBrand(title = "", source = "") {
    const text = `${title} ${source}`;
    for (const brand of KNOWN_BRANDS) {
      const regex = new RegExp(`\\b${brand.replace(/\s+/g, "\\s+")}\\b`, "i");
      if (regex.test(text)) {
        return brand;
      }
    }
    return "Other";
  }

  /**
   * Parse numeric price from extracted_price or raw price string (e.g. "₹4,999", "$89.99")
   */
  parsePrice(item) {
    if (typeof item.extracted_price === "number" && !isNaN(item.extracted_price)) {
      return item.extracted_price;
    }
    if (typeof item.price === "number" && !isNaN(item.price)) {
      return item.price;
    }
    if (typeof item.price === "string") {
      const cleaned = item.price.replace(/[^0-9.]/g, "");
      const num = parseFloat(cleaned);
      if (!isNaN(num)) return num;
    }
    return 99;
  }

  /**
   * Normalize raw SerpAPI shopping item to standardized KickzStore product format
   */
  normalizeItem(item, index) {
    const title = item.title || item.name || "Sneaker Shoe";
    const brand = item.brand || this.extractBrand(title, item.source || "");
    const price = this.parsePrice(item);
    const thumbnail = item.thumbnail || item.serpapi_thumbnail || item.img || "https://images.unsplash.com/photo-1542291026-7eec264c27ff";
    const serpapiId = item.product_id ? String(item.product_id) : `serp_${index}`;

    return {
      name: title,
      title: title,
      brand,
      price,
      extracted_price: price,
      img: thumbnail,
      thumbnail,
      link: item.product_link || item.link || "",
      rating: typeof item.rating === "number" ? item.rating : 4.5,
      reviews: typeof item.reviews === "number" ? item.reviews : (typeof item.reviews_count === "number" ? item.reviews_count : 0),
      source: item.source || "",
      description: item.snippet || item.description || `${brand} shoes with premium comfort and performance.`,
      category: item.category || "Shoes",
      size: [39, 40, 41, 42, 43, 44],
      color: ["Black", "White", "Grey"],
      quantity: 50,
      isFeatured: index < 6,
      serpapiId,
    };
  }

  /**
   * Calculate brand counts from a list of products, sorted A-Z with 'All' first
   */
  computeBrandStats(products) {
    const counts = {};
    for (const p of products) {
      const b = p.brand || "Other";
      counts[b] = (counts[b] || 0) + 1;
    }

    const brandList = Object.keys(counts)
      .filter((b) => b !== "Other")
      .sort((a, b) => a.localeCompare(b))
      .map((b) => ({ name: b, count: counts[b] }));

    if (counts["Other"]) {
      brandList.push({ name: "Other", count: counts["Other"] });
    }

    return [
      { name: "All", count: products.length },
      ...brandList,
    ];
  }

  /**
   * Sync normalized SerpAPI products into MongoDB collection for persistence and relation support
   */
  async syncToDatabase(products) {
    try {
      const ops = products.map((prod) => ({
        updateOne: {
          filter: { serpapiId: prod.serpapiId },
          update: {
            $set: {
              name: prod.name,
              title: prod.title,
              brand: prod.brand,
              price: prod.price,
              extracted_price: prod.extracted_price,
              img: prod.img,
              thumbnail: prod.thumbnail,
              link: prod.link,
              rating: prod.rating,
              reviews: prod.reviews,
              source: prod.source,
              description: prod.description,
              category: prod.category,
              size: prod.size,
              color: prod.color,
              quantity: prod.quantity,
              isFeatured: prod.isFeatured,
            },
            $setOnInsert: { createdAt: new Date() },
          },
          upsert: true,
        },
      }));

      if (ops.length > 0) {
        await Product.bulkWrite(ops);
        // Refresh products with their actual MongoDB _id
        const synced = await Product.find({
          serpapiId: { $in: products.map((p) => p.serpapiId) },
        }).lean();

        if (synced && synced.length > 0) {
          return synced;
        }
      }
    } catch (err) {
      logger.warn(`Failed to sync SerpAPI products to MongoDB: ${err.message}`);
    }
    return products;
  }

  /**
   * Fetch Google Shopping results from SerpAPI with caching and fallback
   */
  async fetchProducts({ forceRefresh = false, query = "shoes" } = {}) {
    const now = Date.now();
    const isCacheValid = this.cache.data && (now - this.cache.timestamp < this.cache.ttl);

    if (!forceRefresh && isCacheValid) {
      return {
        products: this.cache.data,
        brands: this.cache.brands,
        fromCache: true,
      };
    }

    const apiKey = config.SERPAPI_KEY || process.env.SERPAPI_KEY;

    if (apiKey) {
      try {
        const url = `https://serpapi.com/search.json?engine=google_shopping&q=${encodeURIComponent(query)}&location=India&api_key=${apiKey}`;
        logger.info(`Fetching live shopping results from SerpAPI for query="${query}"...`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        const response = await fetch(url, {
          headers: { Accept: "application/json" },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const json = await response.json();
          const shoppingResults = json.shopping_results || [];

          if (Array.isArray(shoppingResults) && shoppingResults.length > 0) {
            const normalized = shoppingResults.map((item, idx) => this.normalizeItem(item, idx));
            const brands = this.computeBrandStats(normalized);

            // Populate cache immediately for instant response
            this.cache.data = normalized;
            this.cache.brands = brands;
            this.cache.timestamp = now;

            // Sync to MongoDB in background without delaying user response
            this.syncToDatabase(normalized)
              .then((synced) => {
                if (synced && synced.length > 0) {
                  this.cache.data = synced;
                }
              })
              .catch((err) => {
                logger.warn(`Background SerpAPI sync failed: ${err.message}`);
              });

            logger.info(`Successfully fetched and normalized ${normalized.length} products from SerpAPI.`);
            return {
              products: normalized,
              brands,
              fromCache: false,
            };
          }
        } else {
          logger.warn(`SerpAPI request returned status ${response.status}: ${response.statusText}`);
        }
      } catch (err) {
        logger.warn(`SerpAPI fetch failed or timed out: ${err.message}. Using cached/database fallback.`);
      }
    }

    // Fallback: If cache has any data (even expired), return it
    if (this.cache.data && this.cache.data.length > 0) {
      return {
        products: this.cache.data,
        brands: this.cache.brands,
        fromCache: true,
      };
    }

    // Fallback to MongoDB database products
    try {
      const dbProducts = await Product.find().sort({ createdAt: -1 }).lean();
      if (dbProducts && dbProducts.length > 0) {
        const brands = this.computeBrandStats(dbProducts);
        this.cache.data = dbProducts;
        this.cache.brands = brands;
        this.cache.timestamp = now;
        return {
          products: dbProducts,
          brands,
          fromCache: true,
        };
      }
    } catch (err) {
      logger.error(`Database fallback failed: ${err.message}`);
    }

    return {
      products: [],
      brands: [{ name: "All", count: 0 }],
      fromCache: false,
    };
  }
}

module.exports = new SerpApiService();
