const Cart = require("../models/Cart");
const Product = require("../models/Product");
const AppError = require("../utils/AppError");

class CartService {
  async getCartByUserId(userId) {
    let cart = await Cart.findOne({ userId })
      .populate("items.productId", "name price img brand quantity")
      .lean();

    if (!cart) {
      return { userId, items: [] };
    }
    return cart;
  }

  async addToCart(userId, { productId, quantity, size, color }) {
    const product = await Product.findById(productId);
    if (!product) {
      throw new AppError("Product not found", 404);
    }

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    const existingIndex = cart.items.findIndex(
      (item) =>
        item.productId.toString() === productId.toString() &&
        String(item.size) === String(size) &&
        item.color === color
    );

    if (existingIndex > -1) {
      cart.items[existingIndex].quantity += Number(quantity);
    } else {
      cart.items.push({
        productId,
        quantity: Number(quantity),
        size,
        color,
      });
    }

    await cart.save();
    return await Cart.findById(cart._id).populate("items.productId", "name price img brand");
  }

  async updateCartItem(userId, productId, { quantity, size, color }) {
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      throw new AppError("Cart not found", 404);
    }

    const itemIndex = cart.items.findIndex(
      (item) =>
        item.productId.toString() === productId.toString() &&
        (size === undefined || String(item.size) === String(size)) &&
        (color === undefined || item.color === color)
    );

    if (itemIndex === -1) {
      throw new AppError("Item not found in cart", 404);
    }

    if (Number(quantity) <= 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity = Number(quantity);
    }

    await cart.save();
    return await Cart.findById(cart._id).populate("items.productId", "name price img brand");
  }

  async deleteCartItem(userId, productId, size, color) {
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      throw new AppError("Cart not found", 404);
    }

    cart.items = cart.items.filter((item) => {
      const matchProduct = item.productId.toString() === productId.toString();
      if (!matchProduct) return true;
      if (size !== undefined && String(item.size) !== String(size)) return true;
      if (color !== undefined && item.color !== color) return true;
      return false;
    });

    await cart.save();
    return await Cart.findById(cart._id).populate("items.productId", "name price img brand");
  }
}

module.exports = new CartService();
