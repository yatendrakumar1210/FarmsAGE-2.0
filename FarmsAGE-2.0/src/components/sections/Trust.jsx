import React from "react";
import { motion } from "framer-motion";
import { Truck, Leaf, ShieldCheck, Heart, ArrowRight } from "lucide-react";

const trustFeatures = [
  {
    icon: <Truck size={32} />,
    title: "10-Min Delivery",
    desc: "From farm to your door in minutes",
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    icon: <Leaf size={32} />,
    title: "100% Organic",
    desc: "No pesticides, just pure nature",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    icon: <ShieldCheck size={32} />,
    title: "Secure Checkout",
    desc: "UPI, Cards & COD supported",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    icon: <Heart size={32} />,
    title: "Farmer First",
    desc: "Direct profits to local farmers",
    color: "text-rose-600",
    bg: "bg-rose-50",
  },
];

const Trust = () => {
  return (
    <section className="py-10 relative overflow-hidden">
      {/* Subtle Background Decoration */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-64 h-64 bg-emerald-50 blur-[100px] rounded-full opacity-50" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {trustFeatures.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="group p-8 rounded-[2.5rem] bg-white border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-emerald-100/40 transition-all duration-300"
            >
              <div
                className={`w-16 h-16 ${feature.bg} ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-inner`}
              >
                {feature.icon}
              </div>

              <h3 className="text-xl font-black text-slate-800 mb-2 tracking-tight">
                {feature.title}
              </h3>

              <p className="text-sm text-slate-500 font-medium leading-relaxed">
                {feature.desc}
              </p>

              <div className="mt-6 flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                Learn More <ArrowRight size={14} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Trust Quote / Stats Strip */}
      <div className="max-w-5xl mx-auto px-6 mt-8">
        <div className="bg-slate-900 rounded-[3rem] p-8 md:p-12 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Leaf size={120} className="text-emerald-500 rotate-45" />
          </div>
          <h4 className="text-white text-2xl md:text-3xl font-black mb-4">
            Trusted by <span className="text-emerald-400">10,000+</span>{" "}
            households in NCR.
          </h4>
          <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto">
            FarmsAge isn't just a marketplace; it's a movement to bring the soul
            of the Indian farm back to the modern city kitchen.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Trust;
