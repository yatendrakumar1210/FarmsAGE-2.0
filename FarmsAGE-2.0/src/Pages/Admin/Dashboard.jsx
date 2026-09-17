import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  ShoppingBag,
  Users,
  Apple,
  TrendingUp,
  Package,
  Plus,
  Megaphone,
  Settings,
  AlertCircle,
  Clock,
  ArrowUpRight,
  Sparkles,
  X,
  CheckCircle2,
} from "lucide-react";

const API =
  import.meta.env.MODE === "development"
    ? "http://localhost:3000"
    : "https://farmsage-2-0-2.onrender.com";

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    orders: 0,
    products: 0,
    users: 0,
    sales: 0,
    avgOrderValue: 0,
    pendingOrders: 0,
    outOfStockProducts: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Announcement state
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [announcementText, setAnnouncementText] = useState(
    localStorage.getItem("farmsage_announcement") || ""
  );
  const [announcementSaved, setAnnouncementSaved] = useState(false);

  // Dynamic Weekly Sales calculation
  const [weeklySalesData, setWeeklySalesData] = useState([
    { day: "M", sales: 0, height: 20 },
    { day: "T", sales: 0, height: 35 },
    { day: "W", sales: 0, height: 50 },
    { day: "T", sales: 0, height: 40 },
    { day: "F", sales: 0, height: 75 },
    { day: "S", sales: 0, height: 90 },
    { day: "S", sales: 0, height: 60 },
  ]);

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

      const orders = ordersRes.data || [];
      const products = productsRes.data || [];
      const users = usersRes.data || [];

      const totalSales = orders.reduce(
        (acc, order) => acc + (order.totalAmount || 0),
        0
      );

      const pendingCount = orders.filter(
        (o) => o.status !== "Delivered" && o.status !== "Cancelled"
      ).length;

      const outOfStockCount = products.filter(
        (p) => p.quantity === 0 || p.quantity === "0" || p.isOutOfStock === true
      ).length;

      const avgOrder = orders.length > 0 ? (totalSales / orders.length).toFixed(0) : 0;

      setStats({
        orders: orders.length,
        products: products.length,
        users: users.length,
        sales: totalSales.toFixed(2),
        avgOrderValue: avgOrder,
        pendingOrders: pendingCount,
        outOfStockProducts: outOfStockCount,
      });

      setRecentOrders(orders.slice(0, 5));

      // Calculate Day-wise sales distribution
      const days = ["S", "M", "T", "W", "T", "F", "S"];
      const daySalesMap = [0, 0, 0, 0, 0, 0, 0];

      orders.forEach((ord) => {
        if (ord.createdAt) {
          const d = new Date(ord.createdAt).getDay();
          daySalesMap[d] += ord.totalAmount || 0;
        }
      });

      const maxSales = Math.max(...daySalesMap, 100);
      const formattedWeekly = [1, 2, 3, 4, 5, 6, 0].map((dayIndex) => {
        const amount = daySalesMap[dayIndex];
        const height = Math.max(15, Math.round((amount / maxSales) * 100));
        return {
          day: days[dayIndex],
          sales: amount,
          height: height > 100 ? 100 : height,
        };
      });

      setWeeklySalesData(formattedWeekly);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching dashboard data", error);
      setLoading(false);
    }
  };

  const handleSaveAnnouncement = (e) => {
    e.preventDefault();
    localStorage.setItem("farmsage_announcement", announcementText.trim());
    setAnnouncementSaved(true);
    setTimeout(() => {
      setAnnouncementSaved(false);
      setShowAnnouncementModal(false);
    }, 1200);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-500 font-medium text-sm">
          Analyzing business intelligence...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-2xl p-5 text-white shadow-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="text-amber-300" size={20} />
            <h2 className="text-xl font-black">FarmsAGE 2.0 Command Center</h2>
          </div>
          <p className="text-xs text-emerald-100/80 mt-1">
            Real-time analytics, inventory management, and store insights.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/admin/products")}
            className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white text-xs font-bold px-3 py-2 rounded-xl transition flex items-center gap-1.5"
          >
            <Plus size={15} /> Add Product
          </button>
          <button
            onClick={() => setShowAnnouncementModal(true)}
            className="bg-amber-400 hover:bg-amber-300 text-slate-900 text-xs font-black px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shadow-md"
          >
            <Megaphone size={15} /> Broadcast
          </button>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            title: "Total Orders",
            value: stats.orders,
            sub: `${stats.pendingOrders} pending processing`,
            icon: <Package size={20} />,
            color: "bg-blue-50 text-blue-600 border-blue-100",
            link: "/admin/orders",
          },
          {
            title: "Total Revenue",
            value: `₹${stats.sales}`,
            sub: `Avg order ₹${stats.avgOrderValue}`,
            icon: <ShoppingBag size={20} />,
            color: "bg-emerald-50 text-emerald-600 border-emerald-100",
            link: "/admin/orders",
          },
          {
            title: "Total Customers",
            value: stats.users,
            sub: "Active marketplace users",
            icon: <Users size={20} />,
            color: "bg-purple-50 text-purple-600 border-purple-100",
            link: "/admin/users",
          },
          {
            title: "Catalog Products",
            value: stats.products,
            sub: stats.outOfStockProducts > 0 ? `${stats.outOfStockProducts} Out of stock` : "All in stock",
            icon: <Apple size={20} />,
            color: stats.outOfStockProducts > 0 ? "bg-rose-50 text-rose-600 border-rose-100" : "bg-amber-50 text-amber-600 border-amber-100",
            link: "/admin/products",
          },
        ].map((item, i) => (
          <div
            key={i}
            onClick={() => navigate(item.link)}
            className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:border-slate-200 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="flex justify-between items-start">
              <div className={`p-2.5 rounded-xl border ${item.color}`}>
                {item.icon}
              </div>
              <ArrowUpRight size={16} className="text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
            </div>
            <div className="mt-3">
              <p className="text-xs font-semibold text-slate-500">{item.title}</p>
              <p className="text-xl font-black text-slate-900 mt-0.5">{item.value}</p>
              <p className="text-[10px] text-slate-400 font-medium mt-1 truncate">{item.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-base">Recent Orders</h3>
              <p className="text-xs text-slate-400">Live order status and breakdown</p>
            </div>
            <button
              onClick={() => navigate("/admin/orders")}
              className="text-emerald-600 hover:text-emerald-800 text-xs font-bold flex items-center gap-1 hover:underline"
            >
              View All Orders <ArrowUpRight size={14} />
            </button>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="min-w-[600px] w-full text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-100 font-semibold text-[11px] uppercase tracking-wider">
                  <th className="py-2.5 text-left">Order ID</th>
                  <th className="py-2.5 text-left">Customer</th>
                  <th className="py-2.5 text-left">Total</th>
                  <th className="py-2.5 text-left">Status</th>
                  <th className="py-2.5 text-right">Date</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-50">
                {recentOrders.length > 0 ? (
                  recentOrders.map((order) => (
                    <tr key={order._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 font-bold text-slate-800">
                        #{order._id?.substring(18, 24).toUpperCase() || "ORD"}
                      </td>
                      <td className="py-3 text-slate-600 font-medium">
                        {order.deliveryAddress?.name || "Customer"}
                      </td>
                      <td className="py-3 font-black text-slate-900">
                        ₹{order.totalAmount}
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2.5 py-1 text-[10px] font-extrabold rounded-md uppercase tracking-wider ${
                            order.status === "Delivered"
                              ? "bg-emerald-100 text-emerald-800"
                              : order.status === "Cancelled"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {order.status || "Pending"}
                        </span>
                      </td>
                      <td className="py-3 text-right text-slate-400 font-medium">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "Today"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-slate-400 font-medium">
                      No orders placed yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Insights Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <TrendingUp size={18} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-base">Quick Insights</h3>
                <p className="text-[11px] text-slate-400">Action shortcuts & real-time metrics</p>
              </div>
            </div>

            {/* Quick Action Shortcuts */}
            <div className="space-y-2.5 mb-6">
              {[
                {
                  label: "Add New Product",
                  desc: "Create & publish items",
                  icon: <Plus size={16} />,
                  color: "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white",
                  action: () => navigate("/admin/products"),
                },
                {
                  label: "Broadcast Announcement",
                  desc: "Set live promo banner",
                  icon: <Megaphone size={16} />,
                  color: "bg-amber-50 text-amber-600 group-hover:bg-amber-500 group-hover:text-white",
                  action: () => setShowAnnouncementModal(true),
                },
                {
                  label: "Manage Orders",
                  desc: `${stats.pendingOrders} order(s) pending`,
                  icon: <Clock size={16} />,
                  color: "bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white",
                  action: () => navigate("/admin/orders"),
                },
                {
                  label: "Customer Directory",
                  desc: `${stats.users} registered buyers`,
                  icon: <Users size={16} />,
                  color: "bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white",
                  action: () => navigate("/admin/users"),
                },
              ].map((item, i) => (
                <div
                  key={i}
                  onClick={item.action}
                  className="group flex items-center justify-between p-3 rounded-xl bg-slate-50/70 hover:bg-slate-100 border border-slate-100 hover:border-slate-200 cursor-pointer transition-all duration-200"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg transition-colors ${item.color}`}>
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{item.label}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{item.desc}</p>
                    </div>
                  </div>
                  <ArrowUpRight size={14} className="text-slate-300 group-hover:text-slate-700 transition" />
                </div>
              ))}
            </div>
          </div>

          {/* Dynamic Sales Trend Chart */}
          <div className="pt-4 border-t border-slate-100">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold text-slate-700">Weekly Revenue Breakdown</span>
              <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">Live</span>
            </div>

            <div className="flex items-end gap-2 h-20 px-1">
              {weeklySalesData.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                  {/* Tooltip */}
                  <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-slate-900 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow pointer-events-none whitespace-nowrap z-10">
                    ₹{d.sales}
                  </div>
                  <div
                    className="w-full bg-emerald-200 group-hover:bg-emerald-600 rounded-t-md transition-all duration-300"
                    style={{ height: `${d.height}%` }}
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-between text-[10px] font-extrabold text-slate-400 mt-2 px-1">
              {weeklySalesData.map((d, i) => (
                <span key={i}>{d.day}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Announcement Broadcast Modal */}
      {showAnnouncementModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2 text-slate-800">
                <Megaphone className="text-amber-500" size={20} />
                <h3 className="font-black text-base">Store Announcement</h3>
              </div>
              <button
                onClick={() => setShowAnnouncementModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveAnnouncement} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Live Banner Message
                </label>
                <textarea
                  value={announcementText}
                  onChange={(e) => setAnnouncementText(e.target.value)}
                  placeholder="e.g. 🌿 Fresh organic fruits harvest arriving daily! Get 15% OFF today."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 min-h-[100px] resize-none"
                  required
                />
              </div>

              {announcementSaved && (
                <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">
                  <CheckCircle2 size={16} /> Announcement broadcasted live!
                </div>
              )}

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem("farmsage_announcement");
                    setAnnouncementText("");
                  }}
                  className="px-3.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition"
                >
                  Clear Banner
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition"
                >
                  Save & Broadcast
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
