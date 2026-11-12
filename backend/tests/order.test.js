const request = require("supertest");
const { app } = require("../server");
const Product = require("../models/Product");
const User = require("../models/User");
const Voucher = require("../models/Voucher");
const Card = require("../models/Card");
const Cart = require("../models/Cart");

describe("Order Service & Controller (Atomic Transactions & Security)", () => {
  let authToken;
  let userId;
  let testProduct;
  let testCard;
  let testVoucher;

  beforeEach(async () => {
    // 1. Create User
    const regRes = await request(app)
      .post("/api/v1/auth/register")
      .send({
        firstName: "Order",
        lastName: "Tester",
        email: "order-test@kickzstore.com",
        password: "Password123!",
      });

    authToken = regRes.body.token;
    userId = regRes.body.user._id || regRes.body.user.id;

    // 2. Create Product
    testProduct = await Product.create({
      name: "Air Jordan 4 Military Black",
      price: 200,
      quantity: 5,
      brand: "Jordan",
      category: "Basketball",
      img: "https://example.com/jordan4.png",
      size: [42],
      color: ["Black"],
    });

    // 3. Create Card for user (PCI-DSS compliant, no CVV stored)
    testCard = await Card.create({
      userId,
      cardName: "Demo Visa",
      last4: "4242",
      brand: "Visa",
      cardHolderName: "Order Tester",
      expiryDate: "12/28",
      mockBalance: 1000,
    });

    // 4. Create Voucher
    testVoucher = await Voucher.create({
      code: "TEST10",
      description: "10% off",
      discountType: "percent",
      discountValue: 10,
      minOrderValue: 50,
      usageLimit: 10,
      usedCount: 0,
      startDate: new Date("2026-01-01"),
      endDate: new Date("2027-12-31"),
      isActive: true,
    });

    // 5. Add item to user cart
    await request(app)
      .post("/api/v1/carts")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        productId: testProduct._id.toString(),
        quantity: 2,
        size: 42,
        color: "Black",
      });
  });

  it("should create order with voucher, deduct mock balance, and decrement inventory atomically", async () => {
    const orderPayload = {
      selectedItems: [
        {
          productId: testProduct._id.toString(),
          size: 42,
          color: "Black",
        },
      ],
      shippingMethod: "standard",
      address: "123 Sneaker St, NYC",
      paymentMethod: "credit_card",
      cardId: testCard._id.toString(),
      cvv: "123", // transient CVV
      voucherCode: "TEST10",
    };

    const res = await request(app)
      .post("/api/v1/orders")
      .set("Authorization", `Bearer ${authToken}`)
      .send(orderPayload);

    expect(res.status).toBe(201);
    expect(res.body.order).toBeDefined();
    expect(res.body.order.status).toBe("paid");
    // Subtotal: 200 * 2 = 400. 10% discount = 40. Final = 360.
    expect(res.body.order.discount).toBe(40);
    expect(res.body.order.totalPrice).toBe(360);

    // Verify inventory decremented
    const updatedProduct = await Product.findById(testProduct._id);
    expect(updatedProduct.quantity).toBe(3); // 5 - 2 = 3

    // Verify voucher usage recorded
    const updatedVoucher = await Voucher.findById(testVoucher._id);
    expect(updatedVoucher.usedCount).toBe(1);

    // Verify mock card balance deducted
    const updatedCard = await Card.findById(testCard._id);
    expect(updatedCard.mockBalance).toBe(640); // 1000 - 360 = 640

    // Verify CVV was NEVER stored
    const orderDoc = res.body.order;
    expect(orderDoc.cvv).toBeUndefined();
    expect(updatedCard.cvv).toBeUndefined();
  });

  it("should reject checkout when stock is insufficient", async () => {
    // Attempt to checkout 10 items when only 5 exist
    await request(app)
      .put(`/api/v1/carts/${testProduct._id.toString()}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({ quantity: 10, size: 42, color: "Black" });

    const orderPayload = {
      selectedItems: [
        {
          productId: testProduct._id.toString(),
          size: 42,
          color: "Black",
        },
      ],
      shippingMethod: "standard",
      address: "123 Sneaker St, NYC",
      paymentMethod: "cod",
    };

    const res = await request(app)
      .post("/api/v1/orders")
      .set("Authorization", `Bearer ${authToken}`)
      .send(orderPayload);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/not enough stock/i);

    // Ensure inventory remains unchanged
    const productAfter = await Product.findById(testProduct._id);
    expect(productAfter.quantity).toBe(5);
  });

  it("should cancel order, restock inventory, and refund mock balance", async () => {
    // 1. Create order
    const createRes = await request(app)
      .post("/api/v1/orders")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        selectedItems: [
          {
            productId: testProduct._id.toString(),
            size: 42,
            color: "Black",
          },
        ],
        shippingMethod: "standard",
        address: "123 Sneaker St",
        paymentMethod: "credit_card",
        cardId: testCard._id.toString(),
        cvv: "123",
      });

    const orderId = createRes.body.order._id;

    // 2. Cancel order
    const cancelRes = await request(app)
      .put(`/api/v1/orders/${orderId}/cancel`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.order.status).toBe("cancelled");

    // Inventory restocked back to 5
    const restockedProduct = await Product.findById(testProduct._id);
    expect(restockedProduct.quantity).toBe(5);

    // Balance refunded back to 1000
    const refundedCard = await Card.findById(testCard._id);
    expect(refundedCard.mockBalance).toBe(1000);
  });
});
