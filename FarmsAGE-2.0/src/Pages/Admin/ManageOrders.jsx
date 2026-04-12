import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = import.meta.env.MODE === "development" ? "http://localhost:3000" : "https://farmsage-2-0-2.onrender.com";


const ManageOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API}/api/admin/orders`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setOrders(res.data);
            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    const updateStatus = async (id, status) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${API}/api/admin/orders/${id}`, { status }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchOrders();
            alert(`Order status updated to ${status}`);
        } catch (error) {
            console.error(error);
            alert("Failed to update status");
        }
    };

    return (
        <div className="fade-in">
            <div className="table-header">
                <h3>Incoming Orders ({orders.length})</h3>
            </div>

            <div className="data-table-container">
                <table className="custom-table">
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Customer</th>
                            <th>Items</th>
                            <th>Total Amount</th>
                            <th>Payment</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map((o) => (
                            <tr key={o._id}>
                                <td>#{o._id.substring(18, 24).toUpperCase()}</td>
                                <td>
                                    <p className="customer-name">{o.deliveryAddress?.name || 'Unknown'}</p>
                                    <p className="customer-phone" style={{fontSize: '0.75rem', opacity: 0.7}}>{o.deliveryAddress?.phone}</p>
                                </td>
                                <td>{o.items?.length || 0} items</td>
                                <td className="order-total">₹{o.totalAmount}</td>
                                <td>
                                    <span className={`status-badge payment-${o.paymentStatus?.toLowerCase()}`}>
                                        {o.paymentStatus}
                                    </span>
                                </td>
                                <td>
                                    <span className={`status-badge status-${o.status?.toLowerCase()}`}>
                                        {o.status}
                                    </span>
                                </td>
                                <td>
                                    <select 
                                        className="status-select" 
                                        value={o.status} 
                                        onChange={(e) => updateStatus(o._id, e.target.value)}
                                        style={{padding: '5px', borderRadius: '5px', border: '1px solid #ddd'}}
                                    >
                                        <option value="Pending">Pending</option>
                                        <option value="Processing">Processing</option>
                                        <option value="OutForDelivery">Out For Delivery</option>
                                        <option value="Delivered">Delivered</option>
                                        <option value="Cancelled">Cancelled</option>
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ManageOrders;


