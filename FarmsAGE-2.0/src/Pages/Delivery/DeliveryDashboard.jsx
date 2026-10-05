import React, { useState, useEffect } from "react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import { API_BASE_URL as API } from "../../config/api";
import {
  Truck,
  PackageOpen,
  CheckCircle2,
  Clock,
  IndianRupee,
  ArrowRight,
  Power,
  RefreshCw,
  Store,
  MapPin,
  Calendar,
  AlertCircle,
  Sparkles,
} from "lucide-react";

const DeliveryDashboard = () => {
  const navigate = useNavigate();
  const { isAvailable, setIsAvailable, partnerStatus } = useOutletContext() || {};

  const [stats, setStats] = useState({
    todayDeliveries: 0,
    todayEarnings: 0,
    activeDeliveries: 0,
    completedToday: 0,
    totalCompleted: 0,
    availableOrdersCount: 0,
    partnerName: "",
  });
  const [activeOrder, setActiveOrder] = useState(null);
  const [availableOrders, setAvailableOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState({ type: "", text: "" });

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) return;

      // 1. Fetch dashboard stats
      const dashRes = await fetch(`${API}/api/delivery/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const dashData = await dashRes.json();
      if (dashData.success && dashData.stats) {
        setStats(dashData.stats);
        setActiveOrder(dashData.activeOrder);
        if (setIsAvailable && typeof dashData.stats.isAvailable === "boolean") {
          setIsAvailable(dashData.stats.isAvailable);
        }
      }

      // 2. Fetch available orders feed if online
      if (dashData.stats?.isAvailable) {
        const feedRes = await fetch(`${API}/api/delivery/orders/available`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const feedData = await feedRes.json();
        if (feedData.success && Array.isArray(feedData.orders)) {
          setAvailableOrders(feedData.orders);
        } else {
          setAvailableOrders([]);
        }
      } else {
        setAvailableOrders([]);
      }
    } catch (err) {
      console.error("Dashboard data fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [isAvailable]);

  const handleToggleOnline = async () => {
    try {
      const token = localStorage.getItem("token");
      const nextState = !isAvailable;
      const res = await fetch(`${API}/api/delivery/availability`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isAvailable: nextState }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (setIsAvailable) setIsAvailable(data.isAvailable);
        fetchDashboardData();
      } else {
        setFeedbackMsg({ type: "error", text: data.message || "Failed to update availability" });
      }
    } catch (e) {
      setFeedbackMsg({ type: "error", text: "Network error toggling status" });
    }
  };

  const handleAcceptOrder = async (orderId) => {
    if (acceptingId) return;
    setAcceptingId(orderId);
    setFeedbackMsg({ type: "", text: "" });

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/api/delivery/orders/${orderId}/accept`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setFeedbackMsg({ type: "success", text: "Order accepted! Redirecting to active delivery..." });
        setTimeout(() => {
          navigate("/delivery/active-delivery");
        }, 800);
      } else if (res.status === 409) {
        setFeedbackMsg({
          type: "error",
          text: "Another delivery partner just accepted this order.",
        });
        fetchDashboardData();
      } else {
        setFeedbackMsg({ type: "error", text: data.message || "Failed to accept order." });
        fetchDashboardData();
      }
    } catch (err) {
      setFeedbackMsg({ type: "error", text: "Network error while accepting order." });
    } finally {
      setAcceptingId(null);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* ─── Hero Header & Status Banner ────────────────────────────────── */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-black uppercase tracking-wider mb-2">
            <Sparkles size={13} className="text-emerald-500" />
            <span>FarmsAGE Rider Central</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-['Outfit'] tracking-tight">
            {getGreeting()}, {stats.partnerName || "Rider"}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            {isAvailable
              ? "You're online and receiving available delivery requests."
              : "You're currently offline. Switch online to view and accept requests."}
          </p>
        </div>

        {/* Big Online/Offline Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleOnline}
            className={`flex-1 sm:flex-none px-6 py-3.5 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all shadow-md cursor-pointer active:scale-95 ${
              isAvailable
                ? "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 shadow-rose-500/10"
                : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-emerald-600/30"
            }`}
          >
            <Power size={18} />
            <span>{isAvailable ? "GO OFFLINE" : "GO ONLINE"}</span>
          </button>
          <button
            onClick={fetchDashboardData}
            className="p-3.5 rounded-2xl border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* ─── Feedback Alert (if any) ────────────────────────────────────── */}
      {feedbackMsg.text && (
        <div
          className={`p-4 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2.5 ${
            feedbackMsg.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : "bg-rose-50 border border-rose-200 text-rose-700"
          }`}
        >
          {feedbackMsg.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* ─── 4 Authoritative Statistics Cards ───────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1 */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              Today's Deliveries
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Truck size={17} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 font-['Outfit']">
            {stats.todayDeliveries}
          </p>
          <p className="text-[10px] text-slate-400 font-semibold mt-1">Completed today</p>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              Today's Earnings
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <IndianRupee size={17} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 font-['Outfit']">
            ₹{Number(stats.todayEarnings || 0).toFixed(2)}
          </p>
          <p className="text-[10px] text-amber-700 font-bold mt-1">₹8/km distance rate</p>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              Active Delivery
            </span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Clock size={17} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 font-['Outfit']">
            {stats.activeDeliveries}
          </p>
          <p className="text-[10px] text-slate-400 font-semibold mt-1">In progress right now</p>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              Completed Total
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <CheckCircle2 size={17} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 font-['Outfit']">
            {stats.totalCompleted}
          </p>
          <p className="text-[10px] text-slate-400 font-semibold mt-1">All-time finished deliveries</p>
        </div>
      </div>

      {/* ─── Active Delivery Banner (If in progress) ────────────────────── */}
      {activeOrder && (
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-3xl p-5 sm:p-6 shadow-xl shadow-emerald-700/20">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-[11px] font-black uppercase tracking-wider mb-2">
                <Truck size={13} />
                <span>Active Delivery in Progress</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black font-['Outfit']">
                Order #{String(activeOrder._id).slice(-6).toUpperCase()}
              </h3>
              <p className="text-xs text-emerald-100 mt-1 font-medium">
                Pickup: <span className="font-bold text-white">{activeOrder.vendorId?.storeName || "Farm Vendor"}</span> &rarr; Drop: <span className="font-bold text-white">{activeOrder.deliveryAddress?.city || "Customer"}</span>
              </p>
            </div>
            <Link
              to="/delivery/active-delivery"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white text-emerald-800 font-black text-xs shadow-md hover:bg-emerald-50 transition active:scale-95 shrink-0"
            >
              <span>View Active Delivery</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      )}

      {/* ─── Available Orders Section ───────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-7 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <PackageOpen size={22} className="text-emerald-600" />
            <div>
              <h3 className="text-lg font-black text-slate-900 font-['Outfit']">Available Orders</h3>
              <p className="text-xs text-slate-500 font-medium">
                {isAvailable
                  ? `${availableOrders.length} orders ready for delivery pickup`
                  : "Go online to see live orders"}
              </p>
            </div>
          </div>
          {isAvailable && (
            <Link
              to="/delivery/available-orders"
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              <span>See All</span>
              <ArrowRight size={14} />
            </Link>
          )}
        </div>

        {/* Offline Banner State */}
        {!isAvailable && (
          <div className="text-center py-10 px-4 bg-slate-50/80 rounded-2xl border border-dashed border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-slate-200 text-slate-500 flex items-center justify-center mx-auto mb-3">
              <Power size={24} />
            </div>
            <h4 className="text-base font-extrabold text-slate-800 font-['Outfit']">You're currently offline</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4 font-medium">
              Go online to receive real-time delivery requests from local farms & vendors.
            </p>
            <button
              onClick={handleToggleOnline}
              className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/30 transition cursor-pointer"
            >
              Go Online Now
            </button>
          </div>
        )}

        {/* Online with 0 Orders State */}
        {isAvailable && availableOrders.length === 0 && !loading && (
          <div className="text-center py-10 px-4 bg-slate-50/80 rounded-2xl border border-dashed border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <PackageOpen size={24} />
            </div>
            <h4 className="text-base font-extrabold text-slate-800 font-['Outfit']">No orders available right now</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 font-medium">
              We'll display incoming vendor orders right here as soon as they are placed and packed.
            </p>
          </div>
        )}

        {/* Online Available Orders List */}
        {isAvailable && availableOrders.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {availableOrders.slice(0, 4).map((order) => (
              <div
                key={order._id}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-emerald-500/40 transition-all flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-extrabold text-xs text-slate-800">
                      Order #{String(order._id).slice(-6).toUpperCase()}
                    </span>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                      {order.paymentMethod === "COD" ? "Cash on Delivery" : "Paid Online"}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-start gap-2">
                      <Store size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                      <div className="truncate">
                        <span className="font-bold text-slate-800">{order.vendor?.storeName || "Farm Vendor"}</span>
                        <p className="text-[11px] text-slate-500 truncate">{order.vendor?.storeAddress}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <MapPin size={14} className="text-teal-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-slate-800">
                          {order.destinationArea?.landmark ? `${order.destinationArea.landmark}, ` : ""}
                          {order.destinationArea?.city} ({order.destinationArea?.pincode})
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-2">
                  <div className="text-xs">
                    <span className="text-slate-400 font-semibold">{order.itemCount} items &bull; </span>
                    <span className="font-black text-slate-900">₹{order.totalAmount}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      to={`/delivery/orders/${order._id}`}
                      className="px-3 py-1.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-200 text-xs font-bold transition"
                    >
                      Details
                    </Link>
                    <button
                      onClick={() => handleAcceptOrder(order._id)}
                      disabled={acceptingId === order._id}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md shadow-emerald-600/20 transition cursor-pointer active:scale-95 disabled:opacity-50"
                    >
                      {acceptingId === order._id ? "Accepting..." : "Accept"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliveryDashboard;
