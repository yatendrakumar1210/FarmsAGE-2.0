const vendorOnly = (req, res, next) => {
  if (req.user.role !== "vendor" && req.user.role !== "admin") {
    return res.status(403).json({ message: "Access Denied. Vendor role required." });
  }
  next();
};

module.exports = vendorOnly;
