const request = require("supertest");
const { app } = require("../server");
const User = require("../models/User");

describe("Admin Authorization Middleware & Protection", () => {
  let customerToken;
  let adminToken;

  beforeEach(async () => {
    // Register regular customer
    const custRes = await request(app).post("/api/v1/auth/register").send({
      firstName: "Customer",
      lastName: "User",
      email: "cust@kickzstore.com",
      password: "Password123!",
    });
    customerToken = custRes.body.token;

    // Create verified admin in DB
    const admin = await User.create({
      firstName: "Super",
      lastName: "Admin",
      email: "admin@kickzstore.com",
      password: "hashedPassword123",
      role: "admin",
      isActive: true,
    });

    const jwt = require("jsonwebtoken");
    const config = require("../config/env");
    adminToken = jwt.sign(
      { id: admin._id, role: "admin", email: admin.email },
      config.JWT_SECRET,
      { expiresIn: "1h" }
    );
  });

  it("should block non-admin users from admin dashboard routes with 403 Forbidden", async () => {
    const res = await request(app)
      .get("/api/v1/admin/dashboard-stats")
      .set("Authorization", `Bearer ${customerToken}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/Administrator privileges required|Access denied/i);
  });

  it("should allow verified admin users to access admin routes", async () => {
    const res = await request(app)
      .get("/api/v1/admin/dashboard-stats")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toBeDefined();
  });
});
