const express = require("express");
const router = express.Router();
const voucherController = require("../controllers/voucherController");
const verifyToken = require("../middlewares/auth");
const checkAdmin = require("../middlewares/admin");
const validate = require("../middlewares/validate");
const {
  createVoucherSchema,
  updateVoucherSchema,
  validateVoucherCodeSchema,
} = require("../validators/voucher.validator");

router.post("/validate", verifyToken, validate({ body: validateVoucherCodeSchema }), voucherController.validateCode);
router.post("/", verifyToken, checkAdmin, validate({ body: createVoucherSchema }), voucherController.create);
router.put("/:id", verifyToken, checkAdmin, validate({ body: updateVoucherSchema }), voucherController.update);
router.delete("/:id", verifyToken, checkAdmin, voucherController.delete);
router.get("/", voucherController.getAll);
router.get("/:id", voucherController.getById);

module.exports = router;
