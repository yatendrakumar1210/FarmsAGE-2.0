const mongoose = require("mongoose");
const Product = require("../models/product.model");
const User = require("../models/user.model");
const { validateProductInput } = require("../utils/productValidation");

/**
 * 🌐 GET /api/products
 * Public list of products with server-side pagination, category filter, search, and sorting.
 */
exports.getProducts = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 12));
    const skip = (page - 1) * limit;

    const { category, search, sortBy, vendorId } = req.query;

    const query = {};

    // Vendor or Global filter
    if (vendorId && mongoose.Types.ObjectId.isValid(vendorId)) {
      query.vendorId = new mongoose.Types.ObjectId(vendorId);
    } else if (vendorId === "global" || !vendorId) {
      // Default: show catalog products (global or any vendor unless specified)
      // When browsing the main marketplace, show all approved catalog products
      // Global items: { $or: [{ vendorId: null }, { vendorId: { $exists: false } }] }
      if (req.query.scope === "global") {
        query.$or = [{ vendorId: null }, { vendorId: { $exists: false } }];
      }
    }

    // Category filtering
    if (category && category !== "All") {
      const catLower = category.toLowerCase();
      if (catLower === "organic") {
        query.$and = query.$and || [];
        query.$and.push({
          $or: [{ category: "Organic" }, { isOrganic: true }],
        });
      } else if (catLower.includes("herb")) {
        query.category = { $regex: /herb/i };
      } else {
        query.category = { $regex: new RegExp(`^${category}$`, "i") };
      }
    }

    // Search filtering (name or category)
    if (search && search.trim()) {
      const sanitizedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const searchRegex = new RegExp(sanitizedSearch, "i");
      query.$and = query.$and || [];
      query.$and.push({
        $or: [{ name: searchRegex }, { category: searchRegex }, { description: searchRegex }],
      });
    }

    // Sorting: In-stock items (quantity > 0) prioritized first
    let sortOptions = { quantity: -1, createdAt: -1 };
    if (sortBy === "Price: Low to High" || sortBy === "price_asc") {
      sortOptions = { quantity: -1, price: 1 };
    } else if (sortBy === "Price: High to Low" || sortBy === "price_desc") {
      sortOptions = { quantity: -1, price: -1 };
    } else if (sortBy === "Newest First" || sortBy === "newest") {
      sortOptions = { quantity: -1, createdAt: -1 };
    }

    const [totalProducts, products] = await Promise.all([
      Product.countDocuments(query),
      Product.find(query)
        .select("_id name description image category price oldPrice discount unit quantity isOrganic vendorId createdAt")
        .populate("vendorId", "name storeName storeAddress")
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    const totalPages = Math.ceil(totalProducts / limit) || 1;

    // Cache headers for non-search public queries
    if (typeof res.set === "function") {
      if (!search) {
        res.set("Cache-Control", "public, max-age=60, s-maxage=120, stale-while-revalidate=60");
      } else {
        res.set("Cache-Control", "no-store");
      }
    }

    res.json({
      success: true,
      products,
      totalProducts,
      currentPage: page,
      totalPages,
    });
  } catch (err) {
    console.error("GET /api/products error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch products", error: err.message });
  }
};

/**
 * 🔍 GET /api/products/:id
 * Public endpoint to fetch details of a single product by its ObjectId.
 */
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id) || String(id).length !== 24) {
      return res.status(400).json({ success: false, message: "Invalid product ID format" });
    }

    const product = await Product.findById(id)
      .populate("vendorId", "name storeName storeAddress storeImage phone")
      .lean();

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    res.json({ success: true, product });
  } catch (err) {
    console.error("GET /api/products/:id error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch product details", error: err.message });
  }
};

/**
 * Helper to validate admin vendor assignment.
 * Target user must exist, have role === "vendor", and shopStatus === "approved".
 */
const validateAdminVendorAssignment = async (vendorId) => {
  if (!mongoose.Types.ObjectId.isValid(vendorId)) {
    return { isValid: false, status: 400, message: "Invalid vendor ID format" };
  }
  const targetVendor = await User.findById(vendorId).select("role shopStatus");
  if (!targetVendor) {
    return { isValid: false, status: 404, message: "Target vendor user not found" };
  }
  if (targetVendor.role !== "vendor") {
    return { isValid: false, status: 400, message: "Target user is not a vendor" };
  }
  if (targetVendor.shopStatus !== "approved") {
    return { isValid: false, status: 400, message: "Target vendor is not approved" };
  }
  return { isValid: true, targetVendor };
};

/**
 * ➕ POST /api/products
 * Protected endpoint for Admin and Approved Vendors to create a new product.
 */
exports.createProduct = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const { isValid, errors, sanitized } = validateProductInput(req.body, false);
    if (!isValid) {
      return res.status(400).json({ success: false, message: "Validation failed", errors });
    }

    // Role-based vendorId assignment
    if (req.user.role === "vendor") {
      // Verify vendor status from DB
      const dbUser = await User.findById(req.user.id).select("role shopStatus");
      if (!dbUser || dbUser.role !== "vendor" || dbUser.shopStatus !== "approved") {
        return res.status(403).json({
          success: false,
          message: "Only approved vendors can create products for their store",
        });
      }
      sanitized.vendorId = req.user.id;
    } else if (req.user.role === "admin") {
      // Admin can create global products (vendorId: null) or assign to an approved vendor
      const rawVendorId = req.body.vendorId;
      const isVendorProvided =
        rawVendorId !== undefined &&
        rawVendorId !== null &&
        rawVendorId !== "" &&
        rawVendorId !== "null";

      if (!isVendorProvided) {
        sanitized.vendorId = null;
      } else {
        const vendorValidation = await validateAdminVendorAssignment(rawVendorId);
        if (!vendorValidation.isValid) {
          return res.status(vendorValidation.status).json({
            success: false,
            message: vendorValidation.message,
          });
        }
        sanitized.vendorId = rawVendorId;
      }
    } else {
      return res.status(403).json({ success: false, message: "Access denied. Admin or Vendor role required." });
    }

    const newProduct = await Product.create(sanitized);
    res.status(201).json({ success: true, message: "Product created successfully", product: newProduct });
  } catch (err) {
    console.error("POST /api/products error:", err);
    res.status(500).json({ success: false, message: "Failed to create product", error: err.message });
  }
};

/**
 * ✏️ PUT /api/products/:id
 * Protected endpoint to update a product.
 * - Admin can edit any product.
 * - Vendor can ONLY edit products where product.vendorId === req.user.id.
 */
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid product ID format" });
    }

    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // Vendor authorization check
    if (req.user.role === "vendor") {
      const dbUser = await User.findById(req.user.id).select("role shopStatus");
      if (dbUser && (dbUser.role !== "vendor" || dbUser.shopStatus !== "approved")) {
        return res.status(403).json({
          success: false,
          message: "Only approved vendors can update products",
        });
      }

      if (!existingProduct.vendorId || existingProduct.vendorId.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Access denied. Vendors can only edit their own products.",
        });
      }
    } else if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied. Admin or Vendor role required." });
    }

    const { isValid, errors, sanitized } = validateProductInput(req.body, true);
    if (!isValid) {
      return res.status(400).json({ success: false, message: "Validation failed", errors });
    }

    // Vendors cannot change vendorId or reassign ownership
    if (req.user.role === "vendor") {
      delete sanitized.vendorId;
    } else if (req.user.role === "admin" && req.body.vendorId !== undefined) {
      const rawVendorId = req.body.vendorId;
      const isVendorEmpty =
        rawVendorId === null ||
        rawVendorId === "" ||
        rawVendorId === "null";

      if (isVendorEmpty) {
        sanitized.vendorId = null;
      } else {
        const vendorValidation = await validateAdminVendorAssignment(rawVendorId);
        if (!vendorValidation.isValid) {
          return res.status(vendorValidation.status).json({
            success: false,
            message: vendorValidation.message,
          });
        }
        sanitized.vendorId = rawVendorId;
      }
    }

    const updatedProduct = await Product.findByIdAndUpdate(id, sanitized, {
      returnDocument: "after",
      runValidators: true,
    });

    res.json({ success: true, message: "Product updated successfully", product: updatedProduct });
  } catch (err) {
    console.error("PUT /api/products/:id error:", err);
    res.status(500).json({ success: false, message: "Failed to update product", error: err.message });
  }
};

/**
 * ❌ DELETE /api/products/:id
 * Protected endpoint to delete a product.
 * - Admin can delete any product.
 * - Vendor can ONLY delete products where product.vendorId === req.user.id.
 */
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid product ID format" });
    }

    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // Vendor authorization check
    if (req.user.role === "vendor") {
      const dbUser = await User.findById(req.user.id).select("role shopStatus");
      if (dbUser && (dbUser.role !== "vendor" || dbUser.shopStatus !== "approved")) {
        return res.status(403).json({
          success: false,
          message: "Only approved vendors can delete products",
        });
      }

      if (!existingProduct.vendorId || existingProduct.vendorId.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Access denied. Vendors can only delete their own products.",
        });
      }
    } else if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied. Admin or Vendor role required." });
    }

    await Product.findByIdAndDelete(id);

    res.json({ success: true, message: "Product deleted successfully" });
  } catch (err) {
    console.error("DELETE /api/products/:id error:", err);
    res.status(500).json({ success: false, message: "Failed to delete product", error: err.message });
  }
};
