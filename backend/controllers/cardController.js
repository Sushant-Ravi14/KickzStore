const Card = require("../models/Card");

function detectCardBrand(cardNumber) {
  const clean = cardNumber.replace(/\D/g, "");
  if (/^4/.test(clean)) return "Visa";
  if (/^(5[1-5]|2[2-7])/.test(clean)) return "Mastercard";
  if (/^3[47]/.test(clean)) return "Amex";
  if (/^6(?:011|5)/.test(clean)) return "Discover";
  return "Other";
}

class CardController {
  async getMyCards(req, res) {
    try {
      const userId = req.user.id;
      const cards = await Card.find({ userId })
        .select("-__v")
        .sort({ createdAt: -1 });

      res.status(200).json(cards);
    } catch (err) {
      res.status(500).json({ message: "Error fetching cards", error: err.message });
    }
  }

  async addCard(req, res) {
    try {
      const userId = req.user.id;
      const { cardName, cardNumber, cardHolderName, expiryDate, cvv } = req.body;

      if (!cardNumber || !cardName || !cardHolderName || !expiryDate) {
        return res.status(400).json({ message: "Missing required card details." });
      }

      const cleanNumber = cardNumber.replace(/\D/g, "");
      if (cleanNumber.length < 13 || cleanNumber.length > 19) {
        return res.status(400).json({ message: "Invalid card number length." });
      }

      // CVV format validation only (NEVER stored or saved to DB)
      if (cvv && !/^\d{3,4}$/.test(cvv.trim())) {
        return res.status(400).json({ message: "Invalid CVV format." });
      }

      const last4 = cleanNumber.slice(-4);
      const brand = detectCardBrand(cleanNumber);

      // Check if user already added this exact card
      const existing = await Card.findOne({ userId, last4, brand });
      if (existing) {
        return res.status(400).json({ message: "This card is already saved in your wallet." });
      }

      const paymentToken = `tok_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      const newCard = new Card({
        userId,
        cardName: cardName.trim(),
        cardHolderName: cardHolderName.trim(),
        last4,
        brand,
        expiryDate: expiryDate.trim(),
        paymentToken,
        mockBalance: 5000,
      });

      await newCard.save();

      res.status(201).json({
        message: "Card added successfully (CVV discarded per PCI-DSS)",
        card: newCard,
      });
    } catch (err) {
      res.status(500).json({ message: "Error adding card", error: err.message });
    }
  }

  async deleteCard(req, res) {
    try {
      const userId = req.user.id;
      const { cardId } = req.params;
      const deletedCard = await Card.findOneAndDelete({ _id: cardId, userId });

      if (!deletedCard) {
        return res.status(404).json({ message: "Card not found or unauthorized" });
      }
      res.status(200).json({ message: "Card deleted successfully" });
    } catch (err) {
      res.status(500).json({ message: "Error deleting card", error: err.message });
    }
  }
}

module.exports = new CardController();
