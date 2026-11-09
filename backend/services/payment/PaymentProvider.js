/**
 * Payment Provider Interface
 * Defines the contract for payment gateways (e.g. Stripe, Razorpay, Mock).
 */
class PaymentProvider {
  /**
   * Process a charge / payment authorization and capture.
   * @param {Object} params
   * @param {number} params.amount - Total amount to charge in USD
   * @param {string} params.currency - Currency code (e.g. 'USD')
   * @param {string} params.cardId - Registered card ID
   * @param {string} params.userId - User making payment
   * @param {string} [params.cvv] - Transient CVV for in-flight verification only (NEVER persisted)
   * @param {Object} [session] - Optional Mongoose session for transaction support
   * @returns {Promise<{ success: boolean, transactionId: string, message: string }>}
   */
  async processPayment(_params, _session = null) {
    throw new Error("processPayment must be implemented by payment provider");
  }

  /**
   * Process a refund for a cancelled or returned order.
   * @param {Object} params
   * @param {string} params.orderId
   * @param {number} params.amount
   * @param {string} [params.cardId]
   * @param {Object} [session] - Optional Mongoose session
   * @returns {Promise<{ success: boolean, refundId: string, message: string }>}
   */
  async processRefund(_params, _session = null) {
    throw new Error("processRefund must be implemented by payment provider");
  }
}

module.exports = PaymentProvider;
