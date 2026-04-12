import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { ShoppingBag, Users, Apple, TrendingUp, Package, Plus, Megaphone, Settings } from 'lucide-react';

const API = import.meta.env.MODE === "development" ? "http://localhost:3000" : "https://farmsage-2-0-2.onrender.com";


const Dashboard = () => {
  const [stats, setStats] = useState({
    orders: 0,
    products: 0,
    users: 0,
    sales: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [ordersRes, productsRes, usersRes] = await Promise.all([
        axios.get(`${API}/api/admin/orders`, { headers }),
        axios.get(`${API}/api/admin/products`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API}/api/admin/users`, { headers })
      ]);

      const totalSales = ordersRes.data.reduce((acc, order) => acc + (order.totalAmount || 0), 0);

      setStats({
        orders: ordersRes.data.length,
        products: productsRes.data.length || 0,
        users: usersRes.data.length,
        sales: totalSales.toFixed(2)
      });

      setRecentOrders(ordersRes.data.slice(0, 5));
      setLoading(false);
    } catch (error) {
      console.error("Error fetching dashboard data", error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-loading" style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh'}}>
        <div className="loader ring"></div>
        <p style={{marginTop: '20px', color: '#64748b', fontWeight: '500'}}>Analysing business intelligence...</p>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue"><Package size={24} /></div>
          <div className="stat-info">
            <h3>Total Orders</h3>
            <p>{stats.orders}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon pink"><ShoppingBag size={24} /></div>
          <div className="stat-info">
            <h3>Total Sales</h3>
            <p>₹{stats.sales}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green"><Users size={24} /></div>
          <div className="stat-info">
            <h3>Total Users</h3>
            <p>{stats.users}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon yellow"><Apple size={24} /></div>
          <div className="stat-info">
            <h3>Products</h3>
            <p>{stats.products}</p>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="data-table-container">
          <div className="table-header">
            <h3>Recent Orders</h3>
            <button className="view-all-btn" style={{background: 'none', border: 'none', color: '#3b82f6', fontWeight: '600', cursor: 'pointer'}}>View All</button>
          </div>
          <table className="custom-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>User</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order._id}>
                  <td>#{order._id.substring(18, 24).toUpperCase()}</td>
                  <td>{order.deliveryAddress?.name || 'Customer'}</td>
                  <td style={{fontWeight: '700'}}>₹{order.totalAmount}</td>
                  <td>
                    <span className={`status-badge status-${order.status?.toLowerCase()}`}>
                      {order.status}
                    </span>
                  </td>
                  <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="info-card fade-in">
          <div className="trend-header" style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem'}}>
            <TrendingUp size={20} color="#3b82f6" />
            <h3 style={{margin: 0}}>Quick Insights</h3>
          </div>

          <ul className="action-list" style={{listStyle: 'none', padding: 0}}>
            <li className="action-item" style={{display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '10px', background: '#f8fafc', marginBottom: '10px', cursor: 'pointer'}}>
              <div style={{background: '#e0f2fe', padding: '8px', borderRadius: '8px', color: '#0369a1'}}><Plus size={18} /></div>
              <p style={{margin: 0, fontSize: '0.9rem', fontWeight: '500'}}>Add New Product</p>
            </li>
            <li className="action-item" style={{display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '10px', background: '#f8fafc', marginBottom: '10px', cursor: 'pointer'}}>
              <div style={{background: '#fef3c7', padding: '8px', borderRadius: '8px', color: '#d97706'}}><Megaphone size={18} /></div>
              <p style={{margin: 0, fontSize: '0.9rem', fontWeight: '500'}}>Send Announcements</p>
            </li>
            <li className="action-item" style={{display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '10px', background: '#f8fafc', marginBottom: '10px', cursor: 'pointer'}}>
              <div style={{background: '#f1f5f9', padding: '8px', borderRadius: '8px', color: '#475569'}}><Settings size={18} /></div>
              <p style={{margin: 0, fontSize: '0.9rem', fontWeight: '500'}}>Site Settings</p>
            </li>
          </ul>

          <div className="revenue-summary" style={{marginTop: '2rem'}}>
            <h4 style={{fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1rem'}}>Sales Trend</h4>
            <div className="dummy-chart" style={{display: 'flex', alignItems: 'flex-end', gap: '8px', height: '100px', paddingBottom: '10px', borderBottom: '1px solid #f1f5f9'}}>
               <div className="bar" style={{height: '40%', width: '100%', background: '#e2e8f0', borderRadius: '4px'}}></div>
               <div className="bar" style={{height: '60%', width: '100%', background: '#e2e8f0', borderRadius: '4px'}}></div>
               <div className="bar" style={{height: '45%', width: '100%', background: '#e2e8f0', borderRadius: '4px'}}></div>
               <div className="bar" style={{height: '80%', width: '100%', background: '#e2e8f0', borderRadius: '4px'}}></div>
               <div className="bar active" style={{height: '95%', width: '100%', background: 'var(--primary-gradient)', borderRadius: '4px'}}></div>
               <div className="bar" style={{height: '70%', width: '100%', background: '#e2e8f0', borderRadius: '4px'}}></div>
               <div className="bar" style={{height: '55%', width: '100%', background: '#e2e8f0', borderRadius: '4px'}}></div>
            </div>
            <div className="chart-labels" style={{display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.7rem', color: '#94a3b8'}}>
              <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;


