import React, { useState, useEffect } from "react";
import logo from "../../assets/logo.jpg"

import {
  ShoppingCart,
  Menu,
  X,
  MapPin,
  User,
  Search,
  ChevronDown,
  Leaf,
  Package
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [locationName, setLocationName] = useState("Bulandshahr");
  const routerLocation = useLocation();
  const { cart } = useCart();
  const { user, logout } = useAuth();
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

  // Change navbar style on scroll
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => setOpen(false), [routerLocation]);

  return (
    <nav
      className={`w-full z-[110] transition-all duration-300 relative ${
        scrolled
          ? "bg-white/90 backdrop-blur-md shadow-lg py-2"
          : "bg-white py-4"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between gap-4">
        {/* 1. Logo Section */}
        <Link to="/" className="flex items-center gap-2 shrink-0 group">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center rotate-3 group-hover:rotate-0 transition-transform duration-300 shadow-lg shadow-emerald-200">
            {/* <Leaf className="text-white" size={22} /> */}
            <img  className="w-10 h-10 rounded-full bg-white"  src={logo} alt="" />
          </div>
          <h2 className="text-2xl font-black tracking-tighter text-slate-800 hidden sm:block">
            Farms<span className="text-emerald-600">Age</span>
          </h2>
        </Link>

        {/* 2. Delivery Location (Desktop) */}
        <div className="hidden lg:flex flex-col border-l border-gray-200 pl-4 ml-2 cursor-pointer group">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter leading-none">
            Delivery in 30 mins
          </span>
          <div className="flex items-center gap-1 text-slate-800">
            <span className="text-sm font-bold truncate max-w-[120px]">
              {locationName}
            </span>
            <ChevronDown
              size={14}
              className="text-emerald-600 group-hover:translate-y-0.5 transition-transform"
            />
          </div>
        </div>

        {/* 3. Central Search Bar (The "Hero" of the Navbar) */}
        <div className="flex-1 max-w-2xl relative group hidden md:block">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-600 transition-colors">
            <Search size={18} />
          </div>
          <input
            type="text"
            placeholder='Search "fresh mangoes" or "organic milk"'
            className="w-full bg-gray-100 border-none rounded-2xl py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all outline-none text-slate-700"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden lg:block">
            <span className="text-[10px] font-bold bg-white px-2 py-1 rounded-md border border-gray-200 text-gray-400">
              ⌘ K
            </span>
          </div>
        </div>

        {/* 4. Action Icons */}
        <div className="flex items-center gap-2 sm:gap-6">
          {user ? (
            <div className="relative group hidden sm:flex items-center gap-2 font-bold text-slate-700 cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                <User size={16} />
              </div>
              <span className="text-sm truncate max-w-[100px]">{user.name || "User"}</span>
              <ChevronDown size={14} className="text-slate-400 group-hover:-rotate-180 transition-transform" />
              
              {/* Dropdown menu */}
              <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all flex flex-col overflow-hidden z-50">
                <div className="p-3 border-b border-slate-50">
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Logged in as</p>
                   <p className="text-sm truncate mt-1 text-slate-800">{user.phone}</p>
                </div>
                <button 
                  onClick={logout}
                  className="w-full text-left px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <Link
              to="/login"
              className="hidden sm:flex items-center gap-2 font-bold text-slate-700 hover:text-emerald-600 transition-colors"
            >
              <User size={20} />
              <span className="text-sm">Login</span>
            </Link>
          )}
          
          {user && (
            <Link
              to="/my-orders"
              className="hidden lg:flex items-center gap-2 font-bold text-slate-700 hover:text-emerald-600 transition-colors"
            >
              <Package size={20} />
              <span className="text-sm">My Orders</span>
            </Link>
          )}

          <Link
            to="/cart"
            className="relative p-3 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 group"
          >
            <div className="flex items-center gap-2">
              <ShoppingCart size={20} className="group-hover:shake" />
              <span className="text-sm font-bold hidden md:block">My Cart</span>
            </div>
            <span className="absolute -top-1 -right-1 bg-amber-400 text-slate-900 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
              {cartCount}
            </span>
          </Link>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2 text-slate-800"
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* 5. Mobile Search (Visible only on mobile) */}
      <div className="px-4 mt-2 md:hidden">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={16}
          />
          <input
            type="text"
            placeholder="Search for groceries..."
            className="w-full bg-gray-100 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none"
          />
        </div>
      </div>

      {/* 6. Mobile Drawer with Slide-in Animation */}
      <div
        className={`fixed inset-0 top-[110px] bg-white z-[100] transition-transform duration-500 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        } md:hidden`}
      >
        <div className="p-6 flex flex-col gap-6 font-bold text-xl text-slate-800">
          <Link to="/home">Home</Link>
          <Link to="/my-orders">My Orders</Link>
          <Link to="/category/fruits">Seasonal Fruits</Link>
          <Link to="/category/vegetables">Fresh Vegetables</Link>
          <Link to="/category/dairy">Dairy Products</Link>
          <Link to="/category/organic">Organic Selection</Link>
          <Link to="/offers">Daily Deals</Link>
          <Link to="/contact">Help & Support</Link>
          <hr />
          <div className="flex items-center gap-3 text-emerald-600 text-sm">
            <MapPin size={18} />
            <span>Deliver to: {locationName}</span>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
