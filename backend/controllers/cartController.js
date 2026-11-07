const cartService = require("../services/cart.service");
const Cart = require("../models/Cart");

class CartController {
  async getAll(req, res, next) {
    try {
      const carts = await Cart.find().populate("items.productId", "name price img brand").lean();
      res.status(200).json(carts);
    } catch (err) {
      next(err);
    }
  }

  async getByUserId(req, res, next) {
    try {
      const { userId } = req.params;
      if (req.user.id !== userId) {
        return res.status(403).json({ message: "Unauthorized access to this cart" });
      }

      const cart = await cartService.getCartByUserId(userId);
      res.status(200).json({
        message: "Get user cart successfully",
        cart,
      });
    } catch (error) {
      next(error);
    }
  }

  async addToCart(req, res, next) {
    try {
      const userId = req.user.id;
      const { productId, quantity, size, color } = req.body;
      const cart = await cartService.addToCart(userId, { productId, quantity, size, color });

      res.status(200).json({
        message: "Item added/updated successfully",
        cart,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateCartItem(req, res, next) {
    try {
      const userId = req.user.id;
      const { productId } = req.params;
      const { quantity, size, color } = req.body;

      const cart = await cartService.updateCartItem(userId, productId, { quantity, size, color });
      res.status(200).json({
        message: "Cart updated successfully",
        cart,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteCartItem(req, res, next) {
    try {
      const userId = req.user.id;
      const { productId } = req.params;
      const { size, color } = req.query;

      const cart = await cartService.deleteCartItem(userId, productId, size, color);
      res.status(200).json({
        message: "Item deleted successfully",
        cart,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CartController();
