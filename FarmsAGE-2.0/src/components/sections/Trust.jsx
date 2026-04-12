import React from "react";
import { motion } from "framer-motion";
import { Truck, Leaf, ShieldCheck, Heart, ArrowRight } from "lucide-react";

const trustFeatures = [
  {
    icon: <Truck size={28} />,
    title: "Instant Delivery",
    desc: "Fresh harvests at your door in 30 minutes",
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    icon: <Leaf size={28} />,
    title: "100% Organic",
    desc: "Pure nature, zero chemical pesticides",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    icon: <ShieldCheck size={28} />,
    title: "Secure Payments",
    desc: "UPI, Cards & Razorpay supported",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    icon: <Heart size={28} />,
    title: "Farmer Choice",
    desc: "Supporting the backbone of our nation",
    color: "text-rose-600",
    bg: "bg-rose-50",
  },
];

const Trust = () => {
  return (
    <section className="py-8 sm:py-10 md:py-12 lg:py-16 relative overflow-hidden font-sans">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
          {trustFeatures.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-emerald-50 transition-all duration-300"
            >
              <div
                className={`w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 ${feature.bg} ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500`}
              >
                {feature.icon}
              </div>

              <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2 tracking-tight">
                {feature.title}
              </h3>

              <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Trust Quote / Stats Strip */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 mt-10 sm:mt-12 md:mt-16">
        <div className="bg-slate-900 rounded-[2.5rem] p-6 sm:p-8 md:p-10 lg:p-14 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Leaf size={120} className="text-emerald-400 rotate-45" />
          </div>
          <h4 className="text-white text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-4 font-['Outfit'] tracking-tight">
            Trusted by <span className="text-emerald-500">25,000+</span>{" "}
            households in India.
          </h4>
          <p className="text-slate-400 text-xs sm:text-sm md:text-base lg:text-lg max-w-2xl mx-auto font-medium leading-relaxed">
            FarmsAge is more than a marketplace; it's a movement to bridge the
            gap between rural abundance and urban wellness.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Trust;

