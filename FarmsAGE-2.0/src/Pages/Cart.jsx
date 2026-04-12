import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, ArrowLeft, Trash2, Plus, Minus, Truck, ShieldCheck, Ticket } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";

const Cart = () => {
  const { cart, removeFromCart, updateQuantity } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleCheckout = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate('/checkout');
  };

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const deliveryCharge = subtotal > 500 ? 0 : 40;
  const total = subtotal + deliveryCharge;
  const freeDeliveryThreshold = 500;
  const progressToFree = Math.min((subtotal / freeDeliveryThreshold) * 100, 100);

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
      <div className="bg-[#F8FAFC] min-h-screen pt-8 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-4 mb-8 sm:mb-10">
            <Link to="/home" className="p-2 hover:bg-white rounded-xl transition-colors border border-transparent hover:border-slate-200">
              <ArrowLeft size={24} />
            </Link>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-800">My Shopping Cart <span className="text-emerald-600">({cart.reduce((a, i) => a + i.quantity, 0)})</span></h1>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 lg:gap-12 items-start">
            {/* 1. Left: Product List */}
            <div className="lg:col-span-2 space-y-4">
              {/* Free Delivery Progress */}
              <div className="bg-white p-4 sm:p-6 rounded-3xl border border-gray-100 shadow-sm mb-4 sm:mb-6">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs sm:text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Truck size={18} className="text-emerald-500" />
                    {subtotal >= 500 ? "Congrats! Free Delivery applied" : `Add ₹${500 - subtotal} more for Free Delivery`}
                  </span>
                  <span className="text-xs font-black text-emerald-600">{Math.round(progressToFree)}%</span>
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
                {cart.map((item) => (
                  <motion.div 
                    key={`${item.id}-${item.weight}`}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white p-4 rounded-3xl border border-gray-100 flex items-center gap-3 sm:gap-6 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gray-50 rounded-2xl p-1 sm:p-2 shrink-0 overflow-hidden">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-xl" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-800 text-sm sm:text-base leading-tight truncate">{item.name}</h3>
                      <div className="mt-1 flex items-center">
                        <select
                          value={item.weight}
                          onChange={(e) => {
                            const newWeight = e.target.value;
                            const weightOptions = [
                              { label: "1 kg", multiplier: 1 },
                              { label: "500 g", multiplier: 0.5 },
                              { label: "250 g", multiplier: 0.25 },
                            ];
                            const opt = weightOptions.find(o => o.label === newWeight);
                            const currentOpt = weightOptions.find(o => o.label === item.weight);
                            
                            if (opt && currentOpt && typeof updateItemWeight === 'function') {
                              // If originalPricePerKg doesn't exist (added before recent change), calculate it
                              const basePrice = item.originalPricePerKg || (item.price / currentOpt.multiplier);
                              const newPrice = Math.round(basePrice * opt.multiplier);
                              updateItemWeight(item.id, item.weight, newWeight, newPrice);
                            }
                          }}
                          className="appearance-none bg-gray-50 border border-gray-200 text-emerald-600 text-[10px] font-black uppercase tracking-wider rounded border-emerald-100 hover:border-emerald-300 transition-colors focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 block px-2 py-1 cursor-pointer outline-none"
                        >
                          <option value="1 kg">1 kg</option>
                          <option value="500 g">500 g</option>
                          <option value="250 g">250 g</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-between mt-2 sm:mt-3 gap-2">
                        <div>
                          <p className="font-black text-emerald-600 text-base sm:text-lg">₹{item.price * item.quantity}</p>
                          {item.quantity > 1 && (
                            <p className="text-[10px] text-slate-400 font-medium">₹{item.price} × {item.quantity}</p>
                          )}
                        </div>
                        
                        {/* Qty Controls */}
                        <div className="flex items-center gap-2 sm:gap-3 bg-gray-50 p-1 rounded-xl border border-gray-100">
                          <button 
                            onClick={() => {
                              if (item.quantity <= 1) {
                                removeFromCart(item.id, item.weight);
                              } else {
                                updateQuantity(item.id, item.weight, -1);
                              }
                            }}
                            className="p-1 hover:bg-white rounded-lg transition-colors text-slate-500"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="font-bold text-sm min-w-[20px] text-center">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.id, item.weight, 1)}
                            className="p-1 hover:bg-white rounded-lg transition-colors text-emerald-600"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={() => removeFromCart(item.id, item.weight)}
                      className="p-2 sm:p-3 text-slate-300 hover:text-rose-500 transition-colors shrink-0"
                    >
                      <Trash2 size={18} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* 2. Right: Bill Summary */}
            <div className="space-y-6">
              <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-emerald-100/20">
                <h3 className="text-xl font-black text-slate-800 mb-6">Order Summary</h3>
                
                <div className="space-y-4 border-b border-gray-50 pb-6">
                  <div className="flex justify-between text-slate-500 font-medium">
                    <span>Subtotal ({cart.reduce((a, i) => a + i.quantity, 0)} items)</span>
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

                <button 
                  onClick={handleCheckout}
                  className="w-full bg-slate-900 text-white py-4 sm:py-5 rounded-2xl font-black text-lg shadow-xl shadow-slate-200 hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-3"
                >
                  Proceed to Checkout
                  <ArrowLeft size={20} className="rotate-180" />
                </button>

                <div className="mt-6 p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-3">
                  <Ticket size={20} className="text-emerald-600 shrink-0" />
                  <input type="text" placeholder="Apply Coupon" className="bg-transparent outline-none text-sm font-bold placeholder:text-emerald-600/50 flex-1 min-w-0" />
                  <button className="text-emerald-600 font-black text-xs uppercase shrink-0">Apply</button>
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
      <Footer />
    </>
  );
};

export default Cart;
