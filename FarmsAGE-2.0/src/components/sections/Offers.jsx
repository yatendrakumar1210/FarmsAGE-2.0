import React from "react";
import { motion } from "framer-motion";
import { Ticket, Sparkles, Zap, Gift } from "lucide-react";

const offerCards = [
  {
    title: "Flat 20% OFF 🎉",
    subtitle: "On your first order above ₹499",
    code: "FIRST20",
    color: "from-emerald-600 to-teal-700",
    icon: <Sparkles className="text-emerald-200" size={32} />,
  },
  {
    title: "Free Delivery 🚚",
    subtitle: "On all organic vegetable baskets",
    code: "FREESHIP",
    color: "from-amber-500 to-orange-600",
    icon: <Zap className="text-amber-100" size={32} />,
  },
  {
    title: "Weekend Special 🍎",
    subtitle: "Buy 1 Get 1 on Seasonal Fruits",
    code: "BOGOFRUIT",
    color: "from-rose-500 to-pink-600",
    icon: <Gift className="text-rose-100" size={32} />,
  },
];

const Offers = () => {
  return (
    <section className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8 md:py-10">
      {/* Header */}
      <div className="flex items-center gap-2 sm:gap-3 mb-6 sm:mb-8">
        <div className="p-1.5 sm:p-2 bg-amber-100 rounded-lg text-amber-600">
          <Ticket size={20} className="sm:w-6 sm:h-6" />
        </div>

        <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-800">
          Exclusive <span className="text-emerald-600">Offers</span>
        </h2>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
        {offerCards.map((offer, index) => (
          <motion.div
            key={index}
            whileHover={{ y: -6 }}
            className={`relative overflow-hidden bg-linear-to-br ${offer.color} rounded-2xl sm:rounded-4xl p-4 sm:p-6 md:p-8 shadow-lg sm:shadow-xl group cursor-pointer`}
          >
            {/* Background Effect */}
            <div className="absolute -top-10 -right-10 w-24 sm:w-32 h-24 sm:h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />

            <div className="relative z-10 flex flex-col h-full justify-between">
              {/* Top Section */}
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h3 className="text-lg sm:text-xl md:text-2xl font-black text-white leading-tight">
                    {offer.title}
                  </h3>
                  <p className="text-white/80 text-xs sm:text-sm mt-1 sm:mt-2 font-medium">
                    {offer.subtitle}
                  </p>
                </div>

                <div className="bg-white/20 backdrop-blur-md p-2 sm:p-3 rounded-xl sm:rounded-2xl shrink-0">
                  {offer.icon}
                </div>
              </div>

              {/* Bottom Section */}
              <div className="mt-6 sm:mt-8 md:mt-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                {/* Coupon */}
                <div className="flex flex-col">
                  <span className="text-[9px] sm:text-[10px] text-white/60 uppercase font-black tracking-widest">
                    Use Code
                  </span>
                  <div className="bg-white/10 border border-white/20 backdrop-blur-md px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl">
                    <span className="text-white text-xs sm:text-sm font-mono font-bold tracking-tight">
                      {offer.code}
                    </span>
                  </div>
                </div>

                {/* CTA */}
                <button
                  onClick={() => (window.location.href = "/category/all")}
                  className="w-full sm:w-auto bg-white text-slate-900 px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm hover:bg-emerald-50 transition-colors shadow-md active:scale-95"
                >
                  Claim Now
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default Offers;

