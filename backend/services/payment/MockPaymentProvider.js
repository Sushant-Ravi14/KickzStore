/**
 * MockPaymentProvider
 * 
 * DEMO / SIMULATION ONLY:
 * Simulates a payment gateway without hitting a real processor like Stripe or Razorpay.
 * Verifies transient CVV in-flight, checks simulated mockBalance on the user's card,
 * and deducts the charge atomically. Ready to be replaced by StripePaymentProvider in production.
 */
const PaymentProvider = require("./PaymentProvider");
const Card = require("../../models/Card");

class MockPaymentProvider extends PaymentProvider {
  constructor() {
    super();
    this.providerName = "MockGateway (Dev Simulation)";
  }

  async processPayment({ amount, currency = "USD", cardId, userId, cvv }, session = null) {
    if (!cardId) {
      return { success: false, message: "Payment failed: No payment card selected." };
    }
    if (!amount || amount <= 0) {
      return { success: false, message: "Payment failed: Invalid charge amount." };
    }

    const sessionOpt = session ? { session } : {};
    const cardQuery = Card.findOne({ _id: cardId, userId });
    if (session) cardQuery.session(session);

    const card = await cardQuery;
    if (!card) {
      return { success: false, message: "Payment failed: Card not found or unauthorized." };
    }

    // In-flight CVV sanity check (3 or 4 digits) - CVV is NOT stored
    if (cvv && !/^\d{3,4}$/.test(cvv.trim())) {
      return { success: false, message: "Payment failed: Invalid security code (CVV) format." };
    }

    const currentBalance = card.mockBalance ?? 0;
    if (currentBalance < amount) {
      return {
        success: false,
        message: `Insufficient funds in mock card account. Balance: $${currentBalance.toFixed(2)}, Required: $${amount.toFixed(2)}.`,
      };
    }

    // Deduct mock balance
    card.mockBalance = currentBalance - amount;
    await card.save(sessionOpt);

    const transactionId = `txn_mock_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    return {
      success: true,
      transactionId,
      provider: this.providerName,
      amount,
      currency,
      message: "Mock payment authorized and captured successfully.",
    };
  }

  async processRefund({ orderId, amount, cardId }, session = null) {
    if (cardId) {
      const sessionOpt = session ? { session } : {};
      const cardQuery = Card.findById(cardId);
      if (session) cardQuery.session(session);

      const card = await cardQuery;
      if (card) {
        card.mockBalance = (card.mockBalance || 0) + amount;
        await card.save(sessionOpt);
      }
    }

    const refundId = `ref_mock_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    return {
      success: true,
      refundId,
      orderId,
      amount,
      message: "Mock refund processed successfully.",
    };
  }
}

module.exports = MockPaymentProvider;
