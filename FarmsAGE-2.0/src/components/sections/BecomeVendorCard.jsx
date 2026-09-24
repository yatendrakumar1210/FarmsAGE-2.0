import React from "react";
import { motion } from "framer-motion";
import { Store, PlusCircle, TrendingUp, ArrowRight, ShieldCheck, Sparkles, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const BecomeVendorCard = () => {
  const navigate = useNavigate();

  return (
    <section className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8 font-sans">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden bg-slate-900 text-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-10 border border-slate-800 shadow-xl shadow-slate-950/20"
      >
        {/* Ambient Gradient Glows (Vendor Console Theme) */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Left Side Info */}
          <div className="flex-1 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 bg-amber-500/15 border border-amber-500/30 text-amber-400 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider mb-3">
              <Store size={13} className="text-amber-400" />
              <span>FarmsAGE Vendor Partner</span>
            </div>

            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight leading-tight mb-2 font-['Outfit']">
              Become a Vendor — <span className="text-emerald-400">Signup & Add Your Products</span>
            </h2>

            <p className="text-slate-400 text-xs sm:text-sm font-medium max-w-xl leading-relaxed mb-4">
              Sell fresh fruits, vegetables, and farm produce directly to local households in your area. Zero setup fees & instant payouts.
            </p>

            {/* Quick 3-Step Badges */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 sm:gap-4 text-xs font-bold text-slate-300">
              <span className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/60">
                <CheckCircle2 size={14} className="text-emerald-400" /> 1. Quick Signup
              </span>
              <span className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/60">
                <PlusCircle size={14} className="text-amber-400" /> 2. Upload Products
              </span>
              <span className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/60">
                <TrendingUp size={14} className="text-teal-400" /> 3. Receive Live Orders
              </span>
            </div>
          </div>

          {/* Right Side CTAs */}
          <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row items-stretch gap-3 shrink-0 w-full sm:w-auto">
            <button
              onClick={() => navigate("/register")}
              className="group flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black px-6 py-3 rounded-xl text-xs sm:text-sm shadow-lg shadow-emerald-900/30 transition-all duration-200 active:scale-95 cursor-pointer"
            >
              <span>Register as Vendor</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => navigate("/vendor")}
              className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-bold px-5 py-3 rounded-xl text-xs sm:text-sm transition-all duration-200 cursor-pointer"
            >
              <Store size={15} className="text-amber-400" />
              <span>Vendor Portal</span>
            </button>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default BecomeVendorCard;
