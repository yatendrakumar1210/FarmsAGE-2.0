import React, { useState, useEffect } from "react";
import axios from "axios";

const API =
  import.meta.env.MODE === "development"
    ? "http://localhost:3000"
    : "https://farmsage-2-0-2.onrender.com";

const formatDateTime = (isoString) => {
  if (!isoString) return "—";
  const d = new Date(isoString);
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const StatusBadge = ({ value, type }) => {
  const colors = {
    // Order status
    Pending: { bg: "#fef3c7", color: "#92400e" },
    Processing: { bg: "#dbeafe", color: "#1e40af" },
    OutForDelivery: { bg: "#ede9fe", color: "#5b21b6" },
    Delivered: { bg: "#d1fae5", color: "#065f46" },
    Cancelled: { bg: "#fee2e2", color: "#991b1b" },
    // Payment status
    Paid: { bg: "#d1fae5", color: "#065f46" },
    Failed: { bg: "#fee2e2", color: "#991b1b" },
  };
  const style = colors[value] || { bg: "#f1f5f9", color: "#475569" };
  return (
    <span
      style={{
        background: style.bg,
        color: style.color,
        padding: "3px 10px",
        borderRadius: "20px",
        fontSize: "0.72rem",
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
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
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API}/api/admin/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(res.data);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${API}/api/admin/orders/${id}`,
        { status },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setOrders((prev) =>
        prev.map((o) => (o._id === id ? { ...o, status } : o)),
      );
    } catch (error) {
      console.error(error);
      alert("Failed to update status");
    }
  };

  if (loading)
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#666" }}>
        Loading orders...
      </div>
    );
  if (orders.length === 0)
    return (
      <div style={{ padding: "60px", textAlign: "center", color: "#94a3b8" }}>
        <div style={{ fontSize: "3rem", marginBottom: "12px" }}>📭</div>
        <p style={{ fontWeight: 600 }}>No orders yet</p>
      </div>
    );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800">
          All Orders ({orders.length})
        </h3>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {orders.map((order) => {
          const isExpanded = expandedOrder === order._id;
          const addr = order.deliveryAddress || {};

          return (
            <div
              key={order._id}
              className="bg-white border rounded-xl shadow-sm overflow-hidden"
            >
              {/* Header Row */}
              <div
                onClick={() => setExpandedOrder(isExpanded ? null : order._id)}
                className="flex flex-col md:flex-row md:items-center gap-3 p-4 cursor-pointer hover:bg-gray-50"
              >
                {/* Row Content Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-3 w-full">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase">Order</p>
                    <p className="font-bold text-sm">
                      #{order._id.slice(-6).toUpperCase()}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] text-gray-400 uppercase">Date</p>
                    <p className="text-sm">{formatDateTime(order.createdAt)}</p>
                  </div>

                  <div>
                    <p className="text-[10px] text-gray-400 uppercase">
                      Customer
                    </p>
                    <p className="text-sm font-medium">
                      {addr.name || order.userId?.name || "Unknown"}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] text-gray-400 uppercase">Vendor</p>
                    <p className="text-sm font-bold text-amber-600">
                      {order.vendorId?.storeName || order.vendorId?.name || "Global"}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] text-gray-400 uppercase">Items</p>
                    <p className="font-bold">{order.items?.length || 0}</p>
                  </div>

                  <div>
                    <p className="text-[10px] text-gray-400 uppercase">Total</p>
                    <p className="font-bold text-green-600">
                      ₹{order.totalAmount}
                    </p>
                  </div>

                  <div>
                    <StatusBadge value={order.status} />
                  </div>
                </div>

                {/* Toggle */}
                <div className="text-xs text-gray-500 font-semibold">
                  {isExpanded ? "▲" : "▼"}
                </div>
              </div>

              {/* Expanded Section */}
              {isExpanded && (
                <div className="p-4 bg-gray-50 grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Items */}
                  <div>
                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">
                      Ordered Items
                    </h4>

                    <div className="space-y-2">
                      {(order.items || []).map((item, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 bg-white p-2 rounded-lg border"
                        >
                          {item.image && (
                            <img
                              src={item.image}
                              className="w-10 h-10 object-cover rounded"
                            />
                          )}

                          <div className="flex-1">
                            <p className="text-sm font-semibold">{item.name}</p>
                            <p className="text-xs text-gray-500">
                              {item.weight} × {item.quantity}
                            </p>
                          </div>

                          <p className="font-bold text-green-600 text-sm">
                            ₹{item.price * item.quantity}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Address + Payment */}
                  <div className="space-y-4">
                    {/* Address */}
                    <div>
                      <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">
                        Delivery Address
                      </h4>

                      <div className="bg-white p-3 rounded-lg border text-sm">
                        <p className="font-semibold">{addr.name}</p>
                        <p>{addr.phone}</p>
                        <p>{addr.street}</p>
                        <p>
                          {addr.city} - {addr.pincode}
                        </p>
                      </div>
                    </div>

                    {/* Payment */}
                    <div>
                      <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">
                        Payment Info
                      </h4>

                      <div className="bg-white p-3 rounded-lg border text-sm space-y-1">
                        <p>
                          Method:{" "}
                          <strong>{order.paymentMethod || "COD"}</strong>
                        </p>
                        <p>
                          Status: <StatusBadge value={order.paymentStatus} />
                        </p>
                        <p>
                          Total:{" "}
                          <strong className="text-green-600">
                            ₹{order.totalAmount}
                          </strong>
                        </p>
                      </div>
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
