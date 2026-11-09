const express = require("express");
const router = express.Router();
const cardController = require("../controllers/cardController");
const verifyToken = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const { addCardSchema } = require("../validators/card.validator");

router.get("/", verifyToken, cardController.getMyCards);
router.post("/", verifyToken, validate({ body: addCardSchema }), cardController.addCard);
router.delete("/:cardId", verifyToken, cardController.deleteCard);

module.exports = router;
