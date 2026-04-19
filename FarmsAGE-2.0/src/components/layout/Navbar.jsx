import React, { useState, useEffect, useMemo } from "react";
import logo from "../../assets/logo.jpg";

import {
  ShoppingCart,
  Menu,
  X,
  MapPin,
  User,
  Search,
  ChevronDown,
  Leaf,
  Package,
  ShieldCheck,
  Store,
  Loader2,
} from "lucide-react";

import { Link, useLocation } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { getAddressFromCoords } from "../../utils/getAddress";
import { saveAddress } from "../../services/locationServices";

const Navbar = React.memo(() => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [locationName, setLocationName] = useState(
    () => localStorage.getItem("detectedLocation") || "Detect Location",
  );
  const [loadingLocation, setLoadingLocation] = useState(false);

  const routerLocation = useLocation();
  const { cart } = useCart();
  const { user, logout } = useAuth();

  const cartCount = useMemo(
    () => cart.reduce((total, item) => total + item.quantity, 0),
    [cart],
  );

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => setOpen(false), [routerLocation]);

  useEffect(() => {
    if (!user) {
      localStorage.removeItem("detectedLocation");
      setLocationName("Detect Location");
    }
  }, [user]);

  const handleDetectLocation = () => {
    setLoadingLocation(true);

    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      setLoadingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const addressData = await getAddressFromCoords(latitude, longitude);

          if (addressData) {
            const locName = addressData.city || addressData.fullAddress;
            setLocationName(locName);
            localStorage.setItem("detectedLocation", locName);

            if (user) {
              await saveAddress({
                address: addressData.fullAddress,
                latitude,
                longitude,
              });
            }
          }
        } catch (err) {
          console.error("Location error:", err);
        } finally {
          setLoadingLocation(false);
        }
      },
      (err) => {
        console.error(err);
        alert("Unable to fetch location");
        setLoadingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
    );
  };

  return (
    <nav
      className={`w-full z-[110] transition-all duration-300 sticky top-0 ${
        scrolled
          ? "bg-white/90 backdrop-blur-md shadow-lg py-1.5"
          : "bg-white py-2.5 border-b border-gray-50"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0 group">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center overflow-hidden border border-slate-100 shadow-sm group-hover:scale-110 transition-transform duration-300">
            <img
              className="w-full h-full object-cover"
              src={logo}
              alt="FarmsAge Logo"
            />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tighter text-slate-800 font-['Outfit']">
            Farms<span className="text-emerald-600 font-extrabold">AGE</span>
          </h2>
        </Link>

        {/* Location */}
        <div
          onClick={handleDetectLocation}
          className="hidden lg:flex flex-col border-l border-gray-200 pl-4 ml-2 cursor-pointer group hover:bg-emerald-50/50 py-1 transition-colors rounded-r-lg"
        >
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter leading-none">
            {loadingLocation ? "Detecting..." : "Direct from Local Vendors"}
          </span>
          <div className="flex items-center gap-1 text-slate-800">
            {loadingLocation ? (
              <Loader2 size={14} className="animate-spin text-emerald-600" />
            ) : (
              <MapPin size={14} className="text-emerald-600" />
            )}
            <span className="text-sm font-bold truncate max-w-[120px]">
              {locationName}
            </span>
            <ChevronDown size={14} className="text-emerald-600" />
          </div>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-2xl relative group hidden md:block">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            placeholder='Search "fresh mangoes" or "organic milk"'
            className="w-full bg-gray-100 border-none rounded-2xl py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:bg-white outline-none text-slate-700"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-6">
          {/* User */}
          {user ? (
            <div className="relative group flex items-center gap-2 font-bold text-slate-700 cursor-pointer">
              {/* FIXED size */}
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                <User size={16} />
              </div>

              <span className="text-sm truncate max-w-[100px]">
                {user.name || "User"}
              </span>

              {/* Dropdown */}
              <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all flex flex-col overflow-hidden z-50">
                <div className="p-3 border-b border-slate-50">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    Logged in as
                  </p>
                  <p className="text-sm truncate mt-1 text-slate-800">
                    {user.email || user.phone}
                  </p>
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
              className="flex items-center gap-2 font-bold text-slate-700 hover:text-emerald-600"
            >
              <User size={20} />
              <span className="text-sm">Login</span>
            </Link>
          )}

          {/* Orders */}
          {user && !routerLocation.pathname.startsWith("/admin") && (
            <Link
              to="/my-orders"
              className="hidden lg:flex items-center gap-2 font-bold text-slate-700 hover:text-emerald-600"
            >
              <Package size={20} />
              <span className="text-sm">My Orders</span>
            </Link>
          )}

          {/* Admin */}
          {user?.role?.toLowerCase() === "admin" && (
            <Link
              to="/admin"
              className="hidden md:flex items-center gap-2 font-bold text-amber-600"
            >
              <ShieldCheck size={18} />
              <span className="text-sm">Admin Panel</span>
            </Link>
          )}

          {/* Vendor */}
          {user?.role?.toLowerCase() === "vendor" && (
            <Link
              to="/vendor"
              className="hidden md:flex items-center gap-2 font-bold text-emerald-700"
            >
              <Store size={18} />
              <span className="text-sm">Vendor Panel</span>
            </Link>
          )}

          {/* Cart */}
          {!routerLocation.pathname.startsWith("/admin") && (
            <Link
              to="/cart"
              className="relative p-3 bg-emerald-600 text-white rounded-2xl"
            >
              <ShoppingCart size={12} className="group-hover:animate-bounce" />
              <span className="absolute -top-1 -right-1 bg-amber-400 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                {cartCount}
              </span>
            </Link>
          )}

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 text-slate-800"
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer FIXED */}
      <div
        className={`fixed inset-0 top-[120px] bg-white z-[100] transition-transform duration-500 ${
          open ? "translate-x-0" : "translate-x-full"
        } md:hidden overflow-y-auto pb-24`}
      >
        <div className="p-6 flex flex-col gap-6 font-bold text-xl text-slate-800">
          <Link to="/home">Home</Link>
          {user && <Link to="/my-orders">My Orders</Link>}
          {user?.role?.toLowerCase() === "admin" && (
            <Link to="/admin">Admin</Link>
          )}
          {user?.role?.toLowerCase() === "vendor" && (
            <Link to="/vendor">Vendor</Link>
          )}
          {!user && <Link to="/login">Login</Link>}

          <button
            onClick={handleDetectLocation}
            className="flex items-center gap-2 text-emerald-600"
          >
            <MapPin size={18} />
            {locationName}
          </button>
        </div>
      </div>
    </nav>
  );
});

export default Navbar;
