import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = import.meta.env.MODE === "development" ? "http://localhost:3000" : "https://farmsage-2-0-2.onrender.com";

const formatDateTime = (isoString) => {
    if (!isoString) return '—';
    const d = new Date(isoString);
    return d.toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true
    });
};

const StatusBadge = ({ value, type }) => {
    const colors = {
        // Order status
        Pending:        { bg: '#fef3c7', color: '#92400e' },
        Processing:     { bg: '#dbeafe', color: '#1e40af' },
        OutForDelivery: { bg: '#ede9fe', color: '#5b21b6' },
        Delivered:      { bg: '#d1fae5', color: '#065f46' },
        Cancelled:      { bg: '#fee2e2', color: '#991b1b' },
        // Payment status
        Paid:           { bg: '#d1fae5', color: '#065f46' },
        Failed:         { bg: '#fee2e2', color: '#991b1b' },
    };
    const style = colors[value] || { bg: '#f1f5f9', color: '#475569' };
    return (
        <span style={{
            background: style.bg, color: style.color,
            padding: '3px 10px', borderRadius: '20px',
            fontSize: '0.72rem', fontWeight: 700, whiteSpace: 'nowrap'
        }}>
            {value}
        </span>
    );
};

const ManageOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedOrder, setExpandedOrder] = useState(null);

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
        } catch (error) {
            console.error('Failed to fetch orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id, status) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${API}/api/admin/orders/${id}`, { status }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setOrders(prev => prev.map(o => o._id === id ? { ...o, status } : o));
        } catch (error) {
            console.error(error);
            alert("Failed to update status");
        }
    };

    if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>Loading orders...</div>;
    if (orders.length === 0) return (
        <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📭</div>
            <p style={{ fontWeight: 600 }}>No orders yet</p>
        </div>
    );

    return (
        <div className="fade-in">
            <div className="table-header">
                <h3>All Orders ({orders.length})</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '4px 0' }}>
                {orders.map((order) => {
                    const isExpanded = expandedOrder === order._id;
                    const addr = order.deliveryAddress || {};

                    return (
                        <div key={order._id} style={{
                            background: '#fff', border: '1px solid #e2e8f0',
                            borderRadius: '16px', overflow: 'hidden',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
                        }}>
                            {/* Order Header Row */}
                            <div
                                style={{
                                    display: 'flex', alignItems: 'center', flexWrap: 'wrap',
                                    gap: '12px', padding: '14px 20px', cursor: 'pointer',
                                    background: isExpanded ? '#f8faff' : '#fff',
                                    borderBottom: isExpanded ? '1px solid #e8edf5' : 'none'
                                }}
                                onClick={() => setExpandedOrder(isExpanded ? null : order._id)}
                            >
                                {/* Order ID */}
                                <div style={{ minWidth: '90px' }}>
                                    <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: '2px' }}>Order ID</div>
                                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1e293b' }}>
                                        #{order._id.slice(-6).toUpperCase()}
                                    </div>
                                </div>

                                {/* Date & Time */}
                                <div style={{ minWidth: '160px' }}>
                                    <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: '2px' }}>Ordered At</div>
                                    <div style={{ fontWeight: 600, fontSize: '0.82rem', color: '#334155' }}>
                                        📅 {formatDateTime(order.createdAt)}
                                    </div>
                                </div>

                                {/* Customer */}
                                <div style={{ minWidth: '140px', flex: 1 }}>
                                    <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: '2px' }}>Customer</div>
                                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1e293b' }}>{addr.name || order.userId?.name || 'Unknown'}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{addr.phone || '—'}</div>
                                </div>

                                {/* Vendor */}
                                <div style={{ minWidth: '110px' }}>
                                    <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: '2px' }}>Vendor</div>
                                    <div style={{ fontWeight: 600, fontSize: '0.82rem', color: order.vendorId ? '#7c3aed' : '#94a3b8' }}>
                                        {order.vendorId ? (order.vendorId.storeName || order.vendorId.name || 'Vendor') : '—'}
                                    </div>
                                </div>

                                {/* Items count */}
                                <div style={{ minWidth: '80px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: '2px' }}>Items</div>
                                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1e293b' }}>{order.items?.length || 0}</div>
                                </div>

                                {/* Total */}
                                <div style={{ minWidth: '90px' }}>
                                    <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: '2px' }}>Total</div>
                                    <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#15803d' }}>₹{order.totalAmount}</div>
                                </div>

                                {/* Payment */}
                                <div style={{ minWidth: '80px' }}>
                                    <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Payment</div>
                                    <StatusBadge value={order.paymentStatus} />
                                </div>

                                {/* Status + Dropdown */}
                                <div style={{ minWidth: '150px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <StatusBadge value={order.status} />
                                    <select
                                        value={order.status}
                                        onChange={(e) => { e.stopPropagation(); updateStatus(order._id, e.target.value); }}
                                        onClick={(e) => e.stopPropagation()}
                                        style={{
                                            padding: '4px 8px', borderRadius: '8px', border: '1px solid #e2e8f0',
                                            fontSize: '0.75rem', fontWeight: 600, color: '#475569',
                                            cursor: 'pointer', background: '#f8fafc'
                                        }}
                                    >
                                        <option value="Pending">Pending</option>
                                        <option value="Processing">Processing</option>
                                        <option value="OutForDelivery">Out For Delivery</option>
                                        <option value="Delivered">Delivered</option>
                                        <option value="Cancelled">Cancelled</option>
                                    </select>
                                </div>

                                {/* Expand toggle */}
                                <div style={{ marginLeft: 'auto', fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
                                    {isExpanded ? '▲ Hide' : '▼ Details'}
                                </div>
                            </div>

                            {/* Expanded Detail Panel */}
                            {isExpanded && (
                                <div style={{ padding: '20px', background: '#f8fafc', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

                                    {/* Items List */}
                                    <div>
                                        <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                                            🛒 Ordered Items
                                        </h4>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            {(order.items || []).map((item, i) => (
                                                <div key={i} style={{
                                                    display: 'flex', alignItems: 'center', gap: '12px',
                                                    background: '#fff', borderRadius: '10px', padding: '10px 12px',
                                                    border: '1px solid #e2e8f0'
                                                }}>
                                                    {item.image && (
                                                        <img src={item.image} alt={item.name}
                                                            style={{ width: '44px', height: '44px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }}
                                                        />
                                                    )}
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1e293b' }}>{item.name}</div>
                                                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                                                            {item.weight && <span>⚖️ {item.weight} &nbsp;</span>}
                                                            <span>× {item.quantity}</span>
                                                        </div>
                                                    </div>
                                                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#15803d', flexShrink: 0 }}>
                                                        ₹{item.price * item.quantity}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Delivery Address + Meta */}
                                    <div>
                                        <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                                            📍 Delivery Address
                                        </h4>
                                        <div style={{ background: '#fff', borderRadius: '10px', padding: '14px 16px', border: '1px solid #e2e8f0', fontSize: '0.85rem', color: '#334155', lineHeight: '1.8' }}>
                                            <div><strong>{addr.name || '—'}</strong></div>
                                            <div>📞 {addr.phone || '—'}</div>
                                            <div>🏠 {addr.street || '—'}</div>
                                            <div>{addr.city || '—'}{addr.pincode ? ` — ${addr.pincode}` : ''}</div>
                                        </div>

                                        <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '16px 0 12px' }}>
                                            💳 Payment Info
                                        </h4>
                                        <div style={{ background: '#fff', borderRadius: '10px', padding: '14px 16px', border: '1px solid #e2e8f0', fontSize: '0.85rem', color: '#334155', lineHeight: '2' }}>
                                            <div>Method: <strong>{order.paymentMethod || 'COD'}</strong></div>
                                            <div>Status: <StatusBadge value={order.paymentStatus} /></div>
                                            {order.paymentId && <div style={{ fontSize: '0.75rem', color: '#64748b' }}>ID: {order.paymentId}</div>}
                                            <div>Total: <strong style={{ color: '#15803d' }}>₹{order.totalAmount}</strong></div>
                                            {order.vendorId && (
                                                <div style={{ marginTop: '4px', paddingTop: '4px', borderTop: '1px solid #f1f5f9' }}>
                                                    Vendor: <strong style={{ color: '#7c3aed' }}>{order.vendorId.storeName || order.vendorId.name}</strong>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ManageOrders;
