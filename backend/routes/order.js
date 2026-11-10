const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const verifyToken = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const { createOrderSchema, updateOrderStatusSchema } = require("../validators/order.validator");

router.delete("/:orderId", verifyToken, orderController.deleteOrder);
router.put("/:orderId/cancel", verifyToken, orderController.cancelOrder);
router.get("/detail/:orderId", verifyToken, orderController.getOrderDetail);
router.get("/:userId", verifyToken, orderController.getByUser);
router.post("/", verifyToken, validate({ body: createOrderSchema }), orderController.createOrder);
router.get("/", verifyToken, orderController.getAll);
router.put("/:orderId/status", verifyToken, validate({ body: updateOrderStatusSchema }), orderController.updateStatus);

module.exports = router;
