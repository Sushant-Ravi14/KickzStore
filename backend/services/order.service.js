const mongoose = require("mongoose");
const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const Voucher = require("../models/Voucher");
const { paymentProvider } = require("./payment");
const AppError = require("../utils/AppError");

// In-memory LRU idempotency cache (keyed by idempotencyKey or user+cart payload hash)
const idempotencyMap = new Map();
const IDEMPOTENCY_TTL_MS = 60 * 1000; // 1 minute

let supportsTransactions = null;
async function isTransactionSupported() {
  if (supportsTransactions !== null) return supportsTransactions;
  try {
    const hello = await mongoose.connection.db.admin().command({ hello: 1 });
    supportsTransactions = Boolean(hello.setName || hello.msg === "isdbgrid");
  } catch (_e) {
    supportsTransactions = false;
  }
  return supportsTransactions;
}

class OrderService {
  async getAllOrders({ page = 1, limit = 50, status }) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const filter = {};
    if (status) filter.status = status;

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate("userId", "firstName lastName email")
        .populate("items.productId", "name price img brand")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Order.countDocuments(filter),
    ]);

    return {
      orders,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    };
  }

  async getUserOrders(userId) {
    return await Order.find({ userId })
      .populate("items.productId", "name price img brand")
      .sort({ createdAt: -1 })
      .lean();
  }

  async getOrderById(orderId, userId, isAdmin = false) {
    const query = { _id: orderId };
    if (!isAdmin) {
      query.userId = userId;
    }

    const order = await Order.findOne(query)
      .populate("items.productId", "name price img brand")
      .populate("cardId", "last4 brand cardHolderName")
      .lean();

    if (!order) {
      throw new AppError("Order not found", 404);
    }

    if (order.cardId && order.cardId.last4) {
      order.cardId.cardNumber = `**** **** **** ${order.cardId.last4}`;
    }

    return order;
  }

  async createOrder(userId, payload, idempotencyKey = null) {
    const {
      selectedItems,
      shippingMethod = "standard",
      address,
      paymentMethod = "cod",
      voucherCode,
      cardId,
      cvv, // transient only
    } = payload;

    // 1. Idempotency Check
    const key = idempotencyKey || `${userId}:${JSON.stringify(selectedItems)}`;
    const now = Date.now();
    if (idempotencyMap.has(key)) {
      const entry = idempotencyMap.get(key);
      if (now - entry.timestamp < IDEMPOTENCY_TTL_MS) {
        throw new AppError("An order with these items is already being processed. Please wait.", 409);
      }
    }
    idempotencyMap.set(key, { timestamp: now });

    // Periodically clean idempotency cache
    if (idempotencyMap.size > 1000) {
      for (const [k, v] of idempotencyMap.entries()) {
        if (now - v.timestamp > IDEMPOTENCY_TTL_MS) idempotencyMap.delete(k);
      }
    }

    // 2. Transaction Setup
    let session = null;
    let hasTransaction = false;

    if (await isTransactionSupported()) {
      try {
        session = await mongoose.startSession();
        session.startTransaction();
        hasTransaction = true;
      } catch (_sessionErr) {
        if (session) {
          try { session.endSession(); } catch (_) {}
        }
        session = null;
        hasTransaction = false;
      }
    }

    const sessionOpt = hasTransaction && session ? { session } : {};

    try {
      // 3. Retrieve user cart
      const cartQuery = Cart.findOne({ userId });
      if (hasTransaction) cartQuery.session(session);
      const cart = await cartQuery.populate("items.productId");
      if (!cart) {
        throw new AppError("Cart not found", 404);
      }

      // 4. Validate items against inventory and recompute prices server-side
      const orderItems = [];
      let calculatedSubtotal = 0;
      const stockUpdates = [];

      for (const item of selectedItems) {
        const found = cart.items.find(
          (ci) =>
            ci.productId &&
            (ci.productId._id ? ci.productId._id.toString() : ci.productId.toString()) === item.productId &&
            String(ci.size) === String(item.size) &&
            ci.color === item.color
        );

        if (!found) {
          throw new AppError(
            `Item ${item.productId} (size: ${item.size}, color: ${item.color}) is not in your cart.`,
            400
          );
        }

        const prodQuery = Product.findById(found.productId._id || found.productId);
        if (hasTransaction) prodQuery.session(session);
        const product = await prodQuery;

        if (!product) {
          throw new AppError("Product does not exist or was removed.", 404);
        }

        if (product.quantity < found.quantity) {
          throw new AppError(
            `Not enough stock for "${product.name}". Only ${product.quantity} remaining in stock.`,
            400
          );
        }

        const priceFromDb = Number(product.price);
        calculatedSubtotal += priceFromDb * found.quantity;

        orderItems.push({
          productId: product._id,
          quantity: found.quantity,
          price: priceFromDb,
        });

        // Stock decrement condition ensures quantity >= found.quantity to prevent race conditions
        stockUpdates.push({
          updateOne: {
            filter: { _id: product._id, quantity: { $gte: found.quantity } },
            update: { $inc: { quantity: -found.quantity } },
          },
        });
      }

      // 5. Server-Side Voucher Validation
      let discount = 0;
      let matchedVoucher = null;
      if (voucherCode && voucherCode.trim()) {
        const cleanCode = voucherCode.trim().toUpperCase();
        const vQuery = Voucher.findOne({ code: cleanCode });
        if (hasTransaction) vQuery.session(session);
        matchedVoucher = await vQuery;

        if (!matchedVoucher) {
          throw new AppError(`Voucher "${cleanCode}" does not exist.`, 400);
        }

        const voucherValidation = matchedVoucher.validateForOrder(userId, calculatedSubtotal);
        if (!voucherValidation.valid) {
          throw new AppError(voucherValidation.message, 400);
        }

        discount = voucherValidation.discountAmount;
      }

      const shippingFee = shippingMethod === "express" ? 5 : 0;
      const finalPrice = Math.max(0, Math.round((calculatedSubtotal - discount + shippingFee) * 100) / 100);

      // 6. Payment Processing via PaymentProvider
      let initialStatus = "pending";
      let paymentCardId = undefined;

      if (paymentMethod === "credit_card") {
        if (!cardId) {
          throw new AppError("Please select a saved card to complete payment.", 400);
        }
        if (!cvv || !/^\d{3,4}$/.test(String(cvv).trim())) {
          throw new AppError("Please provide a valid 3 or 4 digit security code (CVV).", 400);
        }

        const paymentResult = await paymentProvider.processPayment(
          {
            amount: finalPrice,
            currency: "USD",
            cardId,
            userId,
            cvv: String(cvv).trim(), // Transient only, never saved
          },
          session
        );

        if (!paymentResult.success) {
          throw new AppError(paymentResult.message || "Payment processing failed.", 400);
        }

        initialStatus = "paid";
        paymentCardId = cardId;
      }

      // 7. Create Order Document
      const newOrder = new Order({
        userId,
        items: orderItems,
        shippingMethod,
        shippingFee,
        address: address.trim(),
        paymentMethod,
        cardId: paymentCardId,
        voucherCode: matchedVoucher ? matchedVoucher.code : undefined,
        discount,
        totalPrice: finalPrice,
        status: initialStatus,
      });

      await newOrder.save(sessionOpt);

      // 8. Atomic Inventory Update with concurrency check
      if (stockUpdates.length > 0) {
        const bulkResult = await Product.bulkWrite(stockUpdates, sessionOpt);
        if (bulkResult.modifiedCount !== stockUpdates.length) {
          throw new AppError("Inventory changed during checkout. Please review cart and retry.", 409);
        }
      }

      // 9. Atomic Voucher Usage Recording
      if (matchedVoucher) {
        matchedVoucher.usedCount = (matchedVoucher.usedCount || 0) + 1;
        if (!matchedVoucher.usedBy.some((id) => id.toString() === userId.toString())) {
          matchedVoucher.usedBy.push(userId);
        }
        await matchedVoucher.save(sessionOpt);
      }

      // 10. Clean purchased items from Cart
      cart.items = cart.items.filter(
        (ci) =>
          !selectedItems.some(
            (si) =>
              ci.productId &&
              (ci.productId._id ? ci.productId._id.toString() : ci.productId.toString()) === si.productId &&
              String(ci.size) === String(si.size) &&
              ci.color === si.color
          )
      );
      await cart.save(sessionOpt);

      if (hasTransaction) {
        await session.commitTransaction();
      }

      return newOrder;
    } catch (err) {
      if (hasTransaction) {
        try { await session.abortTransaction(); } catch (_) {}
      }
      throw err;
    } finally {
      if (session) {
        try { session.endSession(); } catch (_) {}
      }
    }
  }

  async cancelOrder(orderId, userId) {
    let session = null;
    let hasTransaction = false;

    if (await isTransactionSupported()) {
      try {
        session = await mongoose.startSession();
        session.startTransaction();
        hasTransaction = true;
      } catch (_sessionErr) {
        if (session) {
          try { session.endSession(); } catch (_) {}
        }
        session = null;
        hasTransaction = false;
      }
    }

    const sessionOpt = hasTransaction && session ? { session } : {};

    try {
      const orderQuery = Order.findOne({ _id: orderId, userId });
      if (hasTransaction) orderQuery.session(session);
      const order = await orderQuery;

      if (!order) {
        throw new AppError("Order not found or unauthorized", 404);
      }

      if (!["pending", "paid"].includes(order.status)) {
        throw new AppError(
          `Cannot cancel order with status "${order.status}". Only "pending" or "paid" orders can be cancelled.`,
          400
        );
      }

      // Process mock/gateway refund
      if (order.status === "paid" && order.paymentMethod === "credit_card" && order.cardId) {
        await paymentProvider.processRefund(
          {
            orderId: order._id.toString(),
            amount: order.totalPrice,
            cardId: order.cardId.toString(),
          },
          session
        );
      }

      // Revert voucher usage if applied
      if (order.voucherCode) {
        const vQuery = Voucher.findOne({ code: order.voucherCode });
        if (hasTransaction) vQuery.session(session);
        const voucher = await vQuery;
        if (voucher) {
          voucher.usedCount = Math.max(0, (voucher.usedCount || 1) - 1);
          voucher.usedBy = voucher.usedBy.filter((id) => id.toString() !== userId.toString());
          await voucher.save(sessionOpt);
        }
      }

      // Restock items
      const stockUpdates = order.items.map((item) => ({
        updateOne: {
          filter: { _id: item.productId },
          update: { $inc: { quantity: item.quantity } },
        },
      }));

      if (stockUpdates.length > 0) {
        await Product.bulkWrite(stockUpdates, sessionOpt);
      }

      const previousStatus = order.status;
      order.status = "cancelled";
      const updatedOrder = await order.save(sessionOpt);

      if (hasTransaction) {
        await session.commitTransaction();
      }

      await updatedOrder.populate([
        { path: "items.productId", select: "name price img brand" },
        { path: "cardId", select: "last4 brand cardHolderName" },
      ]);

      return {
        order: updatedOrder,
        message:
          previousStatus === "paid"
            ? "Order cancelled and refunded successfully"
            : "Order cancelled successfully",
      };
    } catch (err) {
      if (hasTransaction) {
        try { await session.abortTransaction(); } catch (_) {}
      }
      throw err;
    } finally {
      if (session) {
        try { session.endSession(); } catch (_) {}
      }
    }
  }

  async updateOrderStatus(orderId, status) {
    const allowedStatuses = ["pending", "paid", "processing", "shipped", "completed", "cancelled"];
    if (!allowedStatuses.includes(status)) {
      throw new AppError(`Invalid status. Must be one of: ${allowedStatuses.join(", ")}`, 400);
    }

    const order = await Order.findByIdAndUpdate(orderId, { status }, { new: true });
    if (!order) {
      throw new AppError("Order not found", 404);
    }
    return order;
  }

  async deleteOrder(orderId, userId) {
    const deletedOrder = await Order.findOneAndDelete({
      _id: orderId,
      userId,
      status: "cancelled",
    });

    if (!deletedOrder) {
      const order = await Order.findOne({ _id: orderId, userId });
      if (!order) {
        throw new AppError("Order not found or unauthorized", 404);
      }
      throw new AppError(`Order cannot be deleted. Its status is "${order.status}", not "cancelled".`, 400);
    }

    return { message: "Order successfully deleted" };
  }
}

module.exports = new OrderService();
