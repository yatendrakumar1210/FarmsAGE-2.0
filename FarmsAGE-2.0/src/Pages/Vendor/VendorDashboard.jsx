import React, { useState, useEffect } from "react";
import { ShoppingBasket, ShoppingCart, DollarSign, TrendingUp } from "lucide-react";
import "./vendor.css";

const API = import.meta.env.MODE === "development" ? "http://localhost:3000" : "https://farmsage-2-0-2.onrender.com";

const VendorDashboard = () => {
  const [stats, setStats] = useState({ products: 0, orders: 0, revenue: 0, pending: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      try {
        const [prodRes, orderRes] = await Promise.all([
          fetch(`${API}/api/vendor/products`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API}/api/vendor/orders`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        const products = await prodRes.json();
        const orders = await orderRes.json();

        const prodArr = Array.isArray(products) ? products : [];
        const orderArr = Array.isArray(orders) ? orders : [];

        const revenue = orderArr
          .filter((o) => o.paymentStatus === "Paid")
          .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

        const pending = orderArr.filter((o) => o.status === "Pending").length;

        setStats({
          products: prodArr.length,
          orders: orderArr.length,
          revenue,
          pending,
        });

        setRecentOrders(orderArr.slice(0, 5));
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "40vh", color: "#64748b", fontWeight: 600 }}>
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="fade-in">
      <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#0f172a", marginBottom: "1.5rem", fontFamily: "'Outfit', sans-serif" }}>
        Vendor Dashboard
      </h2>

      {/* Stats */}
      <div className="vendor-stats-grid">
        <div className="vendor-stat-card">
          <div className="vendor-stat-icon emerald"><ShoppingBasket size={22} /></div>
          <div className="vendor-stat-info">
            <h3>Products</h3>
            <p>{stats.products}</p>
          </div>
        </div>
        <div className="vendor-stat-card">
          <div className="vendor-stat-icon blue"><ShoppingCart size={22} /></div>
          <div className="vendor-stat-info">
            <h3>Total Orders</h3>
            <p>{stats.orders}</p>
          </div>
        </div>
        <div className="vendor-stat-card">
          <div className="vendor-stat-icon amber"><DollarSign size={22} /></div>
          <div className="vendor-stat-info">
            <h3>Revenue</h3>
            <p>₹{stats.revenue.toLocaleString()}</p>
          </div>
        </div>
        <div className="vendor-stat-card">
          <div className="vendor-stat-icon purple"><TrendingUp size={22} /></div>
          <div className="vendor-stat-info">
            <h3>Pending</h3>
            <p>{stats.pending}</p>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="data-table-container">
        <div className="table-header">
          <h3>Recent Orders</h3>
        </div>
        {recentOrders.length === 0 ? (
          <div className="vendor-empty-state">
            <div className="icon-wrap"><ShoppingCart size={28} /></div>
            <h4>No orders yet</h4>
            <p>Orders from your store will appear here once customers start purchasing.</p>
          </div>
        ) : (
          <table className="custom-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order._id}>
                  <td style={{ fontFamily: "monospace", fontSize: "0.8rem", fontWeight: 600 }}>
                    #{order._id?.slice(-6).toUpperCase()}
                  </td>
                  <td>{order.userId?.name || "Customer"}</td>
                  <td>{order.items?.length || 0} items</td>
                  <td style={{ fontWeight: 700, color: "#059669" }}>₹{order.totalAmount}</td>
                  <td>
                    <span className={`status-badge status-${order.status?.toLowerCase() === "delivered" ? "completed" : order.status?.toLowerCase() === "cancelled" ? "canceled" : "pending"}`}>
                      {order.status}
                    </span>
                  </td>
                  <td style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default VendorDashboard;
