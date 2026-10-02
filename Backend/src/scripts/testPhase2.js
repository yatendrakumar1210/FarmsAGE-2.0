import mongoose from "mongoose";
import dotenv from "dotenv";
import { validateProductInput } from "../utils/productValidation.js";
import Product from "../models/product.model.js";
import User from "../models/user.model.js";
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} from "../controller/products.controller.js";

dotenv.config({ path: "./.env" });

const runTests = async () => {
  console.log("=========================================");
  console.log("PHASE 2 VERIFICATION TEST SUITE");
  console.log("=========================================\n");

  let passed = 0;
  let failed = 0;

  const assert = (condition, testName, details = "") => {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName} - ${details}`);
      failed++;
    }
  };

  // -------------------------------------------------------------
  // UNIT TESTS: Validation Utility
  // -------------------------------------------------------------
  console.log("--- 1. Testing validateProductInput Validation Utility ---");

  // Valid product
  const valid = validateProductInput({
    name: "Organic Cow Milk",
    category: "Dairy",
    price: 65,
    oldPrice: 70,
    quantity: 50,
    unit: "1L",
    image: "https://images.unsplash.com/test.jpg",
    discount: 7,
    description: "Pure cow milk straight from local dairy farms."
  });
  assert(valid.isValid === true, "Valid product passes validation");

  // Negative price
  const negPrice = validateProductInput({
    name: "Apple",
    category: "Fruits",
    price: -10,
    quantity: 10,
    image: "https://example.com/a.jpg"
  });
  assert(
    negPrice.isValid === false && negPrice.errors.some(e => e.includes("Price")),
    "Negative price rejected"
  );

  // Zero price
  const zeroPrice = validateProductInput({
    name: "Apple",
    category: "Fruits",
    price: 0,
    quantity: 10,
    image: "https://example.com/a.jpg"
  });
  assert(
    zeroPrice.isValid === false && zeroPrice.errors.some(e => e.includes("Price")),
    "Zero price rejected"
  );

  // Negative quantity
  const negQty = validateProductInput({
    name: "Apple",
    category: "Fruits",
    price: 50,
    quantity: -5,
    image: "https://example.com/a.jpg"
  });
  assert(
    negQty.isValid === false && negQty.errors.some(e => e.includes("Stock")),
    "Negative stock quantity rejected"
  );

  // Invalid category
  const badCat = validateProductInput({
    name: "Electronic Gadget",
    category: "Electronics",
    price: 500,
    quantity: 5,
    image: "https://example.com/a.jpg"
  });
  assert(
    badCat.isValid === false && badCat.errors.some(e => /category/i.test(e)),
    "Disallowed category rejected"
  );

  // Name too short
  const shortName = validateProductInput({
    name: "A",
    category: "Vegetables",
    price: 20,
    quantity: 5,
    image: "https://example.com/a.jpg"
  });
  assert(
    shortName.isValid === false && shortName.errors.some(e => /name/i.test(e)),
    "Short name (<2 chars) rejected"
  );

  // Missing image
  const missingImg = validateProductInput({
    name: "Carrot",
    category: "Vegetables",
    price: 40,
    quantity: 10
  });
  assert(
    missingImg.isValid === false && missingImg.errors.some(e => /image/i.test(e)),
    "Missing image rejected"
  );

  // Invalid discount (> 100)
  const badDiscount = validateProductInput({
    name: "Carrot",
    category: "Vegetables",
    price: 40,
    quantity: 10,
    image: "https://example.com/a.jpg",
    discount: 150
  });
  assert(
    badDiscount.isValid === false && badDiscount.errors.some(e => /discount/i.test(e)),
    "Discount > 100 rejected"
  );

  // -------------------------------------------------------------
  // INTEGRATION TESTS: Database & Controller Logic
  // -------------------------------------------------------------
  console.log("\n--- 2. Testing Database Connection & Queries ---");
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("MONGO_URI not found in .env");
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB successfully.");

  // Helper mocks for Express req/res
  const createMockRes = () => {
    const res = {
      statusCode: 200,
      jsonData: null,
      headers: {},
      set(key, val) {
        this.headers[key] = val;
        return this;
      },
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.jsonData = data;
        return this;
      }
    };
    return res;
  };

  // Test getProducts all
  {
    const req = { query: {} };
    const res = createMockRes();
    await getProducts(req, res);
    assert(
      res.statusCode === 200 && res.jsonData.success === true && res.jsonData.products.length > 0,
      `getProducts returns products (found ${res.jsonData?.products?.length || 0})`
    );
  }

  // Test getProducts category=Dairy
  {
    const req = { query: { category: "Dairy", limit: 50 } };
    const res = createMockRes();
    await getProducts(req, res);
    const dairyCount = res.jsonData?.products?.length || 0;
    assert(
      res.statusCode === 200 && dairyCount === 20 && res.jsonData?.totalProducts === 20,
      `getProducts category=Dairy returns exactly 20 seeded dairy products (got ${dairyCount}, total: ${res.jsonData?.totalProducts})`
    );
  }

  // Test getProducts category=Organic
  {
    const req = { query: { category: "Organic", limit: 50 } };
    const res = createMockRes();
    await getProducts(req, res);
    const organicCount = res.jsonData?.products?.length || 0;
    assert(
      res.statusCode === 200 && organicCount === 30 && res.jsonData?.totalProducts === 30,
      `getProducts category=Organic returns 30 products (got ${organicCount}, total: ${res.jsonData?.totalProducts})`
    );
  }

  // Test getProducts search
  {
    const req = { query: { search: "Milk" } };
    const res = createMockRes();
    await getProducts(req, res);
    const foundMilk = res.jsonData?.products?.length > 0;
    assert(
      res.statusCode === 200 && foundMilk,
      `getProducts search="Milk" returns matching items (got ${res.jsonData?.products?.length})`
    );
  }

  // Test getProducts pagination
  {
    const req = { query: { page: 1, limit: 5 } };
    const res = createMockRes();
    await getProducts(req, res);
    assert(
      res.statusCode === 200 && res.jsonData?.products?.length === 5 && res.jsonData?.currentPage === 1,
      `getProducts pagination (limit=5) returns 5 items and currentPage=1 (got ${res.jsonData?.products?.length}, page: ${res.jsonData?.currentPage})`
    );
  }

  // Test getProductById with invalid ObjectId format
  {
    const req = { params: { id: "invalid-id-format" } };
    const res = createMockRes();
    await getProductById(req, res);
    assert(
      res.statusCode === 400 && res.jsonData?.success === false,
      "getProductById with invalid ObjectId returns 400"
    );
  }

  // Test getProductById with non-existent ObjectId
  {
    const nonExistentId = new mongoose.Types.ObjectId().toString();
    const req = { params: { id: nonExistentId } };
    const res = createMockRes();
    await getProductById(req, res);
    assert(
      res.statusCode === 404 && res.jsonData?.success === false,
      "getProductById with non-existent ObjectId returns 404"
    );
  }

  // Test getProductById with valid existing ID
  let existingProduct = await Product.findOne({ category: "Dairy" });
  if (existingProduct) {
    const req = { params: { id: existingProduct._id.toString() } };
    const res = createMockRes();
    await getProductById(req, res);
    assert(
      res.statusCode === 200 && res.jsonData?.product?.name === existingProduct.name,
      `getProductById with existing ID returns product details (${existingProduct.name})`
    );
  }

  // -------------------------------------------------------------
  // SECURITY & VENDOR ISOLATION TESTS
  // -------------------------------------------------------------
  console.log("\n--- 3. Testing Vendor Isolation & Security Boundaries ---");

  const vendorAId = new mongoose.Types.ObjectId().toString();
  const vendorBId = new mongoose.Types.ObjectId().toString();

  // Create a product owned by Vendor A
  const vendorAProduct = await Product.create({
    name: "Vendor A Test Milk",
    category: "Dairy",
    price: 45,
    oldPrice: 50,
    quantity: 25,
    unit: "500ml",
    image: "https://images.unsplash.com/test-vendor-a.jpg",
    vendorId: vendorAId,
    description: "Product exclusively owned by Vendor A"
  });

  // Test 1: Vendor B attempts to update Vendor A's product
  {
    const req = {
      params: { id: vendorAProduct._id.toString() },
      user: { id: vendorBId, role: "vendor" },
      body: { price: 99, name: "Hacked by Vendor B" }
    };
    const res = createMockRes();
    await updateProduct(req, res);
    assert(
      res.statusCode === 403,
      "Vendor B cannot update Vendor A's product (HTTP 403 Forbidden)"
    );
  }

  // Test 2: Vendor B attempts to delete Vendor A's product
  {
    const req = {
      params: { id: vendorAProduct._id.toString() },
      user: { id: vendorBId, role: "vendor" }
    };
    const res = createMockRes();
    await deleteProduct(req, res);
    assert(
      res.statusCode === 403,
      "Vendor B cannot delete Vendor A's product (HTTP 403 Forbidden)"
    );
  }

  // Test 3: Vendor A updating their own product succeeds
  {
    const req = {
      params: { id: vendorAProduct._id.toString() },
      user: { id: vendorAId, role: "vendor" },
      body: { price: 48, quantity: 30 }
    };
    const res = createMockRes();
    await updateProduct(req, res);
    assert(
      res.statusCode === 200 && res.jsonData?.product?.price === 48,
      "Vendor A can update their own product successfully"
    );
  }

  // Test 4: Vendor A cannot reassign vendorId
  {
    const req = {
      params: { id: vendorAProduct._id.toString() },
      user: { id: vendorAId, role: "vendor" },
      body: { vendorId: vendorBId }
    };
    const res = createMockRes();
    await updateProduct(req, res);
    const refreshed = await Product.findById(vendorAProduct._id);
    assert(
      refreshed.vendorId.toString() === vendorAId,
      "Vendor cannot tamper with or transfer product vendorId ownership"
    );
  }

  // Test 5: Admin can manage/delete any product
  {
    const req = {
      params: { id: vendorAProduct._id.toString() },
      user: { id: new mongoose.Types.ObjectId().toString(), role: "admin" }
    };
    const res = createMockRes();
    await deleteProduct(req, res);
    assert(
      res.statusCode === 200,
      "Admin can delete vendor products"
    );
    const checkDeleted = await Product.findById(vendorAProduct._id);
    assert(checkDeleted === null, "Test product cleanly deleted from database");
  }

  // -------------------------------------------------------------
  // 4. PHASE 2.1 ADMIN VENDOR-ASSIGNMENT AUTHORIZATION TESTS
  // -------------------------------------------------------------
  console.log("\n--- 4. Testing Phase 2.1 Admin Vendor-Assignment Authorization ---");

  // Create test fixtures
  const approvedVendor = await User.create({
    name: "Approved Vendor Test",
    email: `approved_vendor_${Date.now()}@example.com`,
    role: "vendor",
    shopStatus: "approved"
  });

  const unapprovedVendor = await User.create({
    name: "Unapproved Vendor Test",
    email: `unapproved_vendor_${Date.now()}@example.com`,
    role: "vendor",
    shopStatus: "pending"
  });

  const nonVendorUser = await User.create({
    name: "Regular Customer Test",
    email: `regular_user_${Date.now()}@example.com`,
    role: "user",
    shopStatus: "none"
  });

  const adminUser = { id: new mongoose.Types.ObjectId().toString(), role: "admin" };
  const createdTestProductIds = [];

  // 1. Admin creates global product with vendorId = null -> PASS
  {
    const req = {
      user: adminUser,
      body: {
        name: "Admin Global Product",
        category: "Fruits",
        price: 99,
        quantity: 10,
        image: "https://example.com/global.jpg",
        vendorId: null
      }
    };
    const res = createMockRes();
    await createProduct(req, res);
    const pass = res.statusCode === 201 && res.jsonData?.success === true && res.jsonData?.product?.vendorId === null;
    assert(pass, "1. Admin creates global product with vendorId = null -> PASS");
    if (res.jsonData?.product?._id) createdTestProductIds.push(res.jsonData.product._id);
  }

  // 2. Admin creates product assigned to approved vendor -> PASS
  {
    const req = {
      user: adminUser,
      body: {
        name: "Admin Assigned Product",
        category: "Vegetables",
        price: 50,
        quantity: 20,
        image: "https://example.com/assigned.jpg",
        vendorId: approvedVendor._id.toString()
      }
    };
    const res = createMockRes();
    await createProduct(req, res);
    const pass = res.statusCode === 201 && res.jsonData?.success === true && res.jsonData?.product?.vendorId?.toString() === approvedVendor._id.toString();
    assert(pass, "2. Admin creates product assigned to approved vendor -> PASS");
    if (res.jsonData?.product?._id) createdTestProductIds.push(res.jsonData.product._id);
  }

  // 3. Admin attempts to assign product to unapproved vendor -> REJECT
  {
    const req = {
      user: adminUser,
      body: {
        name: "Product For Unapproved Vendor",
        category: "Fruits",
        price: 35,
        quantity: 10,
        image: "https://example.com/unapproved.jpg",
        vendorId: unapprovedVendor._id.toString()
      }
    };
    const res = createMockRes();
    await createProduct(req, res);
    const rejected = res.statusCode >= 400 && res.statusCode < 500 && res.jsonData?.success === false;
    assert(rejected, "3. Admin attempts to assign product to unapproved vendor -> REJECT");
  }

  // 4. Admin attempts to assign product to non-vendor user -> REJECT
  {
    const req = {
      user: adminUser,
      body: {
        name: "Product For Regular User",
        category: "Fruits",
        price: 35,
        quantity: 10,
        image: "https://example.com/regular.jpg",
        vendorId: nonVendorUser._id.toString()
      }
    };
    const res = createMockRes();
    await createProduct(req, res);
    const rejected = res.statusCode >= 400 && res.statusCode < 500 && res.jsonData?.success === false;
    assert(rejected, "4. Admin attempts to assign product to non-vendor user -> REJECT");
  }

  // 5. Admin attempts to assign product to nonexistent vendorId -> REJECT
  {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const req = {
      user: adminUser,
      body: {
        name: "Product For Fake Vendor",
        category: "Fruits",
        price: 35,
        quantity: 10,
        image: "https://example.com/fake.jpg",
        vendorId: fakeId
      }
    };
    const res = createMockRes();
    await createProduct(req, res);
    const rejected = res.statusCode >= 400 && res.statusCode < 500 && res.jsonData?.success === false;
    assert(rejected, "5. Admin attempts to assign product to nonexistent vendorId -> REJECT");
  }

  // Create a product to test updates
  const productToUpdate = await Product.create({
    name: "Product To Update Vendor",
    category: "Organic",
    price: 120,
    quantity: 15,
    image: "https://example.com/update.jpg",
    vendorId: null
  });
  createdTestProductIds.push(productToUpdate._id);

  // 6. Admin updates product to approved vendor -> PASS
  {
    const req = {
      params: { id: productToUpdate._id.toString() },
      user: adminUser,
      body: {
        vendorId: approvedVendor._id.toString()
      }
    };
    const res = createMockRes();
    await updateProduct(req, res);
    const pass = res.statusCode === 200 && res.jsonData?.success === true && res.jsonData?.product?.vendorId?.toString() === approvedVendor._id.toString();
    assert(pass, "6. Admin updates product to approved vendor -> PASS");
  }

  // 7. Admin attempts to update product to unapproved vendor -> REJECT
  {
    const req = {
      params: { id: productToUpdate._id.toString() },
      user: adminUser,
      body: {
        vendorId: unapprovedVendor._id.toString()
      }
    };
    const res = createMockRes();
    await updateProduct(req, res);
    const rejected = res.statusCode >= 400 && res.statusCode < 500 && res.jsonData?.success === false;
    assert(rejected, "7. Admin attempts to update product to unapproved vendor -> REJECT");
  }

  // 8. Admin attempts to update product to non-vendor user -> REJECT
  {
    const req = {
      params: { id: productToUpdate._id.toString() },
      user: adminUser,
      body: {
        vendorId: nonVendorUser._id.toString()
      }
    };
    const res = createMockRes();
    await updateProduct(req, res);
    const rejected = res.statusCode >= 400 && res.statusCode < 500 && res.jsonData?.success === false;
    assert(rejected, "8. Admin attempts to update product to non-vendor user -> REJECT");
  }

  // Cleanup test fixtures
  await Product.deleteMany({ _id: { $in: createdTestProductIds } });
  await User.deleteMany({ _id: { $in: [approvedVendor._id, unapprovedVendor._id, nonVendorUser._id] } });
  console.log("Cleaned up Phase 2.1 test fixtures successfully.");

  // Cleanup & Summary
  await mongoose.disconnect();
  console.log("\n=========================================");
  console.log(`TEST SUMMARY: Passed: ${passed} | Failed: ${failed}`);
  console.log("=========================================");

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
};

runTests().catch(err => {
  console.error("Test runner failed:", err);
  process.exit(1);
});
