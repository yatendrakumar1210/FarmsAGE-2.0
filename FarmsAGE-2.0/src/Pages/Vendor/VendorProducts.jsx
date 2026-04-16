import React, { useState, useEffect } from "react";
import { Plus, Trash2, Edit3, Package, ShoppingBasket, X } from "lucide-react";
import "./vendor.css";

const API = import.meta.env.MODE === "development" ? "http://localhost:3000" : "https://farmsage-2-0-2.onrender.com";

const VendorProducts = () => {
  const [activeTab, setActiveTab] = useState("my");
  const [myProducts, setMyProducts] = useState([]);
  const [globalProducts, setGlobalProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: "", category: "Fruits", image: "", price: "", oldPrice: "", unit: "1 kg", isOrganic: false, discount: 0, quantity: 100,
  });

  const token = localStorage.getItem("token");

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const [myRes, globalRes] = await Promise.all([
        fetch(`${API}/api/vendor/products`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/api/vendor/products/global`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const my = await myRes.json();
      const global = await globalRes.json();
      setMyProducts(Array.isArray(my) ? my : []);
      setGlobalProducts(Array.isArray(global) ? global : []);
    } catch (err) {
      console.error("Failed to fetch products:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleAddFromGlobal = async (product) => {
    try {
      const res = await fetch(`${API}/api/vendor/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: product.name,
          category: product.category,
          image: product.image,
          price: product.price,
          oldPrice: product.oldPrice,
          unit: product.unit,
          isOrganic: product.isOrganic,
          discount: product.discount,
          quantity: product.quantity,
        }),
      });
      if (res.ok) {
        await fetchProducts();
        setActiveTab("my");
      }
    } catch (err) {
      console.error("Failed to add product:", err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this product from your store?")) return;
    try {
      await fetch(`${API}/api/vendor/products/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchProducts();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      image: product.image,
      price: product.price,
      oldPrice: product.oldPrice || "",
      unit: product.unit || "1 kg",
      isOrganic: product.isOrganic || false,
      discount: product.discount || 0,
      quantity: product.quantity || 100,
    });
    setShowModal(true);
  };

  const handleCreate = () => {
    setEditingProduct(null);
    setFormData({
      name: "", category: "Fruits", image: "", price: "", oldPrice: "", unit: "1 kg", isOrganic: false, discount: 0, quantity: 100,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = editingProduct
      ? `${API}/api/vendor/products/${editingProduct._id}`
      : `${API}/api/vendor/products`;
    const method = editingProduct ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...formData,
          price: Number(formData.price),
          oldPrice: formData.oldPrice ? Number(formData.oldPrice) : null,
          discount: Number(formData.discount),
          quantity: Number(formData.quantity),
        }),
      });
      if (res.ok) {
        setShowModal(false);
        fetchProducts();
      }
    } catch (err) {
      console.error("Save failed:", err);
    }
  };

  // Check if a global product is already in vendor's store
  const isAlreadyAdded = (globalProduct) => {
    return myProducts.some(p => p.name === globalProduct.name && p.category === globalProduct.category);
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "40vh", color: "#64748b", fontWeight: 600 }}>
        Loading products...
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#0f172a", fontFamily: "'Outfit', sans-serif" }}>
          Manage Products
        </h2>
        <button className="add-btn" onClick={handleCreate}>
          <Plus size={16} /> Add Custom Product
        </button>
      </div>

      {/* Tabs */}
      <div className="vendor-product-tabs">
        <button className={`vendor-tab-btn ${activeTab === "my" ? "active" : ""}`} onClick={() => setActiveTab("my")}>
          <ShoppingBasket size={14} style={{ marginRight: 6, verticalAlign: "middle" }} />
          My Store ({myProducts.length})
        </button>
        <button className={`vendor-tab-btn ${activeTab === "global" ? "active" : ""}`} onClick={() => setActiveTab("global")}>
          <Package size={14} style={{ marginRight: 6, verticalAlign: "middle" }} />
          All Products ({globalProducts.length})
        </button>
      </div>

      {/* My Products Table */}
      {activeTab === "my" && (
        <div className="data-table-container">
          <div className="table-header">
            <h3>Your Store Products</h3>
          </div>
          {myProducts.length === 0 ? (
            <div className="vendor-empty-state">
              <div className="icon-wrap"><ShoppingBasket size={28} /></div>
              <h4>No products in your store</h4>
              <p>Add products from the "All Products" tab or create a custom product to get started.</p>
            </div>
          ) : (
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {myProducts.map((p) => (
                  <tr key={p._id}>
                    <td>
                      <img
                        src={p.image}
                        alt={p.name}
                        style={{ width: 44, height: 44, borderRadius: 10, objectFit: "cover" }}
                      />
                    </td>
                    <td style={{ fontWeight: 600, color: "#1e293b" }}>{p.name}</td>
                    <td>
                      <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", background: "#f1f5f9", padding: "3px 10px", borderRadius: 20 }}>
                        {p.category}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: "#059669" }}>₹{p.price}</td>
                    <td>
                      <span style={{
                        fontSize: "0.8rem", fontWeight: 600,
                        color: p.quantity > 0 ? "#15803d" : "#dc2626",
                        background: p.quantity > 0 ? "#f0fdf4" : "#fef2f2",
                        padding: "3px 10px", borderRadius: 20
                      }}>
                        {p.quantity > 0 ? `${p.quantity} units` : "Out of Stock"}
                      </span>
                    </td>
                    <td>
                      <div className="action-btns">
                        <button className="icon-btn edit-btn" onClick={() => handleEdit(p)} title="Edit">
                          <Edit3 size={14} />
                        </button>
                        <button className="icon-btn delete-btn" onClick={() => handleDelete(p._id)} title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Global Products Grid */}
      {activeTab === "global" && (
        <div>
          <p style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "1rem", fontWeight: 500 }}>
            Browse all available products and add them to your store with one click.
          </p>
          {globalProducts.length === 0 ? (
            <div className="vendor-empty-state">
              <div className="icon-wrap"><Package size={28} /></div>
              <h4>No global products available</h4>
              <p>The admin hasn't added any products yet. You can still create custom products.</p>
            </div>
          ) : (
            <div className="vendor-global-grid">
              {globalProducts.map((p) => {
                const added = isAlreadyAdded(p);
                return (
                  <div key={p._id} className="vendor-global-card">
                    <img src={p.image} alt={p.name} />
                    <h4>{p.name}</h4>
                    <div className="card-meta">
                      <span className="card-price">₹{p.price}</span>
                      <span className="card-category">{p.category}</span>
                    </div>
                    <button
                      className={`vendor-add-btn ${added ? "added" : ""}`}
                      onClick={() => !added && handleAddFromGlobal(p)}
                      disabled={added}
                    >
                      {added ? (
                        <>✓ Already in Store</>
                      ) : (
                        <><Plus size={14} /> Add to My Store</>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontWeight: 800, color: "#0f172a" }}>
                {editingProduct ? "Edit Product" : "Add Custom Product"}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}>
                <X size={20} />
              </button>
            </div>

            <form className="modal-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Product Name</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Category</label>
                  <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} style={{ width: "100%", padding: "0.75rem", borderRadius: 10, border: "1.5px solid #e2e8f0" }}>
                    <option value="Fruits">Fruits</option>
                    <option value="Vegetables">Vegetables</option>
                    <option value="Organic">Organic</option>
                    <option value="Dairy">Dairy</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Unit</label>
                  <input type="text" value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} />
                </div>
              </div>

              <div className="form-group">
                <label>Image URL</label>
                <input type="text" value={formData.image} onChange={(e) => setFormData({ ...formData, image: e.target.value })} required />
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Price (₹)</label>
                  <input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Old Price (₹)</label>
                  <input type="number" value={formData.oldPrice} onChange={(e) => setFormData({ ...formData, oldPrice: e.target.value })} />
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Stock Quantity</label>
                  <input type="number" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Discount (%)</label>
                  <input type="number" value={formData.discount} onChange={(e) => setFormData({ ...formData, discount: e.target.value })} />
                </div>
              </div>

              <div className="form-grid items-center" style={{ marginBottom: "0.5rem" }}>
                <div className="checkbox-group">
                  <input type="checkbox" id="isOrganic" checked={formData.isOrganic} onChange={(e) => setFormData({ ...formData, isOrganic: e.target.checked })} />
                  <label htmlFor="isOrganic">Organic Product</label>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="save-btn">
                  {editingProduct ? "Update Product" : "Add Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorProducts;
