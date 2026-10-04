import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, ArrowLeft, Trash2, Plus, Minus, Truck, ShieldCheck, Ticket } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { calculateNewUnitPrice } from "../utils/weightUtils";
import { API_BASE_URL as API } from "../config/api";

const Cart = () => {
  const {
    cart,
    removeFromCart,
    updateQuantity,
    updateItemWeight,
    appliedCoupon,
    applyCouponData,
    removeCoupon,
  } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponMsg, setCouponMsg] = useState({ text: "", type: "" });

  const handleCheckout = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate('/checkout');
  };

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const deliveryCharge = subtotal > 500 || subtotal === 0 ? 0 : 40;
  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const total = Math.max(0, subtotal - discountAmount + deliveryCharge);
  const freeDeliveryThreshold = 500;
  const progressToFree = Math.min((subtotal / freeDeliveryThreshold) * 100, 100);

  // If subtotal drops below coupon minimum order amount, auto-remove coupon
  useEffect(() => {
    if (appliedCoupon && appliedCoupon.minOrderAmount && subtotal < appliedCoupon.minOrderAmount) {
      removeCoupon();
      setCouponMsg({
        text: `Coupon '${appliedCoupon.code}' removed (Minimum order ₹${appliedCoupon.minOrderAmount} required)`,
        type: "error",
      });
    }
  }, [subtotal, appliedCoupon]);

  const handleApplyCoupon = async (e) => {
    if (e) e.preventDefault();
    if (!couponCodeInput.trim()) {
      setCouponMsg({ text: "Please enter a coupon code", type: "error" });
      return;
    }

    setCouponLoading(true);
    setCouponMsg({ text: "", type: "" });

    try {
      const res = await fetch(`${API}/api/orders/validate-coupon`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: couponCodeInput.trim(),
          items: cart.map(item => ({
            productId: String(item._id || item.id),
            price: Number(item.price),
            quantity: item.quantity,
          })),
          subtotal,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setCouponMsg({ text: data.message || "Invalid coupon", type: "error" });
        return;
      }

      applyCouponData({
        code: data.code,
        discountType: data.discountType,
        discountValue: data.discountValue,
        discountAmount: data.discountAmount,
        minOrderAmount: data.minOrderAmount,
      });

      setCouponMsg({
        text: `Coupon '${data.code}' applied! Saved ₹${data.discountAmount}`,
        type: "success",
      });
      setCouponCodeInput("");
    } catch (err) {
      setCouponMsg({ text: "Failed to validate coupon. Please try again.", type: "error" });
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
    setCouponMsg({ text: "Coupon removed", type: "" });
  };

  if (cart.length === 0) {
    return (
      <>
        <Navbar />
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }}
            className="w-48 h-48 sm:w-64 sm:h-64 bg-emerald-50 rounded-full flex items-center justify-center mb-8"
          >
            <ShoppingBag size={80} className="text-emerald-500" />
          </motion.div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-800 mb-2">Your cart is lonely!</h1>
          <p className="text-slate-500 max-w-xs mb-8">Add some fresh organic produce to your cart and start your healthy journey.</p>
          <Link to="/category/all">
            <button className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-bold shadow-xl shadow-emerald-100 flex items-center gap-2 hover:bg-emerald-700 transition-all">
              <ShoppingBag size={20} />
              Start Shopping
            </button>
          </Link>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="bg-[#F8FAFC] min-h-screen pt-4 sm:pt-8 pb-40 sm:pb-20">
        <div className="max-w-7xl mx-auto px-3 sm:px-6">
          <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-10">
            <Link to="/home" className="p-2 hover:bg-white rounded-xl transition-colors border border-transparent hover:border-slate-200 shrink-0">
              <ArrowLeft size={20} className="sm:w-6 sm:h-6" />
            </Link>
            <h1 className="text-xl sm:text-3xl font-black text-slate-800 truncate">
              My Shopping Cart <span className="text-emerald-600">({cart.reduce((a, i) => a + i.quantity, 0)})</span>
            </h1>
          </div>

          <div className="grid lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-12 items-start">
            {/* 1. Left: Product List */}
            <div className="lg:col-span-2 space-y-3 sm:space-y-4">
              {/* Free Delivery Progress */}
              <div className="bg-white p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm mb-4 sm:mb-6">
                <div className="flex justify-between items-center gap-2 mb-2.5 sm:mb-3">
                  <span className="text-xs sm:text-sm font-bold text-slate-700 flex items-center gap-1.5 sm:gap-2 min-w-0">
                    <Truck size={16} className="text-emerald-500 shrink-0 sm:w-[18px] sm:h-[18px]" />
                    <span className="truncate">
                      {subtotal >= 500 ? "Congrats! Free Delivery applied" : `Add ₹${500 - subtotal} more for Free Delivery`}
                    </span>
                  </span>
                  <span className="text-xs font-black text-emerald-600 shrink-0">{Math.round(progressToFree)}%</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }} 
                    animate={{ width: `${progressToFree}%` }} 
                    className="h-full bg-emerald-500 rounded-full" 
                  />
                </div>
              </div>

              <AnimatePresence>
                {cart.map((item) => {
                  const itemId = item._id || item.id;
                  return (
                    <motion.div 
                      key={`${itemId}-${item.weight}`}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="bg-white p-3 sm:p-5 rounded-2xl sm:rounded-3xl border border-gray-100 flex items-center gap-2.5 sm:gap-6 shadow-sm hover:shadow-md transition-shadow min-w-0"
                    >
                      <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gray-50 rounded-xl sm:rounded-2xl p-1 sm:p-2 shrink-0 overflow-hidden">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-lg sm:rounded-xl" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1.5">
                          <h3 className="font-bold text-slate-800 text-xs sm:text-base leading-snug line-clamp-1 sm:truncate flex-1 min-w-0">{item.name}</h3>
                          {/* Mobile trash button (inline with title) */}
                          <button
                            onClick={() => removeFromCart(itemId, item.weight)}
                            className="sm:hidden p-1 -mr-1 -mt-0.5 text-slate-400 hover:text-rose-500 transition-colors shrink-0"
                            title="Remove item"
                            aria-label="Remove item"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        <div className="mt-1 flex items-center">
                          <select
                            value={item.weight}
                            onChange={(e) => {
                              const newWeight = e.target.value;
                              const { newUnitPrice } = calculateNewUnitPrice(item, newWeight);
                              updateItemWeight(itemId, item.weight, newWeight, newUnitPrice);
                            }}
                            className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-[9px] sm:text-[10px] font-black uppercase tracking-wider rounded-md sm:rounded-lg hover:border-emerald-400 transition-colors block px-1.5 sm:px-2 py-0.5 sm:py-1 cursor-pointer outline-none max-w-[130px] truncate"
                          >
                            {["1 kg", "500 g", "250 g", "1 pack", "2 packs", "1 Piece", "2 Pieces", "1 Box", "12 pcs", "6 pcs"]
                              .filter((opt) => {
                                if (item.weight === opt) return true;
                                const w = (item.weight || "").toLowerCase();
                                if (w.includes("kg") || w.includes("g")) return opt.includes("kg") || opt.includes("g");
                                if (w.includes("pack")) return opt.includes("pack");
                                if (w.includes("piece")) return opt.includes("Piece");
                                if (w.includes("box")) return opt.includes("Box");
                                if (w.includes("pcs")) return opt.includes("pcs");
                                return true;
                              })
                              .map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                          </select>
                        </div>

                        <div className="flex items-center justify-between mt-2 sm:mt-3 gap-2 flex-wrap sm:flex-nowrap">
                          <div className="min-w-0">
                            <p className="font-black text-emerald-600 text-sm sm:text-lg whitespace-nowrap">₹{item.price * item.quantity}</p>
                            {item.quantity > 1 && (
                              <p className="text-[9px] sm:text-[10px] text-slate-400 font-medium whitespace-nowrap">₹{item.price} × {item.quantity}</p>
                            )}
                          </div>
                          
                          {/* Qty Controls */}
                          <div className="flex items-center gap-1.5 sm:gap-3 bg-gray-50 p-0.5 sm:p-1 rounded-xl border border-gray-100 shrink-0">
                            <button 
                              onClick={() => {
                                if (item.quantity <= 1) {
                                  removeFromCart(itemId, item.weight);
                                } else {
                                  updateQuantity(itemId, item.weight, -1);
                                }
                              }}
                              className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center hover:bg-white rounded-lg transition-colors text-slate-500"
                              aria-label="Decrease quantity"
                            >
                              <Minus size={14} className="sm:w-4 sm:h-4" />
                            </button>
                            <span className="font-bold text-xs sm:text-sm min-w-[18px] sm:min-w-[20px] text-center">{item.quantity}</span>
                            <button 
                              onClick={() => updateQuantity(itemId, item.weight, 1)}
                              className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center hover:bg-white rounded-lg transition-colors text-emerald-600"
                              aria-label="Increase quantity"
                            >
                              <Plus size={14} className="sm:w-4 sm:h-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Desktop trash button (right column) */}
                      <button 
                        onClick={() => removeFromCart(itemId, item.weight)}
                        className="hidden sm:block p-2 sm:p-3 text-slate-300 hover:text-rose-500 transition-colors shrink-0"
                        title="Remove item"
                        aria-label="Remove item"
                      >
                        <Trash2 size={18} />
                      </button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* 2. Right: Bill Summary */}
            <div className="space-y-4 sm:space-y-6">
              <div className="bg-white p-4 sm:p-8 rounded-3xl sm:rounded-[2.5rem] border border-gray-100 shadow-xl shadow-emerald-100/20">
                <h3 className="text-lg sm:text-xl font-black text-slate-800 mb-4 sm:mb-6">Order Summary</h3>
                
                <div className="space-y-3 sm:space-y-4 border-b border-gray-100 pb-4 sm:pb-6 text-sm">
                  <div className="flex justify-between text-slate-500 font-medium">
                    <span className="truncate">Subtotal ({cart.reduce((a, i) => a + i.quantity, 0)} items)</span>
                    <span className="font-bold text-slate-700 shrink-0">₹{subtotal}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 font-medium">
                    <span>Delivery Charge</span>
                    <span className={`font-bold ${deliveryCharge === 0 ? "text-emerald-500" : "text-slate-700"}`}>
                      {deliveryCharge === 0 ? "FREE" : `₹${deliveryCharge}`}
                    </span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-bold">
                      <span className="flex items-center gap-1">
                        <span>Discount ({appliedCoupon?.code})</span>
                      </span>
                      <span>- ₹{discountAmount}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center py-4 sm:py-6">
                  <span className="text-base sm:text-lg font-bold text-slate-800">Total Amount</span>
                  <span className="text-xl sm:text-2xl font-black text-emerald-600">₹{total}</span>
                </div>

                <button 
                  onClick={handleCheckout}
                  className="w-full bg-slate-900 text-white py-3.5 sm:py-5 rounded-xl sm:rounded-2xl font-black text-base sm:text-lg shadow-xl shadow-slate-200 hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-2 sm:gap-3"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowLeft size={18} className="rotate-180 sm:w-5 sm:h-5" />
                </button>

                <div className="mt-4 sm:mt-6">
                  {appliedCoupon ? (
                    <div className="p-3 sm:p-4 bg-emerald-50 rounded-xl sm:rounded-2xl border border-emerald-200 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Ticket size={18} className="text-emerald-600 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-black text-emerald-800 uppercase tracking-wide truncate">
                            {appliedCoupon.code} Applied
                          </p>
                          <p className="text-[10px] text-emerald-600 font-semibold">
                            Saved ₹{appliedCoupon.discountAmount}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleRemoveCoupon}
                        className="text-rose-500 hover:text-rose-600 text-xs font-black uppercase shrink-0 transition-colors p-1"
                        title="Remove coupon"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <form
                      onSubmit={handleApplyCoupon}
                      className="p-3 sm:p-4 bg-emerald-50 rounded-xl sm:rounded-2xl border border-emerald-100 flex items-center gap-2 sm:gap-3"
                    >
                      <Ticket size={18} className="text-emerald-600 shrink-0 sm:w-5 sm:h-5" />
                      <input
                        type="text"
                        value={couponCodeInput}
                        onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                        placeholder="Apply Coupon"
                        className="bg-transparent outline-none text-xs sm:text-sm font-bold uppercase placeholder:normal-case placeholder:text-emerald-600/50 flex-1 min-w-0"
                      />
                      <button
                        type="submit"
                        disabled={couponLoading || !couponCodeInput.trim()}
                        className="text-emerald-600 font-black text-xs uppercase shrink-0 hover:text-emerald-700 transition-colors disabled:opacity-50"
                      >
                        {couponLoading ? "Checking..." : "Apply"}
                      </button>
                    </form>
                  )}

                  {couponMsg.text && (
                    <p
                      className={`text-xs mt-2 font-bold px-2 ${
                        couponMsg.type === "success" ? "text-emerald-600" : "text-rose-500"
                      }`}
                    >
                      {couponMsg.text}
                    </p>
                  )}
                </div>
              </div>

              {/* Safety Badges */}
              <div className="flex items-center gap-3 sm:gap-4 px-2 sm:px-4 text-slate-400">
                <ShieldCheck size={20} className="shrink-0 text-emerald-500" />
                <p className="text-[10px] font-bold uppercase tracking-widest leading-tight">Secure SSL Encrypted Payment</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Mobile Sticky Checkout Bar (Blinkit Style, sitting right above MobileBottomNav) */}
      <div className="md:hidden fixed bottom-14 left-0 right-0 z-[105] bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] px-3 py-2.5 flex items-center justify-between gap-3">
        <div className="pl-1 leading-tight shrink-0">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Grand Total</p>
          <p className="text-base sm:text-lg font-black text-slate-950">₹{total}</p>
        </div>
        <button
          onClick={handleCheckout}
          className="flex-1 max-w-[220px] py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-600/20 active:scale-95 transition-all flex items-center justify-center gap-1.5"
        >
          <span className="truncate">Proceed to Checkout</span>
          <ArrowLeft size={15} className="rotate-180 shrink-0" />
        </button>
      </div>

      <Footer />
    </>
  );
};

export default Cart;

