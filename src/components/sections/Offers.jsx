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
    <section className="max-w-7xl mx-auto px-6 py-12">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
          <Ticket size={24} />
        </div>
        <h2 className="text-2xl md:text-3xl font-black text-slate-800">
          Exclusive <span className="text-emerald-600">Offers</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {offerCards.map((offer, index) => (
          <motion.div
            key={index}
            whileHover={{ y: -8 }}
            className={`relative overflow-hidden bg-gradient-to-br ${offer.color} rounded-[2.5rem] p-8 shadow-xl shadow-emerald-100/20 group cursor-pointer`}
          >
            {/* Background Decorative Circles */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />

            <div className="relative z-10 flex flex-col h-full justify-between">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-black text-white leading-tight">
                    {offer.title}
                  </h3>
                  <p className="text-white/80 text-sm mt-2 font-medium">
                    {offer.subtitle}
                  </p>
                </div>
                <div className="bg-white/20 backdrop-blur-md p-3 rounded-2xl">
                  {offer.icon}
                </div>
              </div>

              <div className="mt-10 flex items-center justify-between gap-4">
                <div className="flex flex-col">
                  <span className="text-[10px] text-white/60 uppercase font-black tracking-widest">
                    Use Code
                  </span>
                  <div className="bg-white/10 border border-white/20 backdrop-blur-md px-4 py-2 rounded-xl">
                    <span className="text-white font-mono font-bold tracking-tighter">
                      {offer.code}
                    </span>
                  </div>
                </div>

                <button 
                  onClick={() => window.location.href = '/category/all'}
                  className="bg-white text-slate-900 px-6 py-3 rounded-2xl font-bold text-sm hover:bg-emerald-50 transition-colors shadow-lg shadow-black/10 active:scale-95"
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
