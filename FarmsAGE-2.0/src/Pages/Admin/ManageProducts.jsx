import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Static product data (always visible in admin as base catalog)
import staticVegetables from '../../data/products';
import staticFruits from '../../data/fruits';
import staticOrganic from '../../data/organic';
import staticDairy from '../../data/dairy';

const API = import.meta.env.MODE === "development" ? "http://localhost:3000" : "https://farmsage-2-0-2.onrender.com";

const EMPTY_FORM = {
    name: '', category: 'Vegetables', image: '',
    isOrganic: false, discount: 0, price: '',
    oldPrice: '', quantity: 100, unit: '1 kg'
};

// Normalize category for static items
const normalizeStatic = (items, category) =>
    items.map(p => ({
        ...p,
        _id: null,           // no DB id = static item
        category,
        isOrganic: category === 'Organic',
        quantity: 100,
        unit: p.unit || '1 kg',
        discount: typeof p.discount === 'string' ? parseInt(p.discount) : (p.discount || 0),
        _isStatic: true,
    }));

const allStaticProducts = [
    ...normalizeStatic(staticVegetables, 'Vegetables'),
    ...normalizeStatic(staticFruits, 'Fruits'),
    ...normalizeStatic(staticOrganic, 'Organic'),
    ...normalizeStatic(staticDairy, 'Dairy'),
];

const ManageProducts = () => {
    const [dbProducts, setDbProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [savingToDb, setSavingToDb] = useState(null);

    useEffect(() => { fetchDbProducts(); }, []);

    const fetchDbProducts = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API}/api/admin/products`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDbProducts(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error('Failed to fetch DB products:', err);
        } finally {
            setLoading(false);
        }
    };

    // Build merged list: DB products override static ones with same name
    const dbProductNames = new Set(dbProducts.map(p => p.name.toLowerCase()));

    const mergedProducts = [
        ...dbProducts,
        ...allStaticProducts.filter(p => !dbProductNames.has(p.name.toLowerCase()))
    ];

    // Apply filters
    const filteredProducts = mergedProducts.filter(p => {
        const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchCat = categoryFilter === 'All' || p.category === categoryFilter;
        return matchSearch && matchCat;
    });

    const dbCount = dbProducts.length;
    const staticOnlyCount = mergedProducts.filter(p => p._isStatic).length;

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
                // new product OR saving a static product to DB
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

    // One-click save static product to DB
    const saveStaticToDB = async (product) => {
        setSavingToDb(product.name);
        const token = localStorage.getItem('token');
        const payload = {
            name: product.name,
            category: product.category,
            image: product.image,
            isOrganic: product.isOrganic || false,
            discount: product.discount || 0,
            price: product.price,
            oldPrice: product.oldPrice || null,
            quantity: 100,
            unit: product.unit || '1 kg'
        };
        try {
            await axios.post(`${API}/api/admin/products`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchDbProducts();
        } catch (err) {
            alert("Failed to save to DB: " + (err.response?.data?.message || err.message));
        } finally {
            setSavingToDb(null);
        }
    };

    const handleDelete = async (id) => {
        if (!id) return alert("This product is from local data. Click 'Save to DB' first, then you can delete it.");
        if (window.confirm("Are you sure you want to delete this product?")) {
            try {
                const token = localStorage.getItem('token');
                await axios.delete(`${API}/api/admin/products/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                fetchDbProducts();
            } catch (err) {
                alert("Delete failed!");
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
                        <span style={{ color: '#15803d', fontWeight: 700 }}>{dbCount} in database</span>
                        {staticOnlyCount > 0 && <span style={{ color: '#f59e0b', fontWeight: 700 }}> · {staticOnlyCount} local only</span>}
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
                <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading products...</div>
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
                                <th>Source</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProducts.map((p, idx) => (
                                <tr key={p._id || `static-${p.name}-${idx}`} style={{ opacity: p.quantity === 0 ? 0.65 : 1 }}>
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
                                        {p._isStatic ? (
                                            <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: '12px', fontSize: '0.68rem', fontWeight: 700 }}>
                                                Local
                                            </span>
                                        ) : (
                                            <span style={{ background: '#d1fae5', color: '#065f46', padding: '2px 8px', borderRadius: '12px', fontSize: '0.68rem', fontWeight: 700 }}>
                                                DB ✓
                                            </span>
                                        )}
                                    </td>
                                    <td className="action-btns" style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                                        {p._isStatic ? (
                                            <button
                                                title="Save to Database to enable full editing"
                                                onClick={() => saveStaticToDB(p)}
                                                disabled={savingToDb === p.name}
                                                style={{
                                                    padding: '4px 10px', borderRadius: '8px', border: 'none',
                                                    background: '#f59e0b', color: '#fff', fontWeight: 700,
                                                    fontSize: '0.72rem', cursor: 'pointer', whiteSpace: 'nowrap'
                                                }}
                                            >
                                                {savingToDb === p.name ? '...' : '💾 Save to DB'}
                                            </button>
                                        ) : (
                                            <>
                                                <button className="icon-btn edit-btn" onClick={() => openModal(p)} title="Edit">✏️</button>
                                                <button className="icon-btn delete-btn" onClick={() => handleDelete(p._id)} title="Delete">🗑️</button>
                                            </>
                                        )}
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
                                        <option value="1 pack">1 pack</option>
                                        <option value="1 Piece">1 Piece</option>
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
