const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });

const User = require("../models/User");
const Brand = require("../models/Brand");
const Category = require("../models/Category");
const Product = require("../models/Product");
const Voucher = require("../models/Voucher");
const Card = require("../models/Card");

const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/KickzStore_dev";
const dbName = process.env.DBNAME || "KickzStore_dev";

async function seed() {
  try {
    console.log(`Connecting to MongoDB (${mongoUri})...`);
    await mongoose.connect(mongoUri, { dbName });
    console.log("Connected successfully!");

    // 1. Seed Users
    console.log("Seeding users...");
    await User.deleteMany({});
    const salt = await bcrypt.genSalt(10);
    const adminPassword = await bcrypt.hash("admin123", salt);
    const userPassword = await bcrypt.hash("user123", salt);

    const adminUser = await User.create({
      firstName: "Admin",
      lastName: "Kickz",
      email: "admin@kickzstore.com",
      password: adminPassword,
      role: "admin",
      gender: "M",
      phone: "+1 555-0100",
      dateOfBirth: new Date("1990-01-01"),
      address: {
        street: "1 Admin Tower",
        city: "San Francisco",
        district: "Downtown",
        country: "USA",
      },
    });

    const regularUser = await User.create({
      firstName: "John",
      lastName: "Doe",
      email: "user@kickzstore.com",
      password: userPassword,
      role: "user",
      gender: "M",
      phone: "+1 555-0199",
      dateOfBirth: new Date("1998-05-15"),
      address: {
        street: "123 Sneaker Street",
        city: "New York",
        district: "Manhattan",
        country: "USA",
      },
    });

    console.log("Users created:");
    console.log(" - Admin: admin@kickzstore.com (password: admin123)");
    console.log(" - User:  user@kickzstore.com (password: user123)");

    // 2. Seed Brands
    console.log("Seeding brands...");
    await Brand.deleteMany({});
    const brands = await Brand.insertMany([
      { name: "Nike", logoUrl: "https://cdn-icons-png.flaticon.com/512/732/732229.png" },
      { name: "Adidas", logoUrl: "https://cdn-icons-png.flaticon.com/512/732/732179.png" },
      { name: "Jordan", logoUrl: "https://cdn-icons-png.flaticon.com/512/882/882736.png" },
      { name: "Puma", logoUrl: "https://cdn-icons-png.flaticon.com/512/732/732238.png" },
      { name: "Converse", logoUrl: "https://cdn-icons-png.flaticon.com/512/732/732204.png" },
    ]);
    console.log(`Seeded ${brands.length} brands.`);

    // 3. Seed Categories
    console.log("Seeding categories...");
    await Category.deleteMany({});
    const categories = await Category.insertMany([
      { name: "Running", imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff" },
      { name: "Basketball", imageUrl: "https://images.unsplash.com/photo-1552346154-21d32810aba3" },
      { name: "Lifestyle", imageUrl: "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77" },
      { name: "Skateboarding", imageUrl: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a" },
    ]);
    console.log(`Seeded ${categories.length} categories.`);

    // 4. Seed Products
    console.log("Seeding products...");
    await Product.deleteMany({});
    const products = await Product.insertMany([
      {
        name: "Air Jordan 1 Retro High OG",
        description: "The classic high-top basketball sneaker that started a global revolution.",
        price: 180,
        quantity: 30,
        img: "https://images.unsplash.com/photo-1552346154-21d32810aba3",
        brand: "Jordan",
        category: "Basketball",
        size: [40, 41, 42, 43, 44],
        color: ["Red", "Black", "White"],
        isFeatured: true,
      },
      {
        name: "Nike Air Force 1 '07",
        description: "The radiance lives on with this iconic b-ball classic in pristine white.",
        price: 115,
        quantity: 45,
        img: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a",
        brand: "Nike",
        category: "Lifestyle",
        size: [39, 40, 41, 42, 43],
        color: ["White"],
        isFeatured: true,
      },
      {
        name: "Nike Dunk Low Retro",
        description: "Created for the hardwood but taken to the streets, featuring crisp overlays.",
        price: 120,
        quantity: 25,
        img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff",
        brand: "Nike",
        category: "Lifestyle",
        size: [40, 41, 42, 43],
        color: ["Black", "White", "Blue"],
        isFeatured: true,
      },
      {
        name: "Adidas Ultraboost Light",
        description: "Experience epic energy return with our lightest Boost cushioning ever.",
        price: 190,
        quantity: 20,
        img: "https://images.unsplash.com/photo-1587563871167-1ee9c731aefb",
        brand: "Adidas",
        category: "Running",
        size: [40, 41, 42, 43, 44],
        color: ["Black", "White"],
        isFeatured: true,
      },
      {
        name: "Adidas Samba Classic",
        description: "Legendary indoor soccer shoe that transitioned into an effortless streetwear staple.",
        price: 100,
        quantity: 40,
        img: "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77",
        brand: "Adidas",
        category: "Lifestyle",
        size: [40, 41, 42, 43],
        color: ["White", "Black"],
        isFeatured: false,
      },
      {
        name: "Puma Suede Classic",
        description: "An undisputed icon since 1968, worn by the greats of every generation.",
        price: 75,
        quantity: 50,
        img: "https://images.unsplash.com/photo-1608231387042-66d1773070a5",
        brand: "Puma",
        category: "Lifestyle",
        size: [39, 40, 41, 42, 43],
        color: ["Black", "Red", "Navy"],
        isFeatured: false,
      },
      {
        name: "Puma Velocity Nitro 2",
        description: "All-in-one neutral running shoe for any distance, lightweight and responsive.",
        price: 130,
        quantity: 15,
        img: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa",
        brand: "Puma",
        category: "Running",
        size: [41, 42, 43],
        color: ["Green", "Black"],
        isFeatured: false,
      },
      {
        name: "Converse Chuck 70 Vintage High",
        description: "Built off the original 1970s design with premium materials and extra arch support.",
        price: 90,
        quantity: 60,
        img: "https://images.unsplash.com/photo-1607522370275-f14206abe5d3",
        brand: "Converse",
        category: "Lifestyle",
        size: [38, 39, 40, 41, 42, 43],
        color: ["Black", "Parchment"],
        isFeatured: true,
      },
      {
        name: "Air Jordan 4 Retro Military Black",
        description: "Smooth white leather with neutral grey overlays and contrasting black accents.",
        price: 210,
        quantity: 15,
        img: "https://images.unsplash.com/photo-1579338559194-a162d19bf842?auto=format&fit=crop&w=600&q=80",
        brand: "Jordan",
        category: "Basketball",
        size: [41, 42, 43, 44],
        color: ["White", "Black", "Grey"],
        isFeatured: true,
      },
      {
        name: "Nike Air Max 90",
        description: "Nothing as fly, nothing as comfortable, nothing as proven. Stays true to its OG running roots.",
        price: 130,
        quantity: 28,
        img: "https://images.unsplash.com/photo-1514989940723-e8e51635b782?auto=format&fit=crop&w=600&q=80",
        brand: "Nike",
        category: "Running",
        size: [40, 41, 42, 43],
        color: ["White", "Grey", "Black"],
        isFeatured: true,
      },
      {
        name: "Adidas Forum Low",
        description: "80s hardwood legacy reimagined for everyday city adventures.",
        price: 110,
        quantity: 22,
        img: "https://images.unsplash.com/photo-1511556532299-8f662fc26c06?auto=format&fit=crop&w=600&q=80",
        brand: "Adidas",
        category: "Lifestyle",
        size: [39, 40, 41, 42],
        color: ["White", "Royal Blue"],
        isFeatured: false,
      },
      {
        name: "Puma RS-X Efekt",
        description: "Progressive aesthetic with futuristic overlays and bulky disruptive silhouette.",
        price: 115,
        quantity: 18,
        img: "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=600&q=80",
        brand: "Puma",
        category: "Running",
        size: [40, 41, 42, 43, 44],
        color: ["Multi", "Black", "Orange"],
        isFeatured: true,
      },
    ]);
    console.log(`Seeded ${products.length} products.`);

    // 5. Seed Vouchers
    console.log("Seeding vouchers...");
    await Voucher.deleteMany({});
    const vouchers = await Voucher.insertMany([
      {
        code: "KICKZ10",
        description: "10% off on all footwear",
        discountType: "percent",
        discountValue: 10,
        minOrderValue: 50,
        startDate: new Date("2026-01-01"),
        endDate: new Date("2027-12-31"),
        usageLimit: 500,
        usedCount: 0,
        isActive: true,
      },
      {
        code: "SAVE20",
        description: "$20 off on orders over $100",
        discountType: "amount",
        discountValue: 20,
        minOrderValue: 100,
        startDate: new Date("2026-01-01"),
        endDate: new Date("2027-12-31"),
        usageLimit: 500,
        usedCount: 0,
        isActive: true,
      },
      {
        code: "WELCOME",
        description: "Welcome voucher $15 off",
        discountType: "amount",
        discountValue: 15,
        minOrderValue: 60,
        startDate: new Date("2026-01-01"),
        endDate: new Date("2027-12-31"),
        usageLimit: 500,
        usedCount: 0,
        isActive: true,
      },
    ]);
    console.log(`Seeded ${vouchers.length} vouchers.`);

    // 6. Seed Payment Card for demo user
    console.log("Seeding demo payment card (PCI-compliant: no CVV stored)...");
    await Card.deleteMany({});
    await Card.create({
      userId: regularUser._id,
      last4: "1234",
      brand: "Visa",
      cardHolderName: "John Doe",
      expiryDate: "12/28",
      mockBalance: 5000,
      paymentToken: "tok_mock_seed_visa_1234",
    });
    console.log("Demo payment card created with $5,000 mock balance (last4: 1234, brand: Visa).");

    console.log("\n=================================");
    console.log("Database seeded successfully!");
    console.log("=================================");
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seed();
