import React from "react";
import { motion } from "framer-motion";
import {
  Phone,
  Mail,
  MapPin,
  MessageCircle,
  Clock,
  Send,
  HelpCircle,
  Truck,
} from "lucide-react";

const Contact = () => {
  const contactMethods = [
    {
      icon: <Phone size={24} />,
      title: "Call Us",
      value: "+91 9658X XXXXX",
      desc: "Mon-Sat, 9am to 9pm",
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      icon: <MessageCircle size={24} />,
      title: "WhatsApp",
      value: "Chat with us",
      desc: "Instant support for orders",
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      icon: <Mail size={24} />,
      title: "Email Support",
      value: "help@farmsage.com",
      desc: "Response within 24 hours",
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
  ];

  return (
    <div className="bg-[#F8FAFC] min-h-screen pt-28 pb-20">
      <div className="max-w-7xl mx-auto px-6">
        {/* 1. Header Section */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-emerald-600 font-bold text-sm uppercase tracking-widest"
          >
            Get In Touch
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-black text-slate-800 mt-4 leading-tight"
          >
            We're here to help you{" "}
            <span className="text-emerald-600">Grow & Eat.</span>
          </motion.h1>
          <p className="text-slate-500 mt-6 text-lg font-medium">
            Have a question about your order or want to partner with us? Our
            team in NCR is ready to assist you.
          </p>
        </div>

        {/* 2. Contact Cards Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-20">
          {contactMethods.map((method, index) => (
            <motion.div
              key={index}
              whileHover={{ y: -5 }}
              className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-emerald-100/30 transition-all text-center group"
            >
              <div
                className={`w-16 h-16 ${method.bg} ${method.color} rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:rotate-12 transition-transform`}
              >
                {method.icon}
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-1">
                {method.title}
              </h3>
              <p className="text-emerald-600 font-bold mb-2">{method.value}</p>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                {method.desc}
              </p>
            </motion.div>
          ))}
        </div>

        {/* 3. Main Contact Area: Form & Map */}
        <div className="grid lg:grid-cols-2 gap-12 bg-white rounded-[3rem] shadow-2xl shadow-slate-200/50 overflow-hidden border border-gray-50">
          {/* Contact Form */}
          <div className="p-8 md:p-12">
            <h2 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-3">
              Send us a Message <Send size={20} className="text-emerald-500" />
            </h2>
            <form className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="Your Name"
                    className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                    Order ID (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="#FS-12345"
                    className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                  Message
                </label>
                <textarea
                  rows="4"
                  placeholder="How can we help you today?"
                  className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all resize-none"
                ></textarea>
              </div>
              <button className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95">
                Send Message
              </button>
            </form>
          </div>

          {/* Sidebar / Info Area */}
          <div className="bg-slate-900 p-8 md:p-12 text-white relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500 rounded-full blur-[100px]" />
            </div>

            <div className="relative z-10 h-full flex flex-col justify-between">
              <div>
                <h3 className="text-2xl font-black mb-8">Quick Support</h3>
                <div className="space-y-8">
                  <div className="flex gap-4">
                    <div className="p-3 bg-white/10 rounded-xl text-emerald-400 h-fit">
                      <Truck size={24} />
                    </div>
                    <div>
                      <p className="font-bold">Track Your Order</p>
                      <p className="text-slate-400 text-sm">
                        Real-time GPS tracking for all NCR deliveries.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="p-3 bg-white/10 rounded-xl text-emerald-400 h-fit">
                      <HelpCircle size={24} />
                    </div>
                    <div>
                      <p className="font-bold">Refund Policy</p>
                      <p className="text-slate-400 text-sm">
                        100% money-back if items are not fresh.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="p-3 bg-white/10 rounded-xl text-emerald-400 h-fit">
                      <MapPin size={24} />
                    </div>
                    <div>
                      <p className="font-bold">Our Hub</p>
                      <p className="text-slate-400 text-sm">
                        Sector 15, Faridabad, Haryana, India
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-12 pt-8 border-t border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                    Current Support Wait Time:{" "}
                    <span className="text-white">~4 mins</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;

