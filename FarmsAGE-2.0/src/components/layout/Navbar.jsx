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
  Package,
  ShieldCheck,
  Store,
  Loader2,
} from "lucide-react";

import { Link, useLocation, useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { getAddressFromCoords } from "../../utils/getAddress";
import { saveAddress } from "../../services/locationServices";
import LocationModal from "../location/LocationModal";

const SEARCH_PLACEHOLDERS = [
  'Search "fresh mangoes"...',
  'Search "farm tomatoes"...',
  'Search "organic honey"...',
  'Search "shimla apples"...',
  'Search "fresh milk"...',
];

const Navbar = React.memo(() => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [locationName, setLocationName] = useState(
    () => localStorage.getItem("detectedLocation") || "Select Location",
  );
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  const routerLocation = useLocation();
  const navigate = useNavigate();
  const { cart } = useCart();
  const { user, logout } = useAuth();

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % SEARCH_PLACEHOLDERS.length);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/category/all?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate(`/category/all`);
    }
  };

  const cartCount = useMemo(
    () => cart.reduce((total, item) => total + item.quantity, 0),
    [cart],
  );

  const cartSubtotal = useMemo(
    () => cart.reduce((total, item) => total + item.price * item.quantity, 0),
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
        <div className="flex items-center gap-2 min-w-0">
          <Link to="/" className="flex items-center gap-1.5 shrink-0 group">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-white rounded-xl flex items-center justify-center overflow-hidden border border-slate-100 shadow-sm group-hover:scale-110 transition-transform duration-300">
              <img
                className="w-full h-full object-cover"
                src={logo}
                alt="FarmsAge Logo"
              />
            </div>
            <h2 className="text-lg sm:text-2xl font-bold tracking-tighter text-slate-800 font-['Outfit'] hidden min-[380px]:block">
              Farms<span className="text-emerald-600 font-extrabold">AGE</span>
            </h2>
          </Link>

          {/* Mobile Blinkit Location Selector Badge */}
          <div
            onClick={() => setIsLocationModalOpen(true)}
            className="flex md:hidden flex-col cursor-pointer px-1 py-0.5 max-w-[135px] min-[390px]:max-w-[170px] min-w-0"
          >
            <span className="text-[8px] font-black uppercase tracking-wider text-emerald-600 flex items-center gap-0.9 leading-none">
              <span>⚡ 30-40 MINS</span>
            </span>
            <div className="flex items-center gap-0.5 text-slate-800 leading-tight mt-0.5">
              <span className="text-[11px] font-black truncate text-slate-900">
                {locationName}
              </span>
              <ChevronDown size={11} className="text-slate-400 shrink-0" />
            </div>
          </div>
        </div>

        {/* Desktop Blinkit Delivery Location Badge */}
        <div
          onClick={() => setIsLocationModalOpen(true)}
          className="hidden md:flex flex-col border-l border-slate-200/80 pl-3.5 ml-1 cursor-pointer group hover:bg-emerald-50/70 px-2 py-1 transition-all rounded-xl border border-transparent hover:border-emerald-100/60 shrink-0"
        >
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-black text-slate-900 uppercase tracking-wider flex items-center gap-0.5">
              <span className="text-emerald-600 font-extrabold">⚡ 30-40 MINS</span>
            </span>
          </div>
          <div className="flex items-center gap-1 text-slate-800">
            <MapPin size={13} className="text-emerald-600 shrink-0" />
            <span className="text-xs font-black truncate max-w-[120px] lg:max-w-[150px]">
              {locationName}
            </span>
            <ChevronDown size={13} className="text-slate-400 group-hover:text-emerald-600 transition-colors" />
          </div>
        </div>

        {/* Desktop Search Bar with Cycling Placeholder */}
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-xl relative group hidden md:block mx-2">
          <Search
            onClick={handleSearchSubmit}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer hover:text-emerald-600 transition-colors"
            size={17}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={SEARCH_PLACEHOLDERS[placeholderIndex]}
            className="w-full bg-slate-100/90 border border-slate-200/60 rounded-2xl py-2.5 sm:py-3 pl-11 pr-4 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500/20 focus:bg-white focus:border-emerald-500 outline-none text-slate-800 font-bold transition-all placeholder:text-slate-400 shadow-inner"
          />
        </form>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* User Profile */}
          {user ? (
            <div className="relative group flex items-center gap-2 font-bold text-slate-700 cursor-pointer py-1">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-extrabold text-xs shadow-sm shrink-0">
                {user.name?.charAt(0).toUpperCase() || <User size={16} />}
              </div>

              <span className="text-xs sm:text-sm font-extrabold truncate max-w-[90px] hidden sm:inline-block">
                {user.name?.split(" ")[0] || "Account"}
              </span>

              {/* Dropdown */}
              <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all flex flex-col overflow-hidden z-50">
                <div className="p-3 border-b border-slate-50 bg-slate-50/50">
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">
                    Logged in as
                  </p>
                  <p className="text-xs font-bold truncate mt-0.5 text-slate-800">
                    {user.email || user.phone}
                  </p>
                </div>
                <Link
                  to="/my-orders"
                  className="px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Package size={14} className="text-emerald-600" />
                  <span>My Orders</span>
                </Link>
                <button
                  onClick={logout}
                  className="w-full text-left px-4 py-2.5 text-xs font-black text-rose-500 hover:bg-rose-50 transition-colors border-t border-slate-50"
                >
                  Logout Account
                </button>
              </div>
            </div>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-1.5 font-extrabold text-slate-700 hover:text-emerald-600 px-2 py-1.5 rounded-xl hover:bg-slate-50 transition"
            >
              <User size={18} />
              <span className="text-xs sm:text-sm">Login</span>
            </Link>
          )}

          {/* Orders */}
          {user && !routerLocation.pathname.startsWith("/admin") && (
            <Link
              to="/my-orders"
              className="hidden lg:flex items-center gap-1.5 font-extrabold text-slate-700 hover:text-emerald-600 px-2 py-1.5 rounded-xl hover:bg-slate-50 transition"
            >
              <Package size={18} />
              <span className="text-xs sm:text-sm">Orders</span>
            </Link>
          )}

          {/* Admin */}
          {user?.role?.toLowerCase() === "admin" && (
            <Link
              to="/admin"
              className="hidden md:flex items-center gap-1.5 font-black text-amber-600 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200/60 text-xs"
            >
              <ShieldCheck size={16} />
              <span>Admin</span>
            </Link>
          )}

          {/* Vendor */}
          {user?.role?.toLowerCase() === "vendor" && (
            <Link
              to="/vendor"
              className="hidden md:flex items-center gap-1.5 font-black text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200/60 text-xs"
            >
              <Store size={16} />
              <span>Vendor</span>
            </Link>
          )}

          {/* Blinkit-Style Cart Button */}
          {/* {!routerLocation.pathname.startsWith("/admin") && (
            <Link
              to="/cart"
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl shadow-md shadow-emerald-600/20 active:scale-95 transition-all group"
            >
              <div className="relative">
                <ShoppingCart size={18} className="group-hover:scale-110 transition-transform" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-amber-400 text-slate-950 text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-white">
                    {cartCount}
                  </span>
                )}
              </div>
              <div className="flex flex-col text-left leading-none">
                <span className="text-[10px] font-extrabold text-emerald-100 uppercase tracking-wider">
                  {cartCount > 0 ? `${cartCount} items` : "My Cart"}
                </span>
                <span className="text-xs font-black text-white mt-0.5">
                  {cartCount > 0 ? `₹${cartSubtotal}` : "₹0"}
                </span>
              </div>
            </Link>
          )} */}

          {/* Mobile toggle */}
          <button
            className="md:hidden p-1.5 text-slate-800 rounded-xl hover:bg-slate-100 transition"
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Sticky Search Bar (Always visible on mobile viewports) */}
      <div className="md:hidden px-3 pt-2 pb-1 bg-white border-t border-slate-100/60">
        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <Search
            onClick={handleSearchSubmit}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer hover:text-emerald-600"
            size={16}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={SEARCH_PLACEHOLDERS[placeholderIndex]}
            className="w-full bg-slate-100/90 border border-slate-200/80 rounded-xl py-2 pl-9 pr-8 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white focus:border-emerald-500 transition-all placeholder:text-slate-400 shadow-inner"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X size={14} />
            </button>
          )}
        </form>
      </div>

      {/* Mobile Drawer - Ultra-Modern Customer Slide-Out Sidebar */}
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[140] md:hidden transition-opacity duration-300"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 left-0 bottom-0 w-[85%] max-w-[340px] bg-white z-[150] md:hidden flex flex-col shadow-2xl transform transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
          <Link to="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
            <div className="w-8 h-8 rounded-xl overflow-hidden border border-emerald-500/30 shadow-md">
              <img src={logo} alt="FarmsAge" className="w-full h-full object-cover" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-white font-['Outfit']">
                Farms<span className="text-emerald-400">AGE</span>
              </h2>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                Fresh Marketplace
              </p>
            </div>
          </Link>
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 bg-slate-800 text-slate-300 hover:text-white rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* User Profile Card */}
          {user ? (
            <div className="p-3.5 bg-gradient-to-r from-emerald-900 to-teal-900 text-white rounded-2xl shadow-md border border-emerald-700/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 font-black flex items-center justify-center text-sm shadow-md shrink-0">
                  {user.name?.charAt(0).toUpperCase() || "U"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-extrabold text-xs text-white truncate">{user.name || "Customer Account"}</p>
                  <p className="text-[10px] text-emerald-200 truncate">{user.email || user.phone}</p>
                  <span className="inline-block text-[9px] font-black uppercase tracking-wider text-amber-300 bg-amber-400/20 px-1.5 py-0.5 rounded mt-1 border border-amber-400/30">
                    {user.role || "Member"}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100/80 text-center">
              <p className="text-xs font-bold text-slate-700 mb-1">Welcome to FarmsAGE 🌿</p>
              <p className="text-[11px] text-slate-500 mb-3">Sign in for exclusive daily deals & fast 1-click order</p>
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition"
              >
                <User size={15} /> Login / Register Account
              </Link>
            </div>
          )}

          {/* Search Input */}
          <form onSubmit={(e) => { handleSearchSubmit(e); setOpen(false); }} className="relative">
            <Search
              onClick={(e) => { handleSearchSubmit(e); setOpen(false); }}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer hover:text-emerald-600 transition"
              size={16}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search mangoes, coconuts, tomatoes..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-3 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition font-medium"
            />
          </form>

          {/* Location Bar */}
          <button
            onClick={() => {
              setIsLocationModalOpen(true);
              setOpen(false);
            }}
            className="w-full p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-100 flex items-center justify-between text-left transition"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                <MapPin size={16} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Delivery Location</p>
                <p className="text-xs font-bold text-slate-800 truncate max-w-[170px]">{locationName}</p>
              </div>
            </div>
            <ChevronDown size={14} className="text-slate-400" />
          </button>

          {/* Categories Grid */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2.5 px-1">
              Shop Categories
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Link
                to="/category/fruits"
                onClick={() => setOpen(false)}
                className="p-3 bg-rose-50/80 hover:bg-rose-100 border border-rose-100 rounded-xl flex items-center gap-2.5 transition group"
              >
                <span className="text-lg group-hover:scale-110 transition-transform">🍎</span>
                <div>
                  <p className="text-xs font-bold text-rose-900">Fresh Fruits</p>
                  <p className="text-[9px] text-rose-600/80 font-medium">Sweet & Juicy</p>
                </div>
              </Link>

              <Link
                to="/category/vegetables"
                onClick={() => setOpen(false)}
                className="p-3 bg-emerald-50/80 hover:bg-emerald-100 border border-emerald-100 rounded-xl flex items-center gap-2.5 transition group"
              >
                <span className="text-lg group-hover:scale-110 transition-transform">🥬</span>
                <div>
                  <p className="text-xs font-bold text-emerald-900">Veggies</p>
                  <p className="text-[9px] text-emerald-600/80 font-medium">Farm Direct</p>
                </div>
              </Link>

              <Link
                to="/category/organic"
                onClick={() => setOpen(false)}
                className="p-3 bg-amber-50/80 hover:bg-amber-100 border border-amber-100 rounded-xl flex items-center gap-2.5 transition group"
              >
                <span className="text-lg group-hover:scale-110 transition-transform">🍯</span>
                <div>
                  <p className="text-xs font-bold text-amber-900">Organic</p>
                  <p className="text-[9px] text-amber-600/80 font-medium">100% Pure</p>
                </div>
              </Link>

              <Link
                to="/category/all"
                onClick={() => setOpen(false)}
                className="p-3 bg-blue-50/80 hover:bg-blue-100 border border-blue-100 rounded-xl flex items-center gap-2.5 transition group"
              >
                <span className="text-lg group-hover:scale-110 transition-transform">🛒</span>
                <div>
                  <p className="text-xs font-bold text-blue-900">All Items</p>
                  <p className="text-[9px] text-blue-600/80 font-medium">Full Catalog</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Main Navigation Links */}
          <div className="space-y-1 pt-2 border-t border-slate-100">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">
              Menu Links
            </p>

            <Link
              to="/home"
              onClick={() => setOpen(false)}
              className="flex items-center justify-between p-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              <span>Store Homepage</span>
              <ChevronDown size={14} className="-rotate-90 text-slate-400" />
            </Link>

            {user && (
              <Link
                to="/my-orders"
                onClick={() => setOpen(false)}
                className="flex items-center justify-between p-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                <div className="flex items-center gap-2.5">
                  <Package size={16} className="text-emerald-600" />
                  <span>My Orders</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">
                  History
                </span>
              </Link>
            )}

            {user?.role?.toLowerCase() === "admin" && (
              <Link
                to="/admin"
                onClick={() => setOpen(false)}
                className="flex items-center justify-between p-2.5 rounded-xl text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 transition"
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck size={16} />
                  <span>Admin Panel Console</span>
                </div>
                <ChevronDown size={14} className="-rotate-90 text-amber-500" />
              </Link>
            )}

            {user?.role?.toLowerCase() === "vendor" && (
              <Link
                to="/vendor"
                onClick={() => setOpen(false)}
                className="flex items-center justify-between p-2.5 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 transition"
              >
                <div className="flex items-center gap-2.5">
                  <Store size={16} />
                  <span>Vendor Dashboard</span>
                </div>
                <ChevronDown size={14} className="-rotate-90 text-emerald-600" />
              </Link>
            )}

            <Link
              to="/contact"
              onClick={() => setOpen(false)}
              className="flex items-center justify-between p-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              <span>Contact & Support</span>
              <ChevronDown size={14} className="-rotate-90 text-slate-400" />
            </Link>
          </div>
        </div>

        {/* Footer Logout / Auth Button */}
        <div className="p-4 border-t border-slate-100 bg-white">
          {user ? (
            <button
              onClick={() => {
                logout();
                setOpen(false);
              }}
              className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border border-rose-100 transition"
            >
              Log Out Account
            </button>
          ) : (
            <Link
              to="/login"
              onClick={() => setOpen(false)}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center shadow-md transition"
            >
              Login / Sign Up
            </Link>
          )}
        </div>
      </div>

      {/* Blinkit Location Selector Modal */}
      <LocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        onSelectLocation={(data) => {
          setLocationName(data.street || data.city);
        }}
        currentLocationName={locationName}
      />
    </nav>
  );
});

export default Navbar;
