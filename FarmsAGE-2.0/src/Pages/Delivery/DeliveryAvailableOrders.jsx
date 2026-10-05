import React, { useState, useEffect } from "react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import { API_BASE_URL as API } from "../../config/api";
import {
  PackageOpen,
  Store,
  MapPin,
  Clock,
  RefreshCw,
  Power,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

const DeliveryAvailableOrders = () => {
  const navigate = useNavigate();
  const { isAvailable, setIsAvailable } = useOutletContext() || {};

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState(null);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  const fetchAvailableOrders = async () => {
    try {
      setLoading(true);
      setFeedback({ type: "", message: "" });
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(`${API}/api/delivery/orders/available`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (res.ok && data.success && Array.isArray(data.orders)) {
        setOrders(data.orders);
      } else if (res.status === 400 && data.isAvailable === false) {
        setOrders([]);
        if (setIsAvailable) setIsAvailable(false);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error("Error fetching available orders:", err);
      setFeedback({ type: "error", message: "Failed to connect to delivery dispatch service." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailableOrders();
  }, [isAvailable]);

  const handleGoOnline = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/api/delivery/availability`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isAvailable: true }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (setIsAvailable) setIsAvailable(true);
        fetchAvailableOrders();
      }
    } catch (e) {
      console.error("Error going online:", e);
    }
  };

  const handleAcceptOrder = async (orderId) => {
    if (acceptingId) return;
    setAcceptingId(orderId);
    setFeedback({ type: "", message: "" });

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/api/delivery/orders/${orderId}/accept`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setFeedback({ type: "success", message: "Order accepted successfully! Opening delivery route..." });
        setTimeout(() => {
          navigate("/delivery/active-delivery");
        }, 800);
      } else if (res.status === 409) {
        setFeedback({
          type: "error",
          message: "Another delivery partner just accepted this order.",
        });
        fetchAvailableOrders();
      } else {
        setFeedback({ type: "error", message: data.message || "Failed to accept order." });
        fetchAvailableOrders();
      }
    } catch (err) {
      setFeedback({ type: "error", message: "Network connection error while accepting order." });
    } finally {
      setAcceptingId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* ─── Page Header ────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <PackageOpen size={22} className="text-emerald-600" />
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-['Outfit']">
              Available Delivery Requests
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            {isAvailable
              ? `Currently showing ${orders.length} eligible orders ready for pickup`
              : "You are offline. Turn on your availability to see orders."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchAvailableOrders}
            className="p-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            title="Refresh Feed"
          >
            <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* ─── Feedback Banner ────────────────────────────────────────────── */}
      {feedback.message && (
        <div
          className={`p-4 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2.5 ${
            feedback.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : "bg-rose-50 border border-rose-200 text-rose-700"
          }`}
        >
          {feedback.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* ─── Offline Guard View ─────────────────────────────────────────── */}
      {!isAvailable && (
        <div className="text-center py-16 px-4 bg-white rounded-3xl border border-dashed border-slate-200 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Power size={26} />
          </div>
          <h3 className="text-lg font-black text-slate-800 font-['Outfit']">You're currently offline</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5 font-medium">
            Switch online to connect with our dispatch system and view nearby orders.
          </p>
          <button
            onClick={handleGoOnline}
            className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/25 transition cursor-pointer"
          >
            Switch Online
          </button>
        </div>
      )}

      {/* ─── Empty Feed View ────────────────────────────────────────────── */}
      {isAvailable && orders.length === 0 && !loading && (
        <div className="text-center py-16 px-4 bg-white rounded-3xl border border-dashed border-slate-200 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <PackageOpen size={26} />
          </div>
          <h3 className="text-lg font-black text-slate-800 font-['Outfit']">No orders available right now</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 font-medium">
            New orders will appear automatically as local vendors pack their produce.
          </p>
        </div>
      )}

      {/* ─── Orders Grid ────────────────────────────────────────────────── */}
      {isAvailable && orders.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {orders.map((order) => (
            <div
              key={order._id}
              className="bg-white rounded-3xl border border-slate-200/90 hover:border-emerald-500/40 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-4"
            >
              <div>
                {/* Order Top Bar */}
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-3">
                  <div>
                    <span className="font-black text-xs text-slate-900 font-['Outfit']">
                      Order #{String(order._id).slice(-6).toUpperCase()}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold block">
                      {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                      order.paymentMethod === "COD"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {order.paymentMethod === "COD" ? "Cash on Delivery" : "Paid Online"}
                  </span>
                </div>

                {/* Pickup & Destination Info */}
                <div className="space-y-3">
                  {/* Pickup from Vendor */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <Store size={16} />
                    </div>
                    <div>
                      <span className="text-[10px] font-extrabold uppercase text-slate-400 block tracking-wider">
                        Pickup Store
                      </span>
                      <h4 className="font-extrabold text-xs text-slate-800">
                        {order.vendor?.storeName || "Farm Store"}
                      </h4>
                      <p className="text-[11px] text-slate-500 line-clamp-1">{order.vendor?.storeAddress}</p>
                    </div>
                  </div>

                  {/* Drop to Destination */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                      <MapPin size={16} />
                    </div>
                    <div>
                      <span className="text-[10px] font-extrabold uppercase text-slate-400 block tracking-wider">
                        Drop Location
                      </span>
                      <h4 className="font-extrabold text-xs text-slate-800">
                        {order.destinationArea?.landmark ? `${order.destinationArea.landmark}, ` : ""}
                        {order.destinationArea?.city}
                      </h4>
                      <p className="text-[11px] text-slate-500">Pincode: {order.destinationArea?.pincode}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Footer & Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block">Order Total</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-sm font-black text-slate-900 font-['Outfit']">₹{order.totalAmount}</span>
                    <span className="text-[10px] text-slate-400">({order.totalQuantity} items)</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    to={`/delivery/orders/${order._id}`}
                    className="px-3.5 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition"
                  >
                    Details
                  </Link>
                  <button
                    onClick={() => handleAcceptOrder(order._id)}
                    disabled={acceptingId === order._id}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-md shadow-emerald-600/25 transition cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    {acceptingId === order._id ? "Claiming..." : "Accept Order"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DeliveryAvailableOrders;
