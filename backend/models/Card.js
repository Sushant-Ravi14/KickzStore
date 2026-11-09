/**
 * Card Model (PCI-DSS Compliant)
 * 
 * SECURITY RULES:
 * 1. CVV is NEVER stored, logged, or persisted to database.
 * 2. Full card numbers are NEVER persisted; only last 4 digits (last4) are stored for UI display.
 * 3. Payment operations are routed through the PaymentProvider abstraction.
 */
const mongoose = require("mongoose");
const schema = mongoose.Schema;

const CardSchema = new schema(
  {
    userId: { type: schema.Types.ObjectId, ref: "User", required: true, index: true },
    cardName: {
      type: String,
      trim: true,
      default: function () {
        return `${this.brand || "Card"} •••• ${this.last4}`;
      },
    },
    cardHolderName: { type: String, required: true, trim: true },
    // PCI-DSS: Only last 4 digits stored
    last4: { type: String, required: true, minlength: 4, maxlength: 4 },
    brand: {
      type: String,
      enum: ["Visa", "Mastercard", "Amex", "Discover", "Other"],
      default: "Visa",
    },
    expiryDate: { type: String, required: true, trim: true },
    // Tokenized reference for Payment Provider (Stripe / Razorpay / Mock)
    paymentToken: { type: String, unique: true, sparse: true },
    // Mock balance strictly for educational/demo simulation
    mockBalance: { type: Number, default: 5000 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual helper for masked card number display in legacy frontend templates
CardSchema.virtual("cardNumber").get(function () {
  return `**** **** **** ${this.last4}`;
});

// Alias balance -> mockBalance for seamless backwards compatibility
CardSchema.virtual("balance").get(function () {
  return this.mockBalance;
});

module.exports = mongoose.model("Card", CardSchema, "cards");
