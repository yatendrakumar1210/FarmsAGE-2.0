const VALID_CATEGORIES = ['Fruits', 'Vegetables', 'Organic', 'Dairy'];

/**
 * Validates and sanitizes product payload for creation and updates.
 * Never trusts frontend validation alone.
 *
 * @param {Object} data - Input request body
 * @param {boolean} isUpdate - Whether this is a PUT/PATCH update (partial fields allowed)
 * @returns {{ isValid: boolean, errors: string[], sanitized: Object }}
 */
const validateProductInput = (data, isUpdate = false) => {
  const errors = [];
  const sanitized = {};

  if (!data || typeof data !== "object") {
    return { isValid: false, errors: ["Request body must be a valid JSON object"], sanitized: {} };
  }

  // 1. Name validation
  if (!isUpdate || data.name !== undefined) {
    if (!data.name || typeof data.name !== "string" || data.name.trim().length === 0) {
      errors.push("Product name is required and cannot be empty");
    } else if (data.name.trim().length < 2 || data.name.trim().length > 120) {
      errors.push("Product name must be between 2 and 120 characters");
    } else {
      sanitized.name = data.name.trim();
    }
  }

  // 2. Category validation
  if (!isUpdate || data.category !== undefined) {
    if (!data.category || !VALID_CATEGORIES.includes(data.category)) {
      errors.push(`Category must be one of: ${VALID_CATEGORIES.join(", ")}`);
    } else {
      sanitized.category = data.category;
    }
  }

  // 3. Price validation (Source of truth, strictly > 0)
  if (!isUpdate || data.price !== undefined) {
    const numPrice = Number(data.price);
    if (isNaN(numPrice) || numPrice <= 0) {
      errors.push("Price must be a positive number greater than 0");
    } else {
      sanitized.price = Math.round(numPrice * 100) / 100;
    }
  }

  // 4. Old Price validation (optional, must be >= 0 if provided)
  if (data.oldPrice !== undefined && data.oldPrice !== null && data.oldPrice !== "") {
    const numOldPrice = Number(data.oldPrice);
    if (isNaN(numOldPrice) || numOldPrice < 0) {
      errors.push("Old price must be a valid non-negative number");
    } else {
      sanitized.oldPrice = Math.round(numOldPrice * 100) / 100;
    }
  } else if (!isUpdate) {
    sanitized.oldPrice = null;
  }

  // 5. Stock / Quantity validation (non-negative integer)
  if (data.quantity !== undefined && data.quantity !== null && data.quantity !== "") {
    const numQty = parseInt(data.quantity, 10);
    if (isNaN(numQty) || numQty < 0) {
      errors.push("Stock quantity must be a non-negative integer (>= 0)");
    } else {
      sanitized.quantity = numQty;
    }
  } else if (!isUpdate) {
    sanitized.quantity = 100; // default initial stock
  }

  // 6. Image URL validation
  if (!isUpdate || data.image !== undefined) {
    if (!data.image || typeof data.image !== "string" || data.image.trim().length === 0) {
      errors.push("Product image URL is required");
    } else {
      const cleanImg = data.image.trim();
      if (!cleanImg.startsWith("http://") && !cleanImg.startsWith("https://") && !cleanImg.startsWith("/")) {
        errors.push("Product image must be a valid HTTP/HTTPS URL or path");
      } else {
        sanitized.image = cleanImg;
      }
    }
  }

  // 7. Unit of measure validation
  if (data.unit !== undefined && data.unit !== null) {
    const cleanUnit = String(data.unit).trim();
    sanitized.unit = cleanUnit.length > 0 ? cleanUnit : "1 kg";
  } else if (!isUpdate) {
    sanitized.unit = "1 kg";
  }

  // 8. Description validation (optional, sanitized string)
  if (data.description !== undefined && data.description !== null) {
    sanitized.description = String(data.description).trim();
  } else if (!isUpdate) {
    sanitized.description = "";
  }

  // 9. Discount validation (0 - 100%)
  if (data.discount !== undefined && data.discount !== null && data.discount !== "") {
    const numDisc = Number(data.discount);
    if (isNaN(numDisc) || numDisc < 0 || numDisc > 100) {
      errors.push("Discount percentage must be between 0 and 100");
    } else {
      sanitized.discount = Math.round(numDisc);
    }
  } else if (!isUpdate) {
    sanitized.discount = 0;
  }

  // 10. isOrganic flag
  if (data.isOrganic !== undefined) {
    sanitized.isOrganic = Boolean(data.isOrganic);
  } else if (!isUpdate) {
    sanitized.isOrganic = sanitized.category === "Organic";
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized,
  };
};

module.exports = {
  VALID_CATEGORIES,
  validateProductInput,
};
