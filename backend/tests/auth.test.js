const request = require("supertest");
const { app } = require("../server");
const User = require("../models/User");

describe("Auth Service & Controller Integration", () => {
  const testUser = {
    firstName: "Test",
    lastName: "User",
    email: "test@kickzstore.com",
    password: "Password123!",
  };

  it("should register a new customer successfully", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send(testUser);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
    expect(res.body.user.email).toBe(testUser.email);
    expect(res.body.user.role).toBe("user");
  });

  it("should reject duplicate email registration", async () => {
    await request(app).post("/api/v1/auth/register").send(testUser);

    const duplicateRes = await request(app)
      .post("/api/v1/auth/register")
      .send(testUser);

    expect(duplicateRes.status).toBe(400);
    expect(duplicateRes.body.message).toMatch(/already registered|already exists/i);
  });

  it("should login registered user and return tokens", async () => {
    await request(app).post("/api/v1/auth/register").send(testUser);

    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: testUser.email, password: testUser.password });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);
    expect(loginRes.body.accessToken).toBeDefined();
    expect(loginRes.body.refreshToken).toBeDefined();
  });

  it("should reject invalid login credentials", async () => {
    await request(app).post("/api/v1/auth/register").send(testUser);

    const failRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: testUser.email, password: "WrongPassword" });

    expect(failRes.status).toBe(401);
  });

  it("should rotate refresh tokens successfully", async () => {
    const regRes = await request(app).post("/api/v1/auth/register").send(testUser);
    const { refreshToken } = regRes.body;

    const refreshRes = await request(app)
      .post("/api/v1/auth/refresh-token")
      .send({ refreshToken });

    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.accessToken).toBeDefined();
    expect(refreshRes.body.refreshToken).toBeDefined();
    expect(refreshRes.body.refreshToken).not.toBe(refreshToken);
  });

  it("should invalidate refresh token on logout", async () => {
    const regRes = await request(app).post("/api/v1/auth/register").send(testUser);
    const { token, refreshToken } = regRes.body;

    const logoutRes = await request(app)
      .post("/api/v1/auth/logout")
      .set("Authorization", `Bearer ${token}`)
      .send({ refreshToken });

    expect(logoutRes.status).toBe(200);

    // Old refresh token must be rejected
    const reuseRes = await request(app)
      .post("/api/v1/auth/refresh-token")
      .send({ refreshToken });

    expect(reuseRes.status).toBe(401);
  });
});
