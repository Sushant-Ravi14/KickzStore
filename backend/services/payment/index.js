const MockPaymentProvider = require("./MockPaymentProvider");

// Export active payment provider instance (can be switched via env in future)
const activePaymentProvider = new MockPaymentProvider();

module.exports = {
  paymentProvider: activePaymentProvider,
  MockPaymentProvider,
};
