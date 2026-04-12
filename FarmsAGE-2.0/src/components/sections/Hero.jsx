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
  Percent
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="relative bg-white pt-6 pb-12 overflow-hidden font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Banner Container */}
        <div className="relative group cursor-pointer overflow-hidden rounded-[2rem] lg:rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-50">
          <div className="relative h-[400px] sm:h-[450px] md:h-[500px] lg:h-[600px] w-full overflow-hidden">
            <motion.img
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              transition={{ duration: 10, repeat: Infinity, repeatType: "reverse", ease: "linear" }}
              src="https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&q=80&w=1600"
              alt="Fresh Harvest"
              className="w-full h-full object-cover"
            />
            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />
            
            {/* Content Overlay */}
            <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-10 md:px-20">
               <motion.div
                 initial={{ opacity: 0, x: -50 }}
                 animate={{ opacity: 1, x: 0 }}
                 transition={{ duration: 0.8, delay: 0.2 }}
                 className="max-w-2xl"
               >
                 <div className="inline-flex items-center gap-2 bg-emerald-500 text-white px-4 py-1.5 rounded-full mb-6 shadow-xl shadow-emerald-500/20">
                    <TrendingUp size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Trending Choice</span>
                 </div>
                 
                 <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-[1.05] font-['Outfit']">
                   Freshness <br/>
                   <span className="text-emerald-400">Delivered</span> <br/>
                   in <span className="underline decoration-amber-400 decoration-8 underline-offset-4">Minutes.</span>
                 </h1>
                 
                 <p className="mt-8 text-white/80 text-lg md:text-xl font-medium max-w-lg leading-relaxed">
                   Experience the joy of farm-to-table shopping. Get organic produce hand-picked for your kitchen.
                 </p>
                 
                 <div className="mt-8 md:mt-10 flex flex-col sm:flex-row gap-3 md:gap-4">
                    <button 
                      onClick={() => navigate('/category/all')}
                      className="bg-white text-slate-900 px-6 md:px-10 py-3.5 md:py-4 rounded-2xl font-bold text-base md:text-lg hover:bg-emerald-500 hover:text-white transition-all transform active:scale-95 flex items-center justify-center gap-3 group"
                    >
                      Shop Now
                      <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                    <button className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-6 md:px-8 py-3.5 md:py-4 rounded-2xl font-bold text-base md:text-lg hover:bg-white/20 transition-all text-center">
                      View Offers
                    </button>
                 </div>
               </motion.div>
            </div>
          </div>

          
          {/* Bottom Trust Strip */}
          <div className="absolute bottom-0 left-0 right-0 h-4 bg-white/5 backdrop-blur-md border-t border-white/10 hidden md:flex items-center justify-around py-6">
             <div className="flex items-center gap-3 text-white">
                <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center">
                   <Clock size={18} className="text-emerald-400" />
                </div>
                <div>
                   <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Instant Delivery</p>
                   <p className="text-sm font-bold">Within 30 Minutes</p>
                </div>
             </div>
             <div className="w-px h-10 bg-white/10" />
             <div className="flex items-center gap-3 text-white">
                <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center">
                   <ShieldCheck size={18} className="text-amber-400" />
                </div>
                <div>
                   <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Certified Organic</p>
                   <p className="text-sm font-bold">100% Quality Assurance</p>
                </div>
             </div>
             <div className="w-px h-10 bg-white/10" />
             <div className="flex items-center gap-3 text-white">
                <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                   <Star size={18} className="text-blue-400" />
                </div>
                <div>
                   <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Trusted by Many</p>
                   <p className="text-sm font-bold">4.9/5 Average Rating</p>
                </div>
             </div>
          </div>
        </div>

        {/* Second Row: Sub-Banners (Swiggy Style) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12 px-2 lg:px-0">
           <motion.div 
             whileHover={{ scale: 1.02 }}
             className="relative h-[220px] rounded-[2rem] overflow-hidden bg-emerald-600 group cursor-pointer"
           >
              <img src="https://images.unsplash.com/photo-1543362906-acfc16c67564?auto=format&fit=crop&q=80&w=800" className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-110 transition-transform duration-700" alt="Discount" />
              <div className="absolute inset-0 p-6 sm:p-10 flex flex-col justify-center">
                 <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-emerald-600 mb-4 shadow-lg">
                    <Percent size={24} />
                 </div>
                 <h2 className="text-3xl font-bold text-white tracking-tight font-['Outfit']">Up to 40% OFF</h2>
                 <p className="text-emerald-50 text-sm font-medium mt-2">On fresh seasonal vegetables today.</p>
              </div>
           </motion.div>

           <motion.div 
             whileHover={{ scale: 1.02 }}
             className="relative h-[220px] rounded-[2rem] overflow-hidden bg-amber-500 group cursor-pointer"
           >
              <img src="https://images.unsplash.com/photo-1550989460-0adf9ea622e2?auto=format&fit=crop&q=80&w=800" className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-110 transition-transform duration-700" alt="Farmer" />
              <div className="absolute inset-0 p-6 sm:p-10 flex flex-col justify-center text-right items-end">
                 <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-amber-600 mb-4 shadow-lg">
                    <ShoppingBag size={24} />
                 </div>
                 <h2 className="text-3xl font-bold text-white tracking-tight font-['Outfit']">Daily Harvest</h2>
                 <p className="text-amber-50 text-sm font-medium mt-2">Directly from curated local farms.</p>
              </div>
           </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
