const orderService = require("../services/order.service");

class OrderController {
  async getAll(req, res, next) {
    try {
      const { page, limit, status } = req.query;
      const result = await orderService.getAllOrders({ page, limit, status });
      res.status(200).json(result.orders);
    } catch (err) {
      next(err);
    }
  }

  async getByUser(req, res, next) {
    try {
      const { userId } = req.params;
      if (req.user.id !== userId) {
        return res.status(403).json({ message: "Unauthorized access" });
      }
      const orders = await orderService.getUserOrders(userId);
      res.status(200).json({
        message: "Get orders successfully",
        count: orders.length,
        orders,
      });
    } catch (err) {
      next(err);
    }
  }

  async getOrderDetail(req, res, next) {
    try {
      const { orderId } = req.params;
      const userId = req.user.id;
      const order = await orderService.getOrderById(orderId, userId);
      res.status(200).json({ message: "Get order detail successfully", order });
    } catch (err) {
      next(err);
    }
  }

  async createOrder(req, res, next) {
    try {
      const userId = req.user.id;
      const idempotencyKey = req.headers["idempotency-key"];
      const order = await orderService.createOrder(userId, req.body, idempotencyKey);

      res.status(201).json({
        message: order.status === "paid" ? "Order placed and paid successfully" : "Order placed successfully",
        order,
      });
    } catch (err) {
      next(err);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const { orderId } = req.params;
      const { status } = req.body;
      const order = await orderService.updateOrderStatus(orderId, status);
      res.status(200).json({ message: "Order status updated", order });
    } catch (err) {
      next(err);
    }
  }

  async cancelOrder(req, res, next) {
    try {
      const { orderId } = req.params;
      const userId = req.user.id;
      const result = await orderService.cancelOrder(orderId, userId);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async deleteOrder(req, res, next) {
    try {
      const { orderId } = req.params;
      const userId = req.user.id;
      const result = await orderService.deleteOrder(orderId, userId);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new OrderController();
