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
    <footer className="relative bg-[#0B1221] text-gray-400 pt-6 pb-4 overflow-hidden">
      {/* Decorative Element - Reduced size to prevent scroll issues */}
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-64 h-64 bg-emerald-500/5 blur-[100px] rounded-full" />

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        {/* Top Section: Compact Newsletter */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-800/60 mb-6">
          <div>
            <h3 className="text-xl font-bold text-white">
              Join our Green Newsletter
            </h3>
            <p className="text-sm text-gray-400">
              20% off your first order & local vendor alerts.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full lg:w-64 bg-slate-800/50 border border-slate-700 rounded-xl py-2 px-4 focus:outline-none focus:border-emerald-500 transition-all text-white text-sm"
            />
            <button className="bg-emerald-600 hover:bg-emerald-500 text-white py-2 px-6 rounded-xl transition-all flex items-center justify-center gap-2 font-semibold text-sm">
              <Send size={14} /> Subscribe
            </button>
          </div>
        </div>

        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Column */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 group cursor-pointer font-['Outfit']">
              <div className="w-9 h-9 rounded-xl overflow-hidden border border-white/10 flex-shrink-0">
                <img src={logo} alt="FarmsAge Logo" className="w-full h-full object-cover" />
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Farms<span className="text-emerald-500">AGE</span>
              </h2>
            </div>
            <p className="text-xs leading-relaxed text-gray-400 max-w-xs">
              Direct neighborhood markets. No warehouses, no middlemen. Fair
              prices, instant delivery.
            </p>
            <div className="flex gap-3">
              {[Instagram, Facebook, Twitter].map((Icon, index) => (
                <a
                  key={index}
                  href="#"
                  className="w-7 h-7 rounded-lg bg-slate-800/50 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Categories & Support - SIDE BY SIDE ON MOBILE */}
          <div className="col-span-1 md:col-span-2 grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-white font-bold mb-3 text-sm">Categories</h3>
              <ul className="space-y-1.5 text-xs">
                {[
                  "Fresh Vegetables",
                  "Seasonal Fruits",
                  "Organic Specials",
                  "Dairy & Eggs",
                ].map((item) => (
                  <li key={item}>
                    <Link
                      to="#"
                      className="hover:text-emerald-500 transition-all"
                    >
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-white font-bold mb-3 text-sm">Support</h3>
              <ul className="space-y-1.5 text-xs">
                {[
                  "Track Order",
                  "Shipping Info",
                  "Returns",
                  "Privacy Policy",
                ].map((item) => (
                  <li key={item}>
                    <Link
                      to="#"
                      className="hover:text-emerald-500 transition-all"
                    >
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* App Download */}
          <div className="flex flex-row md:flex-col gap-2">
            <button className="flex-1 flex items-center gap-2 bg-slate-800/50 border border-slate-700 p-2 rounded-lg transition-all">
              <Download size={16} className="text-emerald-500" />
              <div className="text-left">
                <p className="text-[10px] font-bold text-white">App Store</p>
              </div>
            </button>
            <button className="flex-1 flex items-center gap-2 bg-slate-800/50 border border-slate-700 p-2 rounded-lg transition-all">
              <Download size={16} className="text-emerald-500" />
              <div className="text-left">
                <p className="text-[10px] font-bold text-white">Google Play</p>
              </div>
            </button>
          </div>
        </div>

        {/* Bottom Bar: Merged Contact & Copyright */}
        <div className="mt-8 pt-4 border-t border-slate-800/60 flex flex-col lg:flex-row justify-between items-center gap-4 text-[11px]">
          <div className="flex flex-wrap justify-center gap-6">
            <div className="flex items-center gap-2">
              <MapPin className="text-emerald-500" size={14} />{" "}
              <span>Sector 15, NCR, India</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="text-emerald-500" size={14} />{" "}
              <span>+91 98765 43210</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="text-emerald-500" size={14} />{" "}
              <span>support@farmsage.com</span>
            </div>
          </div>

          <p className="font-medium opacity-60">© 2026 FarmSage Marketplace.</p>

          <div className="flex gap-4 opacity-40">
            {["PayPal", "Visa", "Mastercard"].map((brand) => (
              <span
                key={brand}
                className="uppercase tracking-widest text-[9px]"
              >
                {brand}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
