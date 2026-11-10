const express = require("express");
const router = express.Router();
const wishlistController = require("../controllers/wishlistController");
const verifyToken = require("../middlewares/auth");

router.get("/mine", verifyToken, (req, res) => {
  req.params.userId = req.user.id;
  return wishlistController.getByUser(req, res);
});
router.get("/user/:userId", verifyToken, wishlistController.getByUser);
router.get("/", wishlistController.getAll);
router.post("/", verifyToken, wishlistController.addToWishlist);
router.delete("/:productId", verifyToken, wishlistController.removeFromWishlist);

module.exports = router;
