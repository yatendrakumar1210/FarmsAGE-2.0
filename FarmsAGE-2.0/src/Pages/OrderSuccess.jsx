import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CheckCircle2, 
  ShoppingBag, 
  ArrowRight, 
  Home, 
  Package, 
  Truck, 
  Clock, 
  CreditCard,
  PartyPopper,
  Sparkles,
  ChevronRight,
  Box
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";

const OrderSuccess = () => {
  const location = useLocation();
  const orderId = location.state?.orderId || "FARMS-" + Math.random().toString(36).substr(2, 9).toUpperCase();
  const paymentMethod = location.state?.paymentMethod || 'online';
  const [showConfetti, setShowConfetti] = useState(true);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.08,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: "spring", damping: 25, stiffness: 200 }
    }
  };

  const timelineSteps = [
    { icon: <ShoppingBag size={18} />, label: "Order Confirmed", status: "completed", time: "Today, 11:30 AM" },
    { icon: <Clock size={18} />, label: "Processing", status: "current", time: "In progress..." },
    { icon: <Truck size={18} />, label: "On the way", status: "pending", time: "Arriving soon" },
  ];

  // Confetti particles
  const particles = Array.from({ length: 30 });

  return (
    <div className="bg-[#fcfdfd] min-h-screen flex flex-col selection:bg-emerald-100 relative overflow-hidden font-sans">
      <Navbar />

      {/* Subtle Background Decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-40">
        <div className="absolute top-[10%] right-[10%] w-96 h-96 bg-emerald-50 rounded-full blur-3xl" />
        <div className="absolute bottom-[10%] left-[10%] w-96 h-96 bg-amber-50 rounded-full blur-3xl" />
      </div>

      {/* Simple Confetti */}
      <AnimatePresence>
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none z-50">
            {particles.map((_, i) => (
              <motion.div
                key={i}
                initial={{ x: Math.random() * window.innerWidth, y: -20, rotate: 0 }}
                animate={{ y: window.innerHeight + 20, rotate: 360 * Math.random() }}
                transition={{ duration: 2 + Math.random() * 2, delay: Math.random() * 1.5 }}
                className="absolute w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: ['#10b981', '#fbbf24', '#3b82f6', '#f472b6'][Math.floor(Math.random() * 4)] }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>
      
      <main className="flex-grow flex items-center justify-center py-12 px-4 relative z-10">
        <motion.div 
          className="max-w-4xl w-full"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Success Card */}
          <div className="bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-slate-100 p-8 sm:p-12 md:p-16 text-center relative">
            
            <motion.div variants={itemVariants} className="relative inline-block">
              <motion.div 
                className="w-24 h-24 sm:w-28 sm:h-28 bg-emerald-50 rounded-full flex items-center justify-center relative z-10"
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", bounce: 0.5 }}
              >
                <CheckCircle2 size={48} className="text-emerald-500" strokeWidth={2.5} />
              </motion.div>
            </motion.div>

            <motion.div variants={itemVariants} className="mt-8">
              <h1 className="text-3xl sm:text-5xl font-bold text-slate-900 tracking-tight mb-3">
                Order Placed!
              </h1>
              <p className="text-slate-500 font-medium text-base sm:text-lg max-w-md mx-auto leading-relaxed">
                Your farm-fresh harvest is being hand-picked and will reach you shortly.
              </p>
            </motion.div>

            {/* Content Grid */}
            <motion.div 
              variants={itemVariants}
              className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 text-left"
            >
              {/* Order Info */}
              <div className="bg-slate-50/50 rounded-2xl p-6 border border-slate-100 space-y-6">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Order ID</p>
                  <p className="text-lg font-bold text-slate-800 tracking-tight">#{orderId.slice(-8).toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Payment Method</p>
                  <div className="flex items-center gap-2">
                    {paymentMethod === 'cod' ? <Box size={14} className="text-amber-500"/> : <CreditCard size={14} className="text-emerald-500"/>}
                    <p className="text-sm font-semibold text-slate-700">
                      {paymentMethod === 'cod' ? 'Cash on Delivery' : 'Paid Online'}
                    </p>
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-200/50">
                   <div className="flex items-center gap-2 text-emerald-600">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                      <p className="text-[11px] font-bold uppercase tracking-wider">Fastest Delivery Guaranteed</p>
                   </div>
                </div>
              </div>

              {/* Status Tracker */}
              <div className="space-y-6 py-2 px-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Estimated Journey</p>
                  <div className="space-y-8 relative">
                    <div className="absolute left-[13px] top-6 bottom-6 w-0.5 bg-slate-100" />
                    {timelineSteps.map((step, idx) => (
                      <div key={idx} className="flex gap-4 items-center relative z-10">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] border-2 ${
                          step.status === 'completed' ? 'bg-emerald-500 border-emerald-500 text-white' : 
                          step.status === 'current' ? 'bg-white border-emerald-500 text-emerald-500' : 
                          'bg-white border-slate-200 text-slate-300'
                        }`}>
                          {idx + 1}
                        </div>
                        <div>
                           <p className={`text-sm font-bold ${step.status === 'pending' ? 'text-slate-300' : 'text-slate-800'}`}>
                            {step.label}
                          </p>
                          <p className="text-[10px] font-medium text-slate-400">{step.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
              </div>
            </motion.div>

            {/* Actions */}
            <motion.div 
              variants={itemVariants}
              className="mt-12 flex flex-col sm:flex-row gap-4"
            >
              <Link to="/my-orders" className="flex-1">
                <button className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-sm transition-all hover:bg-black flex items-center justify-center gap-2">
                  <Package size={18} />
                  Track Order
                </button>
              </Link>
              <Link to="/category/all" className="flex-1">
                <button className="w-full bg-white text-emerald-600 py-4 rounded-xl font-bold text-sm border border-emerald-100 transition-all hover:bg-emerald-50 flex items-center justify-center gap-2">
                  Continue Shopping
                  <ChevronRight size={18} />
                </button>
              </Link>
            </motion.div>
          </div>

          <motion.div variants={itemVariants} className="mt-10 text-center">
             <Link to="/home" className="text-slate-400 hover:text-emerald-600 font-bold text-xs transition-all uppercase tracking-widest inline-flex items-center gap-2">
                <Home size={14} /> Back to Home
             </Link>
          </motion.div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default OrderSuccess;

