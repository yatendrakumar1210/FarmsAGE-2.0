import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, ArrowLeft, Trash2, Plus, Minus, Truck, ShieldCheck, Ticket } from "lucide-react";
import { Link } from "react-router-dom";

const Cart = () => {
  // Temporary state for UI demonstration (In real app, use Context/Redux)
  const [cartItems, setCartItems] = useState([
    { id: 1, name: "Organic Alphonso Mangoes", price: 499, weight: "1 kg", qty: 1, image: "/images/fruits.png" },
    { id: 2, name: "Fresh Farm Spinach", price: 40, weight: "250 g", qty: 2, image: "/images/vegetables.png" }
  ]);

  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.qty), 0);
  const deliveryCharge = subtotal > 500 ? 0 : 40;
  const total = subtotal + deliveryCharge;
  const freeDeliveryThreshold = 500;
  const progressToFree = Math.min((subtotal / freeDeliveryThreshold) * 100, 100);

  if (cartItems.length === 0) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }}
          className="w-64 h-64 bg-emerald-50 rounded-full flex items-center justify-center mb-8"
        >
          <ShoppingBag size={80} className="text-emerald-500" />
        </motion.div>
        <h1 className="text-3xl font-black text-slate-800 mb-2">Your cart is lonely!</h1>
        <p className="text-slate-500 max-w-xs mb-8">Add some fresh organic produce to your cart and start your healthy journey.</p>
        <Link to="/home">
          <button className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-bold shadow-xl shadow-emerald-100 flex items-center gap-2 hover:bg-emerald-700 transition-all">
            <ArrowLeft size={20} />
            Back to Shopping
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-[#F8FAFC] min-h-screen pt-28 pb-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center gap-4 mb-10">
          <Link to="/home" className="p-2 hover:bg-white rounded-xl transition-colors border border-transparent hover:border-slate-200">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-3xl font-black text-slate-800">My Shopping Cart <span className="text-emerald-600">({cartItems.length})</span></h1>
        </div>

        <div className="grid lg:grid-cols-3 gap-12 items-start">
          {/* 1. Left: Product List */}
          <div className="lg:col-span-2 space-y-4">
            {/* Free Delivery Progress */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm mb-6">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <Truck size={18} className="text-emerald-500" />
                  {subtotal >= 500 ? "Congrats! Free Delivery applied" : `Add ₹${500 - subtotal} more for Free Delivery`}
                </span>
                <span className="text-xs font-black text-emerald-600">{Math.round(progressToFree)}%</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }} 
                  animate={{ width: `${progressToFree}%` }} 
                  className="h-full bg-emerald-500" 
                />
              </div>
            </div>

            {cartItems.map((item) => (
              <motion.div 
                key={item.id}
                layout
                className="bg-white p-4 rounded-3xl border border-gray-100 flex items-center gap-4 sm:gap-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-50 rounded-2xl p-2 shrink-0">
                  <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                </div>
                
                <div className="flex-1">
                  <h3 className="font-bold text-slate-800 text-sm sm:text-base leading-tight">{item.name}</h3>
                  <p className="text-xs text-slate-400 mt-1 font-medium">{item.weight}</p>
                  <div className="flex items-center justify-between mt-3">
                    <p className="font-black text-emerald-600 text-lg">₹{item.price}</p>
                    
                    {/* Qty Controls */}
                    <div className="flex items-center gap-3 bg-gray-50 p-1 rounded-xl border border-gray-100">
                      <button className="p-1 hover:bg-white rounded-lg transition-colors text-slate-500"><Minus size={16} /></button>
                      <span className="font-bold text-sm min-w-[20px] text-center">{item.qty}</span>
                      <button className="p-1 hover:bg-white rounded-lg transition-colors text-emerald-600"><Plus size={16} /></button>
                    </div>
                  </div>
                </div>

                <button className="p-3 text-slate-300 hover:text-rose-500 transition-colors">
                  <Trash2 size={20} />
                </button>
              </motion.div>
            ))}
          </div>

          {/* 2. Right: Bill Summary */}
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-emerald-100/20">
              <h3 className="text-xl font-black text-slate-800 mb-6">Order Summary</h3>
              
              <div className="space-y-4 border-b border-gray-50 pb-6">
                <div className="flex justify-between text-slate-500 font-medium">
                  <span>Subtotal</span>
                  <span>₹{subtotal}</span>
                </div>
                <div className="flex justify-between text-slate-500 font-medium">
                  <span>Delivery Charge</span>
                  <span className={deliveryCharge === 0 ? "text-emerald-500" : ""}>
                    {deliveryCharge === 0 ? "FREE" : `₹${deliveryCharge}`}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500 font-medium">
                  <span>Discount</span>
                  <span className="text-rose-500">- ₹0</span>
                </div>
              </div>

              <div className="flex justify-between items-center py-6">
                <span className="text-lg font-bold text-slate-800">Total Amount</span>
                <span className="text-2xl font-black text-emerald-600">₹{total}</span>
              </div>

              <button className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-slate-200 hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-3">
                Proceed to Checkout
                <ArrowLeft size={20} className="rotate-180" />
              </button>

              <div className="mt-6 p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-3">
                <Ticket size={20} className="text-emerald-600" />
                <input type="text" placeholder="Apply Coupon" className="bg-transparent outline-none text-sm font-bold placeholder:text-emerald-600/50 flex-1" />
                <button className="text-emerald-600 font-black text-xs uppercase">Apply</button>
              </div>
            </div>

            {/* Safety Badges */}
            <div className="flex items-center gap-4 px-4 text-slate-400">
              <ShieldCheck size={20} />
              <p className="text-[10px] font-bold uppercase tracking-widest">Secure SSL Encrypted Payment</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;