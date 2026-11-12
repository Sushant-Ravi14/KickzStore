module.exports = {
  openapi: "3.0.0",
  info: {
    title: "KickzStore E-Commerce API",
    version: "1.0.0",
    description: "Production-grade RESTful API for KickzStore sneaker e-commerce platform.",
    contact: {
      name: "KickzStore Engineering Team",
    },
  },
  servers: [
    {
      url: "/api",
      description: "Default API gateway",
    },
    {
      url: "/api/v1",
      description: "API v1 Endpoint",
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Enter your JWT access token",
      },
    },
    schemas: {
      StandardResponse: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
          data: { type: "object" },
          errors: { type: "array", items: { type: "object" } },
        },
      },
      Product: {
        type: "object",
        properties: {
          _id: { type: "string" },
          name: { type: "string" },
          price: { type: "number" },
          brand: { type: "string" },
          category: { type: "string" },
          quantity: { type: "number" },
          description: { type: "string" },
          img: { type: "array", items: { type: "string" } },
          sizes: { type: "array", items: { type: "string" } },
          colors: { type: "array", items: { type: "string" } },
        },
      },
      Order: {
        type: "object",
        properties: {
          _id: { type: "string" },
          userId: { type: "string" },
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                productId: { type: "string" },
                quantity: { type: "number" },
                price: { type: "number" },
              },
            },
          },
          shippingMethod: { type: "string", enum: ["standard", "express"] },
          shippingFee: { type: "number" },
          address: { type: "string" },
          paymentMethod: { type: "string", enum: ["credit_card", "paypal", "cod"] },
          cardId: { type: "string" },
          voucherCode: { type: "string" },
          discount: { type: "number" },
          totalPrice: { type: "number" },
          status: { type: "string", enum: ["pending", "paid", "processing", "shipped", "completed", "cancelled"] },
          createdAt: { type: "string" },
        },
      },
    },
  },
  paths: {
    "/health": {
      get: {
        summary: "Health Check",
        description: "Returns server uptime and database connection status.",
        responses: {
          200: { description: "Service is healthy" },
          503: { description: "Service is unhealthy" },
        },
      },
    },
    "/auth/register": {
      post: {
        summary: "Register new user",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["firstName", "lastName", "email", "password"],
                properties: {
                  firstName: { type: "string" },
                  lastName: { type: "string" },
                  email: { type: "string" },
                  password: { type: "string" },
                  phoneNumber: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "User registered successfully" },
          400: { description: "Validation error or email already in use" },
        },
      },
    },
    "/auth/login": {
      post: {
        summary: "Authenticate user and issue tokens",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string" },
                  password: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Authentication successful, returns access & refresh tokens" },
          401: { description: "Invalid credentials" },
        },
      },
    },
    "/auth/refresh-token": {
      post: {
        summary: "Rotate refresh token and issue new access token",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["refreshToken"],
                properties: {
                  refreshToken: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Tokens renewed successfully" },
          401: { description: "Invalid or expired refresh token" },
        },
      },
    },
    "/products": {
      get: {
        summary: "List catalog products with pagination and filters",
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
          { name: "brand", in: "query", schema: { type: "string" } },
          { name: "category", in: "query", schema: { type: "string" } },
          { name: "sort", in: "query", schema: { type: "string" } },
        ],
        responses: {
          200: { description: "List of products" },
        },
      },
    },
    "/orders": {
      post: {
        security: [{ BearerAuth: [] }],
        summary: "Create an order",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["selectedItems", "address"],
                properties: {
                  selectedItems: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        productId: { type: "string" },
                        size: { type: "string" },
                        color: { type: "string" },
                      },
                    },
                  },
                  shippingMethod: { type: "string", enum: ["standard", "express"] },
                  address: { type: "string" },
                  paymentMethod: { type: "string", enum: ["credit_card", "paypal", "cod"] },
                  cardId: { type: "string" },
                  cvv: { type: "string", description: "Transient in-flight check only. Never stored." },
                  voucherCode: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Order created successfully" },
          400: { description: "Invalid order payload or payment failed" },
        },
      },
    },
    "/vouchers/validate": {
      post: {
        security: [{ BearerAuth: [] }],
        summary: "Validate a voucher code and calculate discount",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["code"],
                properties: {
                  code: { type: "string" },
                  orderSubtotal: { type: "number" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Voucher valid" },
          400: { description: "Voucher invalid or conditions not met" },
        },
      },
    },
  },
};
