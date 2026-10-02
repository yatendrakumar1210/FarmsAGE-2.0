require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("../models/product.model");
const path = require("path");

const staticDairyPath = path.resolve(__dirname, "../../../FarmsAGE-2.0/src/data/dairy.js");

async function seedMissingProducts() {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error("MONGODB_URI is required");
    }

    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB for product check/seeding...");

    // Read dairy products from static file
    const fs = require("fs");
    const dairyContent = fs.readFileSync(staticDairyPath, "utf8");

    // Extract dairy array by regex / eval in clean context
    const jsonMatch = dairyContent.match(/const\s+dairy\s*=\s*(\[[\s\S]*?\]);/);
    if (!jsonMatch) {
      console.log("Could not parse static dairy array, skipping.");
      return;
    }

    // Safely evaluate standard JS object literal
    const fn = new Function(`return ${jsonMatch[1]};`);
    const staticDairy = fn();

    let inserted = 0;
    for (const item of staticDairy) {
      const existing = await Product.findOne({ name: item.name });
      if (!existing) {
        let disc = 0;
        if (typeof item.discount === "string") {
          disc = parseInt(item.discount.replace(/[^0-9]/g, ""), 10) || 0;
        } else if (typeof item.discount === "number") {
          disc = item.discount;
        }

        await Product.create({
          name: item.name,
          category: "Dairy",
          image: item.image,
          price: Number(item.price),
          oldPrice: item.oldPrice ? Number(item.oldPrice) : null,
          discount: disc,
          quantity: item.quantity && item.quantity > 0 ? item.quantity : 50,
          unit: item.unit || "1 pack",
          isOrganic: false,
          vendorId: null,
        });
        inserted++;
      }
    }

    console.log(`Seeding complete. Inserted ${inserted} missing products.`);
    const counts = {};
    for (const cat of ["Fruits", "Vegetables", "Organic", "Dairy"]) {
      counts[cat] = await Product.countDocuments({ category: cat });
    }
    console.log("Updated category counts in MongoDB:", counts);
  } catch (err) {
    console.error("Seeding error:", err);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
}

seedMissingProducts();
