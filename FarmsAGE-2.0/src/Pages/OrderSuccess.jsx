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
  Sparkles,
  ChevronRight,
  Box,
  MapPin,
  Check,
  ShieldCheck
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { playOrderSuccessSound } from "../utils/playOrderSound";

const OrderSuccess = () => {
  const location = useLocation();
  const orderId = location.state?.orderId || "FARMS-" + Math.random().toString(36).substr(2, 8).toUpperCase();
  const paymentMethod = location.state?.paymentMethod || 'online';
  const [showConfetti, setShowConfetti] = useState(true);

  // 🔔 Play Swiggy/Zomato signature order success chime
  useEffect(() => {
    playOrderSuccessSound();
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.6,
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 25, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: "spring", damping: 22, stiffness: 180 }
    }
  };

  const timelineSteps = [
    { 
      icon: <Check size={16} />, 
      label: "Order Placed & Confirmed", 
      status: "completed", 
      desc: "Received by FarmSage Merchant",
      time: "Just now" 
    },
    { 
      icon: <Clock size={16} />, 
      label: "Hand-picking & Quality Check", 
      status: "current", 
      desc: "Fresh produce selected",
      time: "In progress" 
    },
    { 
      icon: <Truck size={16} />, 
      label: "Out for Express Delivery", 
      status: "pending", 
      desc: "Direct to your doorstep",
      time: "Est. ~25 mins" 
    },
  ];

  // Dynamic Multi-colored Confetti
  const particles = Array.from({ length: 40 });

  return (
    <div className="bg-[#FAFBFD] min-h-screen flex flex-col selection:bg-emerald-100 relative overflow-hidden font-sans">
      <Navbar />

      {/* Decorative Ambient Background Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] overflow-hidden pointer-events-none opacity-60 z-0">
        <div className="absolute top-10 left-1/4 w-96 h-96 bg-emerald-300/20 rounded-full blur-[120px]" />
        <div className="absolute top-20 right-1/4 w-96 h-96 bg-teal-300/20 rounded-full blur-[120px]" />
        <div className="absolute top-40 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-amber-200/20 rounded-full blur-[140px]" />
      </div>

      {/* Confetti Animation */}
      <AnimatePresence>
        {showConfetti && (
          <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
            {particles.map((_, i) => {
              const colors = ['#10B981', '#34D399', '#F59E0B', '#3B82F6', '#EC4899', '#8B5CF6'];
              const randomColor = colors[i % colors.length];
              const size = 6 + (i % 6);
              return (
                <motion.div
                  key={i}
                  initial={{ 
                    x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000), 
                    y: -30, 
                    rotate: 0,
                    opacity: 1
                  }}
                  animate={{ 
                    y: (typeof window !== 'undefined' ? window.innerHeight : 800) + 50, 
                    x: `calc(${Math.random() * 100}vw + ${(i % 2 === 0 ? 50 : -50)}px)`,
                    rotate: 720 * (i % 2 === 0 ? 1 : -1),
                    opacity: [1, 1, 0.8, 0]
                  }}
                  transition={{ 
                    duration: 3 + Math.random() * 2.5, 
                    delay: Math.random() * 1.2,
                    ease: "easeOut"
                  }}
                  className="absolute"
                  style={{
                    width: `${size}px`,
                    height: `${size * (i % 3 === 0 ? 2 : 1)}px`,
                    borderRadius: i % 2 === 0 ? '50%' : '2px',
                    backgroundColor: randomColor,
                  }}
                />
              );
            })}
          </div>
        )}
      </AnimatePresence>

      <main className="flex-grow flex items-center justify-center py-8 sm:py-16 px-4 relative z-10">
        <motion.div 
          className="max-w-3xl w-full"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Main Success Container */}
          <div className="bg-white rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.04)] border border-slate-100/80 p-6 sm:p-12 md:p-14 text-center relative overflow-hidden backdrop-blur-xl">
            
            {/* Top Badge Pill */}
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-700 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider mb-8 shadow-sm">
              <Sparkles size={14} className="text-emerald-500 animate-spin-slow" />
              <span>Order Received & Processing</span>
            </motion.div>

            {/* Glowing Success Badge Icon */}
            <motion.div variants={itemVariants} className="relative inline-flex items-center justify-center mb-6">
              {/* Pulse rings */}
              <div className="absolute inset-0 bg-emerald-400/20 rounded-full animate-ping opacity-75 duration-1000 scale-125" />
              <div className="absolute -inset-3 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-full blur-md" />
              
              <motion.div 
                className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-full flex items-center justify-center relative z-10 shadow-xl shadow-emerald-500/30 text-white"
                initial={{ scale: 0.5, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", damping: 15, stiffness: 200 }}
              >
                <CheckCircle2 size={46} strokeWidth={2.5} className="drop-shadow-md" />
              </motion.div>
            </motion.div>

            {/* Order Title & Message */}
            <motion.div variants={itemVariants} className="max-w-lg mx-auto">
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                Order Placed Successfully!
              </h1>
              <p className="mt-3 text-slate-500 font-medium text-xs sm:text-base leading-relaxed">
                Thank you for choosing <span className="font-bold text-slate-800">FarmsAGE</span>. Your farm-fresh harvest is being hand-picked from top local partners.
              </p>
            </motion.div>

            {/* Quick Status Bar */}
            <motion.div variants={itemVariants} className="mt-8 bg-slate-50/80 rounded-2xl p-4 sm:p-5 border border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                  <Truck size={20} />
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Estimated Delivery</p>
                  <p className="text-sm sm:text-base font-extrabold text-slate-800">25–30 Minutes</p>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 text-xs font-bold text-slate-700 shadow-sm">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Express Dispatch</span>
              </div>
            </motion.div>

            {/* Detailed Info Cards Grid */}
            <motion.div 
              variants={itemVariants}
              className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 text-left"
            >
              {/* Order Info Card */}
              <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100 flex flex-col justify-between gap-4">
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                    Order Reference
                  </span>
                  <div className="flex items-center justify-between">
                    <p className="text-base sm:text-lg font-black text-slate-800 tracking-tight">
                      #{orderId.slice(-8).toUpperCase()}
                    </p>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-1 rounded-full uppercase">
                      Confirmed
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Payment Mode</span>
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    {paymentMethod === 'cod' ? (
                      <>
                        <Box size={14} className="text-amber-500" />
                        <span>Cash on Delivery</span>
                      </>
                    ) : (
                      <>
                        <CreditCard size={14} className="text-emerald-500" />
                        <span>Online Paid</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500">
                  <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
                  <span>100% Quality & Freshness Guarantee</span>
                </div>
              </div>

              {/* Order Tracker Timeline */}
              <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100 flex flex-col justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">
                  Live Track Preview
                </span>

                <div className="space-y-4 relative">
                  <div className="absolute left-[13px] top-2 bottom-2 w-0.5 bg-slate-200/80" />

                  {timelineSteps.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-3 relative z-10">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] shrink-0 border-2 ${
                        step.status === 'completed' ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm' : 
                        step.status === 'current' ? 'bg-white border-emerald-500 text-emerald-600 font-bold shadow-sm' : 
                        'bg-white border-slate-200 text-slate-300'
                      }`}>
                        {step.icon}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <p className={`text-xs font-extrabold ${step.status === 'pending' ? 'text-slate-400' : 'text-slate-800'}`}>
                            {step.label}
                          </p>
                          <span className="text-[9px] font-bold text-slate-400">{step.time}</span>
                        </div>
                        <p className="text-[10px] font-medium text-slate-400 truncate">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div 
              variants={itemVariants}
              className="mt-10 flex flex-col sm:flex-row items-center gap-3 sm:gap-4"
            >
              <Link to="/my-orders" className="w-full sm:flex-1">
                <button className="w-full bg-slate-900 hover:bg-emerald-700 text-white py-4 px-6 rounded-2xl font-black text-xs sm:text-sm transition-all shadow-lg shadow-slate-900/10 flex items-center justify-center gap-2 group">
                  <Package size={18} />
                  <span>Track My Orders</span>
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>

              <Link to="/category/all" className="w-full sm:flex-1">
                <button className="w-full bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 py-4 px-6 rounded-2xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-sm">
                  <ShoppingBag size={18} className="text-emerald-600" />
                  <span>Continue Shopping</span>
                </button>
              </Link>
            </motion.div>

            {/* Back to Home Link */}
            <motion.div variants={itemVariants} className="mt-8">
              <Link to="/home" className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-emerald-600 transition-colors uppercase tracking-wider">
                <Home size={14} /> Return to Homepage
              </Link>
            </motion.div>

          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default OrderSuccess;
