import React, { useState, useEffect } from "react";
import { API_BASE_URL as API } from "../../config/api";
import {
  History,
  CheckCircle2,
  Calendar,
  Store,
  MapPin,
  IndianRupee,
  RefreshCw,
  Package,
} from "lucide-react";

const DeliveryHistory = () => {
  const [historyOrders, setHistoryOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(`${API}/api/delivery/orders/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.orders)) {
        setHistoryOrders(data.orders);
      } else {
        setHistoryOrders([]);
      }
    } catch (err) {
      console.error("Error fetching delivery history:", err);
      setHistoryOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* ─── Header ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <History size={22} />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-['Outfit']">Delivery History</h2>
            <p className="text-xs text-slate-500 font-medium">
              Completed deliveries log ({historyOrders.length} total)
            </p>
          </div>
        </div>

        <button
          onClick={fetchHistory}
          className="p-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          title="Refresh Log"
        >
          <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* ─── Empty History State ────────────────────────────────────────── */}
      {!loading && historyOrders.length === 0 && (
        <div className="text-center py-20 px-4 bg-white rounded-3xl border border-dashed border-slate-200 shadow-xs">
          <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} />
          </div>
          <h3 className="text-xl font-black text-slate-800 font-['Outfit']">No deliveries completed yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 font-medium">
            When you complete active orders, your delivery history and receipts will be archived here.
          </p>
        </div>
      )}

      {/* ─── History Feed ───────────────────────────────────────────────── */}
      {historyOrders.length > 0 && (
        <div className="space-y-3">
          {historyOrders.map((item) => (
            <div
              key={item._id}
              className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-300 transition"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-black text-xs sm:text-sm text-slate-900 font-['Outfit']">
                    Order #{String(item._id).slice(-6).toUpperCase()}
                  </span>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Delivered
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                  <span className="flex items-center gap-1 font-medium">
                    <Store size={13} className="text-slate-400" />
                    <span className="font-bold text-slate-700">{item.vendorName}</span>
                  </span>
                  <span className="flex items-center gap-1 font-medium">
                    <MapPin size={13} className="text-slate-400" />
                    <span>{item.deliveryCity} ({item.deliveryPincode})</span>
                  </span>
                  <span className="flex items-center gap-1 font-medium text-slate-400">
                    <Calendar size={13} />
                    <span>{new Date(item.date).toLocaleDateString()} {new Date(item.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  </span>
                </div>
              </div>

              <div className="pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 flex items-center justify-between sm:justify-end gap-5">
                <div className="text-left sm:text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Total</span>
                  <span className="text-sm font-black text-slate-900 font-['Outfit']">₹{item.totalAmount}</span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-emerald-600 block">Rate</span>
                  <span className="text-xs font-extrabold text-slate-700 font-['Outfit']">₹8 / km</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DeliveryHistory;
