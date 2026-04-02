import React from "react";
import { motion } from "framer-motion";
import {
  ShoppingBag,
  ChevronRight,
  Star,
  ShieldCheck,
  Clock,
} from "lucide-react";
import Button from "../common/Button";

const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-[#FDFDFF] pt-32 pb-20 lg:pt-48 lg:pb-32">
      {/* 1. Dynamic Background Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[60%] bg-emerald-100/40 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[60%] bg-amber-100/40 blur-[120px] rounded-full" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content: Text & CTA */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-left"
          >
            <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-full mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-emerald-700 text-xs font-bold uppercase tracking-wider">
                Live in Noida & Faridabad
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl font-black text-slate-900 leading-[1.1] tracking-tight">
              Freshness that <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-green-500">
                Empowers Farmers.
              </span>
            </h1>

            <p className="mt-8 text-slate-600 text-lg md:text-xl max-w-xl leading-relaxed">
              Skip the middleman. Get 100% organic produce delivered from the
              fertile lands of India to your dining table in{" "}
              <span className="font-bold text-slate-900 underline decoration-amber-400">
                30 minutes.
              </span>
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => window.location.href = '/category/all'}
                className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-xl shadow-emerald-200 transition-all active:scale-95 group"
              >
                <ShoppingBag size={20} />
                Start Shopping
                <ChevronRight
                  size={18}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </button>

              <button className="flex items-center justify-center gap-2 bg-white border-2 border-slate-100 hover:border-emerald-200 text-slate-700 px-8 py-4 rounded-2xl font-bold text-lg transition-all shadow-sm">
                Become a Partner
              </button>
            </div>

            {/* Premium Trust Badges */}
            <div className="mt-12 flex flex-wrap gap-8">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                  <Star size={20} fill="currentColor" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    4.9/5 Rating
                  </p>
                  <p className="text-[10px] text-slate-500 uppercase font-bold">
                    10k+ Customers
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 border-l border-slate-200 pl-8">
                <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    100% Organic
                  </p>
                  <p className="text-[10px] text-slate-500 uppercase font-bold">
                    Certified Farms
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Content: Visual Showcase */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="relative hidden lg:block"
          >
            {/* The Main Image Container */}
            <div className="relative z-10 rounded-[3rem] overflow-hidden shadow-2xl border-[12px] border-white">
              <img
                src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1000"
                alt="Fresh Produce"
                className="w-full h-[600px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/40 to-transparent" />
            </div>

            {/* Floating Info Card */}
            <motion.div
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -bottom-6 -left-10 z-20 bg-white/90 backdrop-blur-xl p-6 rounded-3xl shadow-2xl border border-white/50 flex items-center gap-4"
            >
              <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
                <Clock size={28} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase">
                  Express Delivery
                </p>
                <p className="text-xl font-black text-slate-900">~12 Minutes</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
