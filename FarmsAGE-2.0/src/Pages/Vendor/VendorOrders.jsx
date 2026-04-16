import React, { useState, useEffect } from "react";
import { ShoppingCart, User, MapPin, Clock } from "lucide-react";
import "./vendor.css";

const API = import.meta.env.MODE === "development" ? "http://localhost:3000" : "https://farmsage-2-0-2.onrender.com";

const VendorOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const token = localStorage.getItem("token");

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/vendor/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await fetch(`${API}/api/vendor/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchOrders();
    } catch (err) {
      console.error("Status update failed:", err);
    }
  };

  const filteredOrders = filter === "All" ? orders : orders.filter((o) => o.status === filter);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "40vh", color: "#64748b", fontWeight: 600 }}>
        Loading orders...
      </div>
    );
  }

  return (
    <div className="fade-in">
      <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#0f172a", marginBottom: "1.5rem", fontFamily: "'Outfit', sans-serif" }}>
        Order Management
      </h2>

      {/* Filter Tabs */}
      <div className="vendor-product-tabs" style={{ marginBottom: "1.5rem" }}>
        {["All", "Pending", "Processing", "OutForDelivery", "Delivered", "Cancelled"].map((s) => (
          <button
            key={s}
            className={`vendor-tab-btn ${filter === s ? "active" : ""}`}
            onClick={() => setFilter(s)}
          >
            {s === "OutForDelivery" ? "Out For Delivery" : s}
            {s === "All" ? ` (${orders.length})` : ` (${orders.filter((o) => o.status === s).length})`}
          </button>
        ))}
      </div>

      {filteredOrders.length === 0 ? (
        <div className="vendor-empty-state">
          <div className="icon-wrap"><ShoppingCart size={28} /></div>
          <h4>No {filter !== "All" ? filter.toLowerCase() : ""} orders</h4>
          <p>Orders matching this filter will appear here.</p>
        </div>
      ) : (
        filteredOrders.map((order) => (
          <div key={order._id} className="vendor-order-card">
            <div className="vendor-order-header">
              <div>
                <span className="vendor-order-id">Order #{order._id?.slice(-6).toUpperCase()}</span>
                <span className="vendor-order-date" style={{ marginLeft: 12 }}>
                  <Clock size={12} style={{ verticalAlign: "middle", marginRight: 4 }} />
                  {new Date(order.createdAt).toLocaleString()}
                </span>
              </div>
              <select
                className="vendor-status-select"
                value={order.status}
                onChange={(e) => handleStatusChange(order._id, e.target.value)}
              >
                <option value="Pending">Pending</option>
                <option value="Processing">Processing</option>
                <option value="OutForDelivery">Out For Delivery</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            {/* Customer Info */}
            <div style={{ display: "flex", gap: "1.5rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.8rem", color: "#64748b", fontWeight: 500 }}>
                <User size={14} style={{ color: "#94a3b8" }} />
                {order.userId?.name || "Customer"}
              </div>
              {order.userId?.phone && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.8rem", color: "#64748b", fontWeight: 500 }}>
                  📞 {order.userId.phone}
                </div>
              )}
              {order.deliveryAddress && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.8rem", color: "#64748b", fontWeight: 500 }}>
                  <MapPin size={14} style={{ color: "#94a3b8" }} />
                  {order.deliveryAddress.street}, {order.deliveryAddress.city} - {order.deliveryAddress.pincode}
                </div>
              )}
            </div>

            {/* Items */}
            <div className="vendor-order-items">
              {order.items?.map((item, i) => (
                <div key={i} className="vendor-order-item">
                  {item.image && (
                    <img src={item.image} alt={item.name} style={{ width: 24, height: 24, borderRadius: 6, objectFit: "cover" }} />
                  )}
                  {item.name} × {item.quantity}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="vendor-order-footer">
              <div>
                <span className="vendor-order-total">₹{order.totalAmount}</span>
                <span style={{ marginLeft: 10, fontSize: "0.75rem", fontWeight: 600, color: order.paymentStatus === "Paid" ? "#15803d" : "#b45309", background: order.paymentStatus === "Paid" ? "#f0fdf4" : "#fffbeb", padding: "2px 10px", borderRadius: 20 }}>
                  {order.paymentMethod} • {order.paymentStatus}
                </span>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default VendorOrders;
