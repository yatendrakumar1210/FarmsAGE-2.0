import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { API_BASE_URL as API } from "../../config/api";
import {
  Truck,
  Store,
  MapPin,
  Phone,
  PackageCheck,
  IndianRupee,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";

const DeliveryActiveOrder = () => {
  const [activeOrder, setActiveOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchActiveDelivery = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(`${API}/api/delivery/orders/active`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActiveOrder(data.order);
      } else {
        setActiveOrder(null);
      }
    } catch (err) {
      console.error("Error fetching active delivery:", err);
      setActiveOrder(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveDelivery();
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* ─── Header ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Truck size={22} />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-['Outfit']">Active Delivery</h2>
            <p className="text-xs text-slate-500 font-medium">
              {activeOrder
                ? `Order #${String(activeOrder._id).slice(-6).toUpperCase()} is currently in progress`
                : "No active delivery right now"}
            </p>
          </div>
        </div>

        <button
          onClick={fetchActiveDelivery}
          className="p-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          title="Refresh Status"
        >
          <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* ─── Empty State ────────────────────────────────────────────────── */}
      {!loading && !activeOrder && (
        <div className="text-center py-20 px-4 bg-white rounded-3xl border border-dashed border-slate-200 shadow-xs">
          <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
            <PackageCheck size={32} />
          </div>
          <h3 className="text-xl font-black text-slate-800 font-['Outfit']">No active delivery in progress</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-6 font-medium">
            You don't have an assigned order right now. Visit the available orders feed to accept a new delivery request.
          </p>
          <Link
            to="/delivery/available-orders"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/25 transition active:scale-95"
          >
            <span>Browse Available Orders</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      )}

      {/* ─── Active Delivery Details ────────────────────────────────────── */}
      {activeOrder && (
        <div className="space-y-5">
          {/* Status & Payment Alert Card */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-3xl p-5 sm:p-7 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="inline-block text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-emerald-100 mb-2">
                  Status: {activeOrder.status}
                </span>
                <h3 className="text-2xl sm:text-3xl font-black font-['Outfit']">
                  Order #{String(activeOrder._id).slice(-6).toUpperCase()}
                </h3>
                <p className="text-xs text-emerald-100 mt-1">
                  Accepted on {new Date(activeOrder.updatedAt || activeOrder.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 shrink-0 text-right sm:text-right">
                <span className="text-[10px] uppercase font-bold text-emerald-200 block">Payment Instruction</span>
                <span className="text-base sm:text-lg font-black text-white block">
                  {activeOrder.paymentMethod === "COD" ? "COLLECT CASH" : "DO NOT COLLECT CASH"}
                </span>
                <span className="text-xs font-bold text-emerald-100">
                  {activeOrder.paymentMethod === "COD"
                    ? `Collect ₹${activeOrder.totalAmount} at doorstep`
                    : `Prepaid ₹${activeOrder.totalAmount} Online`}
                </span>
              </div>
            </div>
          </div>

          {/* Operational Route Steps: Pickup -> Drop */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Step 1: PICKUP FROM VENDOR */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-emerald-600 font-extrabold text-xs uppercase tracking-wider">
                    <Store size={18} />
                    <span>1. Pickup From Vendor</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Store Origin
                  </span>
                </div>

                <h4 className="text-lg font-black text-slate-900 font-['Outfit']">
                  {activeOrder.vendorId?.storeName || activeOrder.vendorId?.name || "Organic Farm"}
                </h4>
                <p className="text-xs text-slate-600 mt-1 font-medium">
                  {activeOrder.vendorId?.storeAddress || "Store Pickup Address"}
                </p>
              </div>

              {activeOrder.vendorId?.phone && (
                <a
                  href={`tel:${activeOrder.vendorId.phone}`}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-extrabold transition border border-emerald-200 cursor-pointer"
                >
                  <Phone size={15} />
                  <span>Call Vendor ({activeOrder.vendorId.phone})</span>
                </a>
              )}
            </div>

            {/* Step 2: DROP TO CUSTOMER */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-teal-600 font-extrabold text-xs uppercase tracking-wider">
                    <MapPin size={18} />
                    <span>2. Deliver To Customer</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                    Customer Drop
                  </span>
                </div>

                <h4 className="text-lg font-black text-slate-900 font-['Outfit']">
                  {activeOrder.deliveryAddress?.name || "Customer"}
                </h4>
                <div className="text-xs text-slate-600 mt-1 space-y-0.5 font-medium">
                  {activeOrder.deliveryAddress?.houseNumber && (
                    <p>House/Flat: {activeOrder.deliveryAddress.houseNumber}</p>
                  )}
                  <p>{activeOrder.deliveryAddress?.street}</p>
                  {activeOrder.deliveryAddress?.landmark && (
                    <p className="text-slate-500">Landmark: {activeOrder.deliveryAddress.landmark}</p>
                  )}
                  <p className="font-bold text-slate-800">
                    {activeOrder.deliveryAddress?.city}, {activeOrder.deliveryAddress?.pincode}
                  </p>
                </div>
              </div>

              {activeOrder.deliveryAddress?.phone && (
                <a
                  href={`tel:${activeOrder.deliveryAddress.phone}`}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-extrabold shadow-md shadow-teal-600/20 transition cursor-pointer"
                >
                  <Phone size={15} />
                  <span>Call Customer ({activeOrder.deliveryAddress.phone})</span>
                </a>
              )}
            </div>
          </div>

          {/* Items & Manifest Card */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs space-y-4">
            <h4 className="text-base font-black text-slate-900 font-['Outfit'] flex items-center gap-2">
              <PackageCheck size={18} className="text-emerald-600" />
              <span>Order Items ({(activeOrder.items || []).length})</span>
            </h4>

            <div className="divide-y divide-slate-100">
              {(activeOrder.items || []).map((item, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-extrabold text-slate-800">{item.name}</span>
                    {item.weight && <span className="text-slate-400 ml-1.5 font-medium">({item.weight})</span>}
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-600">Qty: {item.quantity}</span>
                    <span className="ml-3 font-extrabold text-slate-900">₹{item.price * item.quantity}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-black">
              <span className="text-slate-500">Total Order Amount:</span>
              <span className="text-base text-slate-900 font-['Outfit']">₹{activeOrder.totalAmount}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryActiveOrder;
