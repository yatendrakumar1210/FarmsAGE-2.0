import React, { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  LayoutDashboard,
  ShoppingBasket,
  ShoppingCart,
  Users,
  LogOut,
  Menu,
  X,
  Store,
  Sparkles,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import logo from "../../assets/logo.jpg";
import "./admin.css";

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Auto-close sidebar on mobile route change
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = [
    {
      to: "/admin/dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard size={19} />,
      badge: null,
    },
    {
      to: "/admin/products",
      label: "Products Catalog",
      icon: <ShoppingBasket size={19} />,
      badge: "Manage",
    },
    {
      to: "/admin/orders",
      label: "Customer Orders",
      icon: <ShoppingCart size={19} />,
      badge: "Live",
    },
    {
      to: "/admin/users",
      label: "User Accounts",
      icon: <Users size={19} />,
      badge: null,
    },
  ];

  return (
    <div className="flex h-screen bg-slate-50/70 overflow-hidden font-sans">
      {/* Sidebar Overlay (Mobile) */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-[110] md:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static top-0 left-0 z-[120] h-full w-64 bg-slate-900 text-slate-100 flex flex-col justify-between shadow-2xl md:shadow-none transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header & Logo */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-3 text-left group"
              title="Go to Marketplace"
            >
              <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0 border border-emerald-500/30 shadow-md group-hover:scale-105 transition-transform">
                <img src={logo} alt="FarmsAge" className="w-full h-full object-cover" />
              </div>
              <div>
                <span className="font-black text-lg text-white tracking-tight flex items-center gap-1">
                  Farms<span className="text-emerald-400">AGE</span>
                  <span className="text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30">
                    2.0
                  </span>
                </span>
                <div className="text-[10px] font-bold text-slate-400 tracking-wider uppercase flex items-center gap-1 mt-0.5">
                  <ShieldCheck size={11} className="text-emerald-400" /> Admin Console
                </div>
              </div>
            </button>

            <button
              className="md:hidden text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-3 py-5 space-y-1.5 overflow-y-auto">
            <div className="px-3 pb-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
              Core Management
            </div>

            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all duration-200 group ${
                    isActive
                      ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-900/30"
                      : "text-slate-400 hover:bg-slate-800/80 hover:text-slate-200"
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <span className="transition-transform group-hover:scale-110">
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-300 group-hover:bg-slate-700">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            ))}

            <div className="pt-4 px-3 pb-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
              Quick Shortcuts
            </div>

            <button
              onClick={() => navigate("/")}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-800 hover:text-emerald-400 transition-all duration-200"
            >
              <div className="flex items-center gap-3">
                <Store size={18} />
                <span>Visit Storefront</span>
              </div>
              <ChevronRight size={14} className="text-slate-500" />
            </button>
          </nav>

          {/* User Profile & Logout */}
          <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
            <div className="flex items-center justify-between gap-3 mb-3 px-1">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-black flex items-center justify-center text-xs shadow-md shrink-0">
                  {user?.name?.charAt(0).toUpperCase() || "A"}
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-white truncate">
                    {user?.name || "Super Admin"}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium truncate">
                    {user?.email || "admin@farmsage.com"}
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-600 rounded-xl transition-all duration-200"
            >
              <LogOut size={16} />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="flex items-center justify-between bg-white border-b border-slate-200/80 px-4 sm:px-6 py-3.5 shadow-2xs z-10">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              <Menu size={22} />
            </button>

            <div>
              <h1 className="text-sm sm:text-base font-bold text-slate-800 tracking-tight flex items-center gap-2">
                <span>Welcome back, <span className="text-emerald-700">{user?.name || "Admin"}</span></span>
                <Sparkles size={16} className="text-amber-400 hidden sm:inline" />
              </h1>
              <p className="text-[11px] text-slate-400 hidden sm:block">Manage your FarmsAGE 2.0 marketplace catalog & orders</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/60 rounded-xl transition-all shadow-2xs"
            >
              <Store size={15} />
              <span className="hidden sm:inline">Storefront</span>
            </button>

            <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-black flex items-center justify-center text-xs shadow-sm">
                {user?.name?.charAt(0).toUpperCase() || "A"}
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-bold text-slate-800 leading-none">{user?.name || "Administrator"}</p>
                <p className="text-[10px] text-slate-400 font-medium leading-none mt-1">Super Admin</p>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Page Outlet */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/60">
          <div className="w-full max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
