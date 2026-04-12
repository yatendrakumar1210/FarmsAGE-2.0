import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = import.meta.env.MODE === "development" ? "http://localhost:3000" : "https://farmsage-2-0-2.onrender.com";


const ManageProducts = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        category: 'Fruits',
        image: '',
        isOrganic: false,
        discount: 0,
        price: ''
    });

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API}/api/admin/products`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Fallback for public products if admin specific fails
            setProducts(res.data);
            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const openModal = (product = null) => {
        if (product) {
            setEditingProduct(product);
            setFormData({
                name: product.name,
                category: product.category,
                image: product.image,
                isOrganic: product.isOrganic,
                discount: product.discount,
                price: product.price
            });
        } else {
            setEditingProduct(null);
            setFormData({
                name: '',
                category: 'Fruits',
                image: '',
                isOrganic: false,
                discount: 0,
                price: ''
            });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        try {
            if (editingProduct) {
                await axios.put(`${API}/api/admin/products/${editingProduct._id}`, formData, { headers });
            } else {
                await axios.post(`${API}/api/admin/products`, formData, { headers });
            }
            setShowModal(false);
            fetchProducts();
        } catch (error) {
            console.error(error);
            alert("Action failed!");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this product?")) {
            try {
                const token = localStorage.getItem('token');
                await axios.delete(`${API}/api/admin/products/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                fetchProducts();
            } catch (error) {
                console.error(error);
            }
        }
    };

    return (
        <div className="fade-in">
            <div className="table-header">
                <h3>Product Inventory ({products.length})</h3>
                <button className="add-btn" onClick={() => openModal()}>
                    <span>+</span> Add New Product
                </button>
            </div>

            <div className="data-table-container">
                <table className="custom-table">
                    <thead>
                        <tr>
                            <th>Image</th>
                            <th>Name</th>
                            <th>Category</th>
                            <th>Price</th>
                            <th>Discount</th>
                            <th>Organic</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map((p) => (
                            <tr key={p._id}>
                                <td><img src={p.image} alt={p.name} style={{width: '50px', borderRadius: '8px'}} /></td>
                                <td className="p-name">{p.name}</td>
                                <td>{p.category}</td>
                                <td>₹{p.price}</td>
                                <td>{p.discount}%</td>
                                <td>{p.isOrganic ? '✅' : '❌'}</td>
                                <td className="action-btns">
                                    <button className="icon-btn edit-btn" onClick={() => openModal(p)}>✏️</button>
                                    <button className="icon-btn delete-btn" onClick={() => handleDelete(p._id)}>🗑️</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>{editingProduct ? 'Update Product' : 'Add New Product'}</h3>
                        </div>
                        <form className="modal-form" onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Product Name</label>
                                <input type="text" name="name" value={formData.name} onChange={handleInputChange} required />
                            </div>
                            <div className="form-group-row" style={{display: 'flex', gap: '15px'}}>
                                <div className="form-group" style={{flex: 1}}>
                                    <label>Category</label>
                                    <select name="category" value={formData.category} onChange={handleInputChange}>
                                        <option value="Fruits">Fruits</option>
                                        <option value="Vegetables">Vegetables</option>
                                        <option value="Organic">Organic</option>
                                        <option value="Dairy">Dairy</option>
                                    </select>
                                </div>
                                <div className="form-group" style={{flex: 1}}>
                                    <label>Price (₹)</label>
                                    <input type="number" name="price" value={formData.price} onChange={handleInputChange} required />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Image URL</label>
                                <input type="text" name="image" value={formData.image} onChange={handleInputChange} required />
                            </div>
                            <div className="form-group-row" style={{display: 'flex', gap: '15px', alignItems: 'center'}}>
                                <div className="form-group" style={{flex: 1}}>
                                    <label>Discount (%)</label>
                                    <input type="number" name="discount" value={formData.discount} onChange={handleInputChange} />
                                </div>
                                <div className="form-group" style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                                    <input type="checkbox" name="isOrganic" checked={formData.isOrganic} onChange={handleInputChange} id="check-organic" />
                                    <label htmlFor="check-organic" style={{marginBottom: 0}}>Is Organic?</label>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="save-btn">{editingProduct ? 'Save Changes' : 'Create Product'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageProducts;


