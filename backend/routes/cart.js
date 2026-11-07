const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cartController");
const verifyToken = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const { addToCartSchema, updateCartItemSchema } = require("../validators/cart.validator");

router.get("/", cartController.getAll);
router.get("/user/:userId", verifyToken, cartController.getByUserId);
router.post("/", verifyToken, validate({ body: addToCartSchema }), cartController.addToCart);
router.put("/:productId", verifyToken, validate({ body: updateCartItemSchema }), cartController.updateCartItem);
router.delete("/:productId", verifyToken, cartController.deleteCartItem);

module.exports = router;
