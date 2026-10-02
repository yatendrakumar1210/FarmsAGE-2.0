import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL as API } from "../../config/api";

const EMPTY_FORM = {
    name: '', category: 'Vegetables', image: '',
    description: '', isOrganic: false, discount: 0, price: '',
    oldPrice: '', quantity: 100, unit: '1 kg'
};

const ManageProducts = () => {
    const [dbProducts, setDbProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');

    useEffect(() => { fetchDbProducts(); }, []);

    const fetchDbProducts = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API}/api/admin/products`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDbProducts(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error('Failed to fetch DB products:', err);
            setError(err.response?.data?.message || err.message || 'Failed to fetch products');
        } finally {
            setLoading(false);
        }
    };

    // Apply filters
    const filteredProducts = dbProducts.filter(p => {
        const matchSearch = (p.name || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchCat = categoryFilter === 'All' || p.category === categoryFilter;
        return matchSearch && matchCat;
    });

    const dbCount = dbProducts.length;

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
    };

    const openModal = (product = null) => {
        if (product) {
            setEditingProduct(product);
            setFormData({
                name: product.name,
                category: product.category,
                image: product.image,
                description: product.description || '',
                isOrganic: product.isOrganic || false,
                discount: product.discount || 0,
                price: product.price,
                oldPrice: product.oldPrice || '',
                quantity: product.quantity ?? 100,
                unit: product.unit || '1 kg'
            });
        } else {
            setEditingProduct(null);
            setFormData(EMPTY_FORM);
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        const payload = {
            ...formData,
            price: Number(formData.price),
            oldPrice: formData.oldPrice ? Number(formData.oldPrice) : null,
            quantity: Number(formData.quantity),
            discount: Number(formData.discount)
        };
        try {
            if (editingProduct?._id) {
                await axios.put(`${API}/api/admin/products/${editingProduct._id}`, payload, { headers });
            } else {
                await axios.post(`${API}/api/admin/products`, payload, { headers });
            }
            setShowModal(false);
            fetchDbProducts();
        } catch (err) {
            alert("Action failed! " + (err.response?.data?.message || err.message));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!id) return;
        if (window.confirm("Are you sure you want to delete this product?")) {
            try {
                const token = localStorage.getItem('token');
                await axios.delete(`${API}/api/admin/products/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                fetchDbProducts();
            } catch (err) {
                alert("Delete failed! " + (err.response?.data?.message || err.message));
            }
        }
    };

    const StockBadge = ({ qty }) => {
        if (qty === 0) return <span style={{ background: '#fee2e2', color: '#dc2626', padding: '2px 8px', borderRadius: '20px', fontSize: '0.68rem', fontWeight: 700 }}>OUT OF STOCK</span>;
        if (qty < 10) return <span style={{ background: '#fef3c7', color: '#b45309', padding: '2px 8px', borderRadius: '20px', fontSize: '0.68rem', fontWeight: 700 }}>{qty} left ⚠️</span>;
        return <span style={{ background: '#d1fae5', color: '#065f46', padding: '2px 8px', borderRadius: '20px', fontSize: '0.68rem', fontWeight: 700 }}>{qty} units</span>;
    };

    return (
        <div className="fade-in">
            {/* Header */}
            <div className="table-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h3 style={{ margin: 0 }}>
                        All Products ({filteredProducts.length})
                    </h3>
                    <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#64748b' }}>
                        <span style={{ color: '#15803d', fontWeight: 700 }}>{dbCount} in MongoDB</span>
                    </p>
                </div>
                <button className="add-btn" onClick={() => openModal()}>
                    <span>+</span> Add New Product
                </button>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '12px', padding: '0 0 16px', flexWrap: 'wrap', alignItems: 'center' }}>
                <input
                    type="text"
                    placeholder="🔍 Search products..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={{
                        padding: '8px 14px', borderRadius: '10px', border: '1px solid #e2e8f0',
                        fontSize: '0.85rem', outline: 'none', minWidth: '220px', flex: 1
                    }}
                />
                {['All', 'Vegetables', 'Fruits', 'Organic', 'Dairy'].map(cat => (
                    <button
                        key={cat}
                        onClick={() => setCategoryFilter(cat)}
                        style={{
                            padding: '7px 16px', borderRadius: '20px', fontWeight: 600,
                            fontSize: '0.78rem', cursor: 'pointer', border: 'none',
                            background: categoryFilter === cat ? '#15803d' : '#f1f5f9',
                            color: categoryFilter === cat ? '#fff' : '#475569',
                            transition: 'all 0.2s'
                        }}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {loading ? (
                <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>Loading products from database...</div>
            ) : error ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#dc2626', background: '#fef2f2', borderRadius: '12px', margin: '16px 0' }}>
                    <p style={{ fontWeight: 700, margin: '0 0 8px' }}>⚠️ Error loading products</p>
                    <p style={{ fontSize: '0.85rem', margin: '0 0 16px' }}>{error}</p>
                    <button onClick={fetchDbProducts} style={{ padding: '8px 16px', background: '#15803d', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}>
                        Retry
                    </button>
                </div>
            ) : (
                <div className="data-table-container">
                    <table className="custom-table">
                        <thead>
                            <tr>
                                <th>Image</th>
                                <th>Name</th>
                                <th>Category</th>
                                <th>Price</th>
                                <th>Old Price</th>
                                <th>Disc %</th>
                                <th>Stock</th>
                                <th>Unit</th>
                                <th>Organic</th>
                                <th>Vendor</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProducts.map((p) => (
                                <tr key={p._id} style={{ opacity: p.quantity === 0 ? 0.65 : 1 }}>
                                    <td>
                                        <img src={p.image} alt={p.name}
                                            style={{ width: '46px', height: '46px', objectFit: 'cover', borderRadius: '8px' }}
                                            onError={e => { e.target.src = 'https://via.placeholder.com/46'; }}
                                        />
                                    </td>
                                    <td className="p-name" style={{ fontWeight: 600 }}>{p.name}</td>
                                    <td>
                                        <span style={{
                                            background: p.category === 'Fruits' ? '#fef3c7' : p.category === 'Organic' ? '#d1fae5' : p.category === 'Dairy' ? '#dbeafe' : '#f3f4f6',
                                            color: p.category === 'Fruits' ? '#92400e' : p.category === 'Organic' ? '#065f46' : p.category === 'Dairy' ? '#1e40af' : '#374151',
                                            padding: '2px 8px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 700
                                        }}>
                                            {p.category}
                                        </span>
                                    </td>
                                    <td style={{ fontWeight: 700, color: '#15803d' }}>₹{p.price}</td>
                                    <td style={{ color: '#94a3b8', textDecoration: 'line-through' }}>
                                        {p.oldPrice ? `₹${p.oldPrice}` : '—'}
                                    </td>
                                    <td>{p.discount || 0}%</td>
                                    <td><StockBadge qty={p.quantity ?? 100} /></td>
                                    <td style={{ color: '#64748b', fontSize: '0.8rem' }}>{p.unit || '1 kg'}</td>
                                    <td style={{ textAlign: 'center' }}>{p.isOrganic ? '✅' : '❌'}</td>
                                    <td>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: p.vendorId ? '#b45309' : '#64748b' }}>
                                            {p.vendorId ? (p.vendorId.storeName || p.vendorId.name) : "Admin"}
                                        </span>
                                    </td>
                                    <td className="action-btns" style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                        <button className="icon-btn edit-btn" onClick={() => openModal(p)} title="Edit">✏️</button>
                                        <button className="icon-btn delete-btn" onClick={() => handleDelete(p._id)} title="Delete">🗑️</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {filteredProducts.length === 0 && (
                        <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
                            <div style={{ fontSize: '2.5rem' }}>📦</div>
                            <p style={{ fontWeight: 600, marginTop: '8px' }}>No products found</p>
                        </div>
                    )}
                </div>
            )}

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxHeight: '90vh', overflowY: 'auto' }}>
                        <div className="modal-header">
                            <h3>{editingProduct?._id ? 'Update Product' : 'Add New Product'}</h3>
                        </div>
                        <form className="modal-form" onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Product Name</label>
                                <input type="text" name="name" value={formData.name} onChange={handleInputChange} required />
                            </div>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Category</label>
                                    <select name="category" value={formData.category} onChange={handleInputChange}>
                                        <option value="Vegetables">Vegetables</option>
                                        <option value="Fruits">Fruits</option>
                                        <option value="Organic">Organic</option>
                                        <option value="Dairy">Dairy</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Unit</label>
                                    <select name="unit" value={formData.unit} onChange={handleInputChange}>
                                        <option value="1 kg">1 kg</option>
                                        <option value="500 g">500 g</option>
                                        <option value="250 g">250 g</option>
                                        <option value="1 Piece">1 Piece</option>
                                        <option value="1 Pack">1 Pack</option>
                                        <option value="1 Box">1 Box</option>
                                        <option value="12 pcs">12 pcs</option>
                                        <option value="6 pcs">6 pcs</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Price (₹)</label>
                                    <input type="number" name="price" value={formData.price} onChange={handleInputChange} required min="0" />
                                </div>
                                <div className="form-group">
                                    <label>Old Price (₹)</label>
                                    <input type="number" name="oldPrice" value={formData.oldPrice} onChange={handleInputChange} min="0" placeholder="Optional" />
                                </div>
                            </div>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Discount (%)</label>
                                    <input type="number" name="discount" value={formData.discount} onChange={handleInputChange} min="0" max="100" />
                                </div>
                                <div className="form-group">
                                    <label>Quantity (Stock)</label>
                                    <input type="number" name="quantity" value={formData.quantity} onChange={handleInputChange} required min="0" />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Image URL</label>
                                <input type="text" name="image" value={formData.image} onChange={handleInputChange} required />
                            </div>
                            {formData.image && (
                                <div style={{ marginBottom: '12px' }}>
                                    <img src={formData.image} alt="preview" style={{ height: '80px', borderRadius: '10px', objectFit: 'cover' }} />
                                </div>
                            )}
                            <div className="form-group">
                                <label>Description (Optional)</label>
                                <textarea name="description" value={formData.description} onChange={handleInputChange} rows="2" style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                            </div>
                            <div className="form-group checkbox-group">
                                <input type="checkbox" name="isOrganic" checked={formData.isOrganic} onChange={handleInputChange} id="check-organic" />
                                <label htmlFor="check-organic">Is Organic Product?</label>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="save-btn" disabled={saving}>
                                    {saving ? 'Saving...' : (editingProduct?._id ? 'Save Changes' : 'Create Product')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageProducts;