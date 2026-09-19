import React from "react";
import {
  Mail,
  Phone,
  MapPin,
  Facebook,
  Instagram,
  Twitter,
  Send,
  Download,
} from "lucide-react";
import { Link } from "react-router-dom";
import logo from "../../assets/logo.jpg";

const Footer = () => {
  return (
    <footer className="relative bg-[#0B1221] text-gray-400 pt-4 pb-16 md:pb-4 overflow-hidden border-t border-slate-800/40 text-xs">
      {/* Decorative Subtle Element */}
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-48 h-48 bg-emerald-500/5 blur-[80px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        {/* Top Section: Compact Newsletter Row */}
        {/* <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/60 mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse hidden sm:inline-block" /> */}
            {/* <div>
              <h3 className="text-sm font-bold text-white tracking-tight leading-tight">
                Join our Green Newsletter
              </h3>
              <p className="text-[11px] text-gray-400">
                Get 20% off your 1st order & instant local vendor alerts.
              </p>
            </div> */}
          {/* </div> */}
          {/* <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="email"
              placeholder="Enter email address"
              className="w-full sm:w-56 bg-slate-800/50 border border-slate-700/80 rounded-lg py-1.5 px-3 focus:outline-none focus:border-emerald-500 text-white text-xs placeholder:text-gray-500 transition-all"
            />
            <button className="bg-emerald-600 hover:bg-emerald-500 text-white py-1.5 px-3.5 rounded-lg transition-all flex items-center justify-center gap-1.5 font-semibold text-xs shrink-0 shadow-sm shadow-emerald-950">
              <Send size={12} /> Subscribe
            </button>
          </div> */}
        {/* </div> */}

        {/* Main Compact Footer Content */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 items-start">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-1 space-y-2">
            <div className="flex items-center gap-2 font-['Outfit']">
              <div className="w-9 h-9 rounded-lg overflow-hidden border border-white/10 flex-shrink-0">
                <img src={logo} alt="FarmsAge Logo" className="w-full h-full object-cover" />
              </div>
              <h2 className="text-base text-[20px] font-bold text-white tracking-tight">
                Farms<span className="text-emerald-500">AGE</span>
              </h2>
            </div>
            <p className="text-[12px] leading-snug text-gray-400 max-w-xs">
              Direct neighborhood markets. No middlemen, fair prices, instant delivery.
            </p>
            <div className="flex gap-2 pt-0.5">
              {[Instagram, Facebook, Twitter].map((Icon, index) => (
                <a
                  key={index}
                  href="#"
                  className="w-6 h-6 rounded-md bg-slate-800/60 flex items-center justify-center hover:bg-emerald-600 hover:text-white text-gray-400 transition-all"
                >
                  <Icon size={13} />
                </a>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-white font-bold text-[11px] uppercase tracking-wider mb-2 text-slate-300">
              Categories
            </h3>
            <ul className="space-y-1 text-[11px]">
              {[
                "Fresh Vegetables",
                "Seasonal Fruits",
                "Organic Specials",
                "Dairy & Eggs",
              ].map((item) => (
                <li key={item}>
                  <Link
                    to="#"
                    className="hover:text-emerald-400 transition-all text-gray-400"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-white font-bold text-[11px] uppercase tracking-wider mb-2 text-slate-300">
              Support
            </h3>
            <ul className="space-y-1 text-[11px]">
              {[
                "Track Order",
                "Shipping Info",
                "Returns Policy",
                "Privacy Policy",
              ].map((item) => (
                <li key={item}>
                  <Link
                    to="#"
                    className="hover:text-emerald-400 transition-all text-gray-400"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Mobile Apps */}
          {/* <div className="col-span-2 md:col-span-1">
            <h3 className="text-white font-bold text-[11px] uppercase tracking-wider mb-2 text-slate-300">
              Get App
            </h3>
            <div className="flex flex-row md:flex-col gap-1.5">
              <button className="flex-1 flex items-center gap-2 bg-slate-800/40 border border-slate-700/60 py-1 px-2.5 rounded-md hover:border-emerald-500/50 transition-all text-left">
                <Download size={13} className="text-emerald-500 shrink-0" />
                <span className="text-[10px] font-semibold text-gray-200">App Store</span>
              </button>
              <button className="flex-1 flex items-center gap-2 bg-slate-800/40 border border-slate-700/60 py-1 px-2.5 rounded-md hover:border-emerald-500/50 transition-all text-left">
                <Download size={13} className="text-emerald-500 shrink-0" />
                <span className="text-[10px] font-semibold text-gray-200">Google Play</span>
              </button>
            </div>
          </div> */}
        </div>

        {/* Bottom Bar: Contact & Copyright */}
        <div className="mt-4 pt-3 border-t border-slate-800/60 flex flex-col md:flex-row justify-between items-center gap-2 text-[10px] text-gray-400">
          <div className="flex flex-wrap justify-center gap-4 text-[10px]">
            <span className="flex items-center gap-1">
              <MapPin className="text-emerald-500 shrink-0" size={12} /> Bulandshahr 203001 , UP
            </span>
            <span className="flex items-center gap-1">
              <Phone className="text-emerald-500 shrink-0" size={12} /> +91 98765 43210
            </span>
            <span className="flex items-center gap-1">
              <Mail className="text-emerald-500 shrink-0" size={12} /> support@farmsage.com
            </span>
          </div>

          <div className="flex items-center gap-3">
            <p className="opacity-70">© 2026 FarmsAGE Marketplace.</p>
            <div className="hidden sm:flex gap-2 opacity-40">
              {["PayPal", "Visa", "Mastercard"].map((brand) => (
                <span key={brand} className="uppercase tracking-wider text-[8px] font-mono">
                  {brand}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
