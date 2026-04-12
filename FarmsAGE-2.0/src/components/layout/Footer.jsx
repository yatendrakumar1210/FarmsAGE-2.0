import React from "react";
import {
  Mail,
  Phone,
  MapPin,
  Facebook,
  Instagram,
  Twitter,
  Leaf,
  Send,
  Download,
} from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="relative bg-[#0B1221] text-gray-400 pt-20 pb-10 overflow-hidden">
      {/* Decorative Background Element */}
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-96 h-96 bg-emerald-500/5 blur-[120px] rounded-full" />

      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 relative z-10">
        {/* Top Section: Newsletter */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-10 md:gap-12 pb-12 sm:pb-14 md:pb-16 border-b border-slate-800/60 mb-12 sm:mb-14 md:mb-16 items-center">
          <div className="lg:col-span-2">
            <h3 className="text-2xl font-bold text-white mb-2">
              Join our Green Newsletter
            </h3>
            <p className="text-gray-400">
              Get 20% off your first order and stay updated with seasonal
              harvest alerts.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full">
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full sm:flex-1 min-w-0 bg-slate-800/50 border border-slate-700 rounded-2xl py-4 px-6 focus:outline-none focus:border-emerald-500 transition-all text-white"
            />
            <button className="bg-emerald-600 hover:bg-emerald-500 text-white py-4 px-8 rounded-2xl transition-all flex items-center justify-center gap-2 font-semibold whitespace-nowrap">
              <Send size={16} />
              Subscribe
            </button>
          </div>
        </div>

        {/* Main Footer Content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 md:gap-12 lg:gap-8">
          {/* Brand Column */}
          <div className="space-y-4 sm:space-y-5 md:space-y-6">
            <div className="flex items-center gap-2 group cursor-pointer font-['Outfit']">
              <div className="p-2 bg-emerald-500/10 rounded-lg group-hover:bg-emerald-500/20 transition-all">
                <Leaf className="text-emerald-500" size={24} />
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                farms
                <span className="text-emerald-500 font-extrabold uppercase">
                  age
                </span>
              </h2>
            </div>
            <p className="text-sm leading-relaxed text-gray-400">
              Revolutionizing the way you buy groceries. From the rich soils of
              Indian farms directly to your doorstep within 60 minutes. Pure.
              Organic. Handpicked.
            </p>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {[Instagram, Facebook, Twitter].map((Icon, index) => (
                <a
                  key={index}
                  href="#"
                  className="w-10 h-10 rounded-xl bg-slate-800/50 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all duration-300"
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links - Categorized better */}
          <div className="lg:ml-8">
            <h3 className="text-white font-bold mb-6 text-lg">Categories</h3>
            <ul className="space-y-4 text-sm">
              {[
                "Fresh Vegetables",
                "Seasonal Fruits",
                "Organic Specials",
                "Dairy & Eggs",
                "Daily Deals",
              ].map((item) => (
                <li key={item}>
                  <Link
                    to="#"
                    className="hover:text-emerald-500 hover:translate-x-2 transition-all inline-block"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-white font-bold mb-6 text-lg">Support</h3>
            <ul className="space-y-4 text-sm">
              {[
                "Track Your Order",
                "Shipping Information",
                "Returns & Refunds",
                "Privacy Policy",
                "Terms of Service",
              ].map((item) => (
                <li key={item}>
                  <Link
                    to="#"
                    className="hover:text-emerald-500 hover:translate-x-2 transition-all inline-block"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Download App & Contact */}
          <div className="space-y-8">
            <div>
              <h3 className="text-white font-bold mb-4 text-lg">
                Experience FarmsAge App
              </h3>
              <div className="flex flex-col gap-3">
                <button className="flex items-center gap-3 bg-slate-800/50 hover:bg-slate-700 border border-slate-700 p-3 rounded-xl transition-all">
                  <Download size={20} className="text-emerald-500" />
                  <div className="text-left">
                    <p className="text-[10px] uppercase leading-none">
                      Download on
                    </p>
                    <p className="text-sm font-bold text-white">App Store</p>
                  </div>
                </button>
                <button className="flex items-center gap-3 bg-slate-800/50 hover:bg-slate-700 border border-slate-700 p-3 rounded-xl transition-all">
                  <Download size={20} className="text-emerald-500" />
                  <div className="text-left">
                    <p className="text-[10px] uppercase leading-none">
                      Get it on
                    </p>
                    <p className="text-sm font-bold text-white">Google Play</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Strip */}
        <div className="mt-12 sm:mt-14 md:mt-16 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 p-4 sm:p-6 md:p-8 bg-slate-800/30 rounded-2xl sm:rounded-3xl border border-slate-800/50">
          <div className="flex items-center gap-4 px-2 sm:px-4 border-b md:border-b-0 md:border-r border-slate-800/50 pb-6 md:pb-0 md:pr-10 w-full md:flex-1">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
              <MapPin className="text-emerald-500" size={18} />
            </div>
            <p className="text-sm">Sector 15, NCR Region, India</p>
          </div>
          <div className="flex items-center gap-4 px-2 sm:px-4 border-b md:border-b-0 md:border-r border-slate-800/50 pb-6 md:pb-0 md:pr-10 w-full md:flex-1">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
              <Phone className="text-emerald-500" size={18} />
            </div>
            <p className="text-sm">+91 98765 43210</p>
          </div>
          <div className="flex items-center gap-4 px-2 sm:px-4 w-full md:flex-1">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
              <Mail className="text-emerald-500" size={18} />
            </div>
            <p className="text-sm">support@farmsage.com</p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 sm:mt-12 pt-6 sm:pt-8 border-t border-slate-800/60 flex flex-col md:flex-row justify-between items-center gap-4 sm:gap-6 text-center md:text-left">
          <p className="text-sm font-medium">
            © 2026 FarmsAge Marketplace. Built for a Greener India.
          </p>
          <div className="flex flex-wrap items-center justify-center md:justify-end gap-4 sm:gap-6 md:gap-8 opacity-40 hover:opacity-100 transition-opacity">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg"
              alt="PayPal"
              className="h-4 grayscale"
            />
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg"
              alt="Visa"
              className="h-3 grayscale"
            />
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg"
              alt="Mastercard"
              className="h-5 grayscale"
            />
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

