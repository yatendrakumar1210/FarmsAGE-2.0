import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { API_BASE_URL as API } from "../../config/api";
import {
  PackageOpen,
  Store,
  MapPin,
  Phone,
  ArrowLeft,
  Truck,
  IndianRupee,
  Clock,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

const DeliveryOrderDetail = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [isAssignedToMe, setIsAssignedToMe] = useState(false);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(`${API}/api/delivery/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (res.ok && data.success && data.order) {
        setOrder(data.order);
        setIsAssignedToMe(Boolean(data.isAssignedToMe));
      } else {
        setErrorMsg(data.message || "Unable to load order details.");
      }
    } catch (err) {
      console.error("Order detail fetch error:", err);
      setErrorMsg("Network error connecting to delivery service.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetail();
  }, [orderId]);

  const handleAcceptThisOrder = async () => {
    if (accepting) return;
    setAccepting(true);
    setErrorMsg("");

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/api/delivery/orders/${orderId}/accept`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (res.ok && data.success) {
        navigate("/delivery/active-delivery");
      } else if (res.status === 409) {
        setErrorMsg("This order was just accepted by another delivery partner.");
      } else {
        setErrorMsg(data.message || "Failed to accept order.");
      }
    } catch (err) {
      setErrorMsg("Network error while accepting order.");
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center text-slate-400 font-bold text-sm">
        Loading order information...
      </div>
    );
  }

  if (errorMsg && !order) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle size={24} />
        </div>
        <h3 className="text-lg font-black text-slate-800 font-['Outfit']">Notice</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">{errorMsg}</p>
        <Link
          to="/delivery/available-orders"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold transition hover:bg-slate-800"
        >
          <ArrowLeft size={14} />
          <span>Back to Available Orders</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to={isAssignedToMe ? "/delivery/active-delivery" : "/delivery/available-orders"}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft size={16} />
          <span>{isAssignedToMe ? "Back to Active Delivery" : "Back to Available Orders"}</span>
        </Link>
        <span
          className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
            isAssignedToMe ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
          }`}
        >
          {isAssignedToMe ? "Assigned to You" : "Available for Acceptance"}
        </span>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Order Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Order ID</span>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 font-['Outfit']">
              #{String(order._id).slice(-6).toUpperCase()}
            </h3>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400">Total Amount</span>
            <p className="text-lg font-black text-slate-900 font-['Outfit']">₹{order.totalAmount}</p>
          </div>
        </div>

        {/* Pickup Info */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/70 space-y-2">
          <div className="flex items-center gap-2 text-emerald-700 font-extrabold text-xs uppercase tracking-wider">
            <Store size={16} />
            <span>Store Pickup Origin</span>
          </div>
          <h4 className="font-black text-sm text-slate-900">
            {order.vendor?.storeName || order.vendor?.name || "Farm Store"}
          </h4>
          <p className="text-xs text-slate-600">{order.vendor?.storeAddress}</p>
          {isAssignedToMe && order.vendor?.phone && (
            <a
              href={`tel:${order.vendor.phone}`}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:underline pt-1"
            >
              <Phone size={13} />
              <span>Call Store ({order.vendor.phone})</span>
            </a>
          )}
        </div>

        {/* Drop Info */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/70 space-y-2">
          <div className="flex items-center gap-2 text-teal-700 font-extrabold text-xs uppercase tracking-wider">
            <MapPin size={16} />
            <span>Destination Drop</span>
          </div>

          {isAssignedToMe ? (
            // Full details for assigned partner
            <div>
              <h4 className="font-black text-sm text-slate-900">
                {order.deliveryAddress?.name || "Customer"}
              </h4>
              <div className="text-xs text-slate-600 mt-1 space-y-0.5">
                {order.deliveryAddress?.houseNumber && <p>Flat/House: {order.deliveryAddress.houseNumber}</p>}
                <p>{order.deliveryAddress?.street}</p>
                {order.deliveryAddress?.landmark && <p>Landmark: {order.deliveryAddress.landmark}</p>}
                <p className="font-bold text-slate-800">
                  {order.deliveryAddress?.city}, {order.deliveryAddress?.pincode}
                </p>
              </div>
              {order.deliveryAddress?.phone && (
                <a
                  href={`tel:${order.deliveryAddress.phone}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 hover:underline pt-2"
                >
                  <Phone size={13} />
                  <span>Call Customer ({order.deliveryAddress.phone})</span>
                </a>
              )}
            </div>
          ) : (
            // Safe privacy preview for unaccepted order
            <div>
              <h4 className="font-extrabold text-xs text-slate-800">
                {order.destinationArea?.landmark ? `${order.destinationArea.landmark}, ` : ""}
                {order.destinationArea?.city}
              </h4>
              <p className="text-xs text-slate-500">Pincode: {order.destinationArea?.pincode}</p>
              <p className="text-[11px] text-slate-400 italic mt-1">
                Full customer name, street, and phone will unlock upon order acceptance.
              </p>
            </div>
          )}
        </div>

        {/* Order Items Preview */}
        <div className="space-y-2 pt-2">
          <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider">
            Manifest ({order.items?.length || order.itemCount || 0} items)
          </h4>
          <div className="divide-y divide-slate-100">
            {(order.items || []).map((item, idx) => (
              <div key={idx} className="py-2 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">
                  {item.name} {item.weight ? `(${item.weight})` : ""}
                </span>
                <span className="font-extrabold text-slate-900">Qty: {item.quantity}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA for Unassigned Order */}
        {!isAssignedToMe && (
          <div className="pt-4 border-t border-slate-100">
            <button
              onClick={handleAcceptThisOrder}
              disabled={accepting}
              className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-xl shadow-emerald-600/30 transition cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {accepting ? "Claiming Order..." : "Accept This Delivery Order"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliveryOrderDetail;
