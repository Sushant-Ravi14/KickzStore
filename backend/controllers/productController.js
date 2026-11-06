const productService = require("../services/product.service");
const Product = require("../models/Product");

class ProductController {
  async getAll(req, res, next) {
    try {
      const {
        brand,
        category,
        featured,
        isFeatured,
        page,
        limit,
        sort,
        q,
        refresh,
        format,
      } = req.query;
      const featuredParam = isFeatured !== undefined ? isFeatured : featured;

      const result = await productService.getProducts({
        brand,
        category,
        isFeatured: featuredParam,
        page,
        limit,
        sort,
        q,
        refresh,
      });

      if (format === "full" || page || limit) {
        return res.status(200).json({
          products: result.products,
          brands: result.brands,
          pagination: result.pagination,
        });
      }

      res.status(200).json(result.products);
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const product = await productService.getProductById(id);
      res.status(200).json(product);
    } catch (err) {
      next(err);
    }
  }

  async search(req, res, next) {
    try {
      const query = req.query.q?.trim();
      if (!query) {
        return res.status(400).json({ message: "Missing search query" });
      }

      const products = await productService.searchProducts(query);
      res.status(200).json(products);
    } catch (err) {
      next(err);
    }
  }

  async getBrands(req, res, next) {
    try {
      const brands = await productService.getBrands();
      res.status(200).json(brands);
    } catch (err) {
      next(err);
    }
  }

  async getCategories(req, res, next) {
    try {
      const categories = await productService.getCategories();
      res.status(200).json(categories);
    } catch (err) {
      next(err);
    }
  }

  async getByPrice(req, res, next) {
    try {
      const products = await Product.find({}).sort({ price: -1 }).limit(10).lean();
      res.status(200).json(products);
    } catch (err) {
      next(err);
    }
  }

  async getByQuantity(req, res, next) {
    try {
      const products = await Product.find({}).sort({ quantity: -1 }).limit(10).lean();
      res.status(200).json(products);
    } catch (err) {
      next(err);
    }
  }

  async getByColorCount(req, res, next) {
    try {
      const products = await Product.aggregate([
        { $project: { name: 1, brand: 1, colorCount: { $size: "$color" } } },
        { $sort: { colorCount: -1 } },
        { $limit: 10 },
      ]);
      res.status(200).json(products);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ProductController();
