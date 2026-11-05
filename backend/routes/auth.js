const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const verifyToken = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const { registerSchema, loginSchema, refreshTokenSchema } = require("../validators/auth.validator");

router.post("/register", validate({ body: registerSchema }), authController.register);
router.post("/login", validate({ body: loginSchema }), authController.login);
router.post("/refresh-token", validate({ body: refreshTokenSchema }), authController.refreshToken);
router.post("/logout", verifyToken, authController.logout);

module.exports = router;
