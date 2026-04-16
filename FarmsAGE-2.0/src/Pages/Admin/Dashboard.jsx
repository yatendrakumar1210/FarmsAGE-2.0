import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import {
  ShoppingBag,
  Users,
  Apple,
  TrendingUp,
  Package,
  Plus,
  Megaphone,
  Settings,
} from "lucide-react";

const API =
  import.meta.env.MODE === "development"
    ? "http://localhost:3000"
    : "https://farmsage-2-0-2.onrender.com";

const Dashboard = () => {
  const [stats, setStats] = useState({
    orders: 0,
    products: 0,
    users: 0,
    sales: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const [ordersRes, productsRes, usersRes] = await Promise.all([
        axios.get(`${API}/api/admin/orders`, { headers }),
        axios
          .get(`${API}/api/admin/products`, { headers })
          .catch(() => ({ data: [] })),
        axios.get(`${API}/api/admin/users`, { headers }),
      ]);

      const totalSales = ordersRes.data.reduce(
        (acc, order) => acc + (order.totalAmount || 0),
        0,
      );

      setStats({
        orders: ordersRes.data.length,
        products: productsRes.data.length || 0,
        users: usersRes.data.length,
        sales: totalSales.toFixed(2),
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
      <div
        className="admin-loading"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "60vh",
        }}
      >
        <div className="loader ring"></div>
        <p style={{ marginTop: "20px", color: "#64748b", fontWeight: "500" }}>
          Analysing business intelligence...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            title: "Total Orders",
            value: stats.orders,
            icon: <Package size={18} />,
            color: "bg-blue-100 text-blue-600",
          },
          {
            title: "Total Sales",
            value: `₹${stats.sales}`,
            icon: <ShoppingBag size={18} />,
            color: "bg-pink-100 text-pink-600",
          },
          {
            title: "Total Users",
            value: stats.users,
            icon: <Users size={18} />,
            color: "bg-green-100 text-green-600",
          },
          {
            title: "Products",
            value: stats.products,
            icon: <Apple size={18} />,
            color: "bg-yellow-100 text-yellow-600",
          },
        ].map((item, i) => (
          <div
            key={i}
            className="bg-white p-4 rounded-xl shadow-sm border flex items-center gap-3"
          >
            <div
              className={`w-9 h-9 flex items-center justify-center rounded-lg ${item.color}`}
            >
              {item.icon}
            </div>
            <div>
              <p className="text-xs text-gray-500">{item.title}</p>
              <p className="text-lg font-bold">{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">Recent Orders</h3>
            <button className="text-blue-600 text-sm font-semibold hover:underline">
              View All
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[600px] w-full text-sm">
              <thead>
                <tr className="text-gray-500 border-b">
                  <th className="py-2 text-left">Order ID</th>
                  <th>User</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>

              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order._id} className="border-b">
                    <td className="py-2 font-medium">
                      #{order._id.substring(18, 24).toUpperCase()}
                    </td>
                    <td>{order.deliveryAddress?.name || "Customer"}</td>
                    <td className="font-bold">₹{order.totalAmount}</td>
                    <td>
                      <span className="px-2 py-1 text-xs rounded bg-gray-100">
                        {order.status}
                      </span>
                    </td>
                    <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Insights */}
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-blue-600" />
            <h3 className="font-semibold">Quick Insights</h3>
          </div>

          <div className="space-y-3">
            {[
              {
                label: "Add New Product",
                icon: <Plus size={16} />,
                color: "bg-blue-100 text-blue-600",
              },
              {
                label: "Send Announcements",
                icon: <Megaphone size={16} />,
                color: "bg-yellow-100 text-yellow-600",
              },
              {
                label: "Site Settings",
                icon: <Settings size={16} />,
                color: "bg-gray-100 text-gray-600",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer"
              >
                <div className={`p-2 rounded ${item.color}`}>{item.icon}</div>
                <p className="text-sm font-medium">{item.label}</p>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div className="mt-6">
            <p className="text-xs text-gray-500 mb-2">Sales Trend</p>

            <div className="flex items-end gap-2 h-24">
              {[40, 60, 45, 80, 95, 70, 55].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 bg-gray-200 rounded"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>

            <div className="flex justify-between text-[10px] text-gray-400 mt-2">
              {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                <span key={i}>{d}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
