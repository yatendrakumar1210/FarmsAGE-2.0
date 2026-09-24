import React from "react";
import { motion } from "framer-motion";
import {
  ShoppingBag,
  ChevronRight,
  Star,
  ShieldCheck,
  Clock,
  ArrowRight,
  TrendingUp,
  Percent,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="relative bg-white pt-2 sm:pt-6 md:pt-8 pb-4 sm:pb-8 md:pb-12 overflow-hidden font-sans">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* Main Banner Container */}
        <div className="relative group cursor-pointer overflow-hidden rounded-2xl sm:rounded-[2rem] lg:rounded-[3rem] shadow-[0_10px_30px_rgba(0,0,0,0.04)] border border-slate-50">
          <div className="relative min-h-[170px] sm:min-h-[260px] md:min-h-[450px] lg:min-h-[520px] xl:min-h-[580px] w-full overflow-hidden">
            <motion.img
              initial={{ scale: 1.05 }}
              animate={{ scale: 1 }}
              transition={{
                duration: 10,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "linear",
              }}
              src="https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&q=70&w=1600"
              alt="Fresh Harvest"
              fetchpriority="high"
              className="w-full h-full object-cover"
            />
            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/35 to-transparent" />
            
            {/* Content Overlay */}
            <div className="absolute inset-0 flex flex-col justify-center px-4 sm:px-6 md:px-10 lg:px-16">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="max-w-2xl"
              >
                {/* 10-Min Badge */}
                <div className="inline-flex items-center gap-1.5 bg-emerald-500 text-white px-2.5 sm:px-4 py-0.5 sm:py-1.5 rounded-full mb-2 sm:mb-6 shadow-md shadow-emerald-500/20">
                  <TrendingUp size={12} className="shrink-0" />
                  <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider">
                    ⚡ 30-40 Min Delivery
                  </span>
                </div>

                <h1 className="text-xl sm:text-3xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white tracking-tight leading-[1.1] font-['Outfit']">
                  Freshness <br className="hidden sm:inline" />
                  <span className="text-emerald-400">Delivered</span> in{" "}
                  <span className="underline decoration-amber-400 decoration-4 sm:decoration-8 underline-offset-2 sm:underline-offset-4">
                    Minutes.
                  </span>
                </h1>

                <p className="hidden md:block mt-6 text-white/80 text-sm sm:text-base md:text-lg lg:text-xl font-medium max-w-lg leading-relaxed">
                  Supporting local fruit & vegetable vendors directly. No warehouses, no middlemen—just fresh produce from your neighborhood sellers.
                </p>

                <div className="mt-3 sm:mt-6 md:mt-10 flex items-center gap-2 sm:gap-4">
                  <button
                    onClick={() => navigate("/category/all")}
                    className="bg-white text-slate-900 px-4 sm:px-8 md:px-10 py-2 sm:py-3.5 md:py-4 rounded-xl sm:rounded-2xl font-black text-xs sm:text-base md:text-lg hover:bg-emerald-500 hover:text-white transition-all transform active:scale-95 flex items-center justify-center gap-1.5 sm:gap-3 group shadow-md"
                  >
                    <span>Shop Now</span>
                    <ArrowRight
                      size={16}
                      className="group-hover:translate-x-1 transition-transform"
                    />
                  </button>
                  <button 
                    onClick={() => navigate("/category/all")}
                    className="bg-white/15 backdrop-blur-md border border-white/25 text-white px-3 sm:px-6 md:px-8 py-2 sm:py-3.5 md:py-4 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-base md:text-lg hover:bg-white/25 transition-all"
                  >
                    View Offers
                  </button>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Bottom Trust Strip (Desktop) */}
          <div className="absolute bottom-0 left-0 right-0 bg-white/5 backdrop-blur-md border-t border-white/10 hidden md:flex items-center justify-around py-4 lg:py-6">
             <div className="flex items-center gap-3 text-white">
                <div className="w-9 h-9 bg-emerald-500/20 rounded-full flex items-center justify-center">
                   <Clock size={16} className="text-emerald-400" />
                </div>
                <div>
                   <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Instant Delivery</p>
                   <p className="text-xs sm:text-sm font-bold">Within 10-15 Minutes</p>
                </div>
             </div>
             <div className="w-px h-8 bg-white/10" />
             <div className="flex items-center gap-3 text-white">
                <div className="w-9 h-9 bg-amber-500/20 rounded-full flex items-center justify-center">
                   <ShieldCheck size={16} className="text-amber-400" />
                </div>
                <div>
                   <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">No Middlemen</p>
                   <p className="text-xs sm:text-sm font-bold">Direct Local Farmers</p>
                </div>
             </div>
             <div className="w-px h-8 bg-white/10" />
             <div className="flex items-center gap-3 text-white">
                <div className="w-9 h-9 bg-blue-500/20 rounded-full flex items-center justify-center">
                   <Star size={16} className="text-blue-400" />
                </div>
                <div>
                   <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Customer Rating</p>
                   <p className="text-xs sm:text-sm font-bold">4.9/5 Fresh Verified</p>
                </div>
             </div>
          </div>
        </div>

        {/* Second Row: Sub-Banners (Mobile 2-col compact grid) */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-6 mt-3 sm:mt-6 md:mt-8">
          <motion.div
            whileHover={{ scale: 1.02 }}
            onClick={() => navigate("/category/vegetables")}
            className="relative min-h-[90px] sm:min-h-[160px] md:min-h-[200px] rounded-xl sm:rounded-[2rem] overflow-hidden bg-emerald-600 group cursor-pointer shadow-sm"
          >
            <img
              src="https://images.unsplash.com/photo-1543362906-acfc16c67564?auto=format&fit=crop&q=60&w=800"
              className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-110 transition-transform duration-700"
              alt="Discount"
              loading="lazy"
            />
            <div className="absolute inset-0 p-3 sm:p-6 flex flex-col justify-center">
              <div className="w-7 h-7 sm:w-10 sm:h-10 bg-white rounded-lg sm:rounded-xl flex items-center justify-center text-emerald-600 mb-1 sm:mb-2 shadow-sm">
                <Percent size={14} className="sm:w-5 sm:h-5" />
              </div>
              <h2 className="text-sm sm:text-2xl font-black text-white tracking-tight font-['Outfit']">
                Up to 40% OFF
              </h2>
              <p className="text-emerald-50 text-[10px] sm:text-xs font-medium line-clamp-1">
                Seasonal farm veggies
              </p>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            onClick={() => navigate("/category/organic")}
            className="relative min-h-[90px] sm:min-h-[160px] md:min-h-[200px] rounded-xl sm:rounded-[2rem] overflow-hidden bg-amber-500 group cursor-pointer shadow-sm"
          >
            <img
              src="https://images.unsplash.com/photo-1550989460-0adf9ea622e2?auto=format&fit=crop&q=60&w=800"
              className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-110 transition-transform duration-700"
              alt="Farmer"
              loading="lazy"
            />
            <div className="absolute inset-0 p-3 sm:p-6 flex flex-col justify-center text-right items-end">
              <div className="w-7 h-7 sm:w-10 sm:h-10 bg-white rounded-lg sm:rounded-xl flex items-center justify-center text-amber-600 mb-1 sm:mb-2 shadow-sm">
                <ShoppingBag size={14} className="sm:w-5 sm:h-5" />
              </div>
              <h2 className="text-sm sm:text-2xl font-black text-white tracking-tight font-['Outfit']">
                Support Local
              </h2>
              <p className="text-amber-50 text-[10px] sm:text-xs font-medium line-clamp-1">
                Direct vendor support
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;


