import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2, ShoppingBag, ArrowRight, Home, Package } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";

const OrderSuccess = () => {
  const location = useLocation();
  const orderId = location.state?.orderId || "Order Placed Successfully";

  return (
    <>
      <Navbar />
      <div className="bg-[#F8FAFC] min-h-screen pt-8 pb-20 flex items-center justify-center">
        <div className="max-w-xl mx-auto px-6 w-full text-center">
          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }}
            className="w-32 h-32 sm:w-48 sm:h-48 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-10 border-8 border-emerald-100"
          >
            <CheckCircle2 size={80} className="text-emerald-500" />
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-3xl sm:text-4xl font-black text-slate-800 mb-4">Order Successful!</h1>
            <p className="text-slate-500 font-medium mb-8">Thank you for choosing FarmsAGE. Your fresh organic produce is being processed for delivery.</p>
            
            <div className="bg-white p-6 rounded-3xl border border-gray-100 mb-10 shadow-sm">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Order ID</p>
              <p className="text-lg font-bold text-emerald-600 font-mono">{orderId}</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/home" className="flex-1">
                <button className="w-full bg-emerald-50 text-emerald-600 py-4 rounded-2xl font-black hover:bg-emerald-100 transition-all flex items-center justify-center gap-2">
                  <Home size={20} />
                  Home
                </button>
              </Link>
              <Link to="/my-orders" className="flex-1">
                <button className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2">
                  <Package size={20} />
                  My Orders
                </button>
              </Link>
            </div>
            <Link to="/category/all" className="block mt-4 text-slate-400 hover:text-emerald-600 font-bold text-sm transition-colors">
               Continue Shopping
            </Link>
          </motion.div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default OrderSuccess;
