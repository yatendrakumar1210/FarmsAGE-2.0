import React, { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { API_BASE_URL as API } from "../../config/api";
import {
  LayoutDashboard,
  PackageOpen,
  Truck,
  History,
  User,
  LogOut,
  Power,
  Menu,
  X,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import logo from "../../assets/logo.jpg";

const DeliveryLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isAvailable, setIsAvailable] = useState(false);
  const [togglingAvail, setTogglingAvail] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [partnerStatus, setPartnerStatus] = useState(
    user?.deliveryStatus || "approved"
  );

  // Redirect non-approved partners to /delivery/profile
  useEffect(() => {
    const currentStatus = user?.deliveryStatus?.toLowerCase() || partnerStatus;
    if (
      currentStatus &&
      currentStatus !== "approved" &&
      location.pathname !== "/delivery/profile"
    ) {
      navigate("/delivery/profile", { replace: true });
    }
  }, [user, partnerStatus, location.pathname, navigate]);

  // Fetch initial availability state and status
  useEffect(() => {
    fetchDashboardStatus();
  }, [location.pathname]);

  const fetchDashboardStatus = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch(`${API}/api/delivery/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success && data.stats) {
        setIsAvailable(Boolean(data.stats.isAvailable));
        setPartnerStatus(data.stats.deliveryStatus || "approved");
      } else {
        const currentStatus =
          data.deliveryStatus || user?.deliveryStatus || "pending";
        setPartnerStatus(currentStatus);
        if (
          currentStatus !== "approved" &&
          location.pathname !== "/delivery/profile"
        ) {
          navigate("/delivery/profile", { replace: true });
        }
      }
    } catch (e) {
      console.error("Failed to fetch delivery status:", e);
    }
  };

  const handleToggleAvailability = async () => {
    if (togglingAvail) return;
    setTogglingAvail(true);
    try {
      const token = localStorage.getItem("token");
      const nextState = !isAvailable;
      const res = await fetch(`${API}/api/delivery/availability`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isAvailable: nextState }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsAvailable(data.isAvailable);
      } else {
        alert(data.message || "Failed to update availability");
      }
    } catch (err) {
      console.error("Availability toggle error:", err);
    } finally {
      setTogglingAvail(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = [
    ...(partnerStatus === "approved"
      ? [
          {
            to: "/delivery/dashboard",
            label: "Dashboard",
            icon: <LayoutDashboard size={19} />,
            badge: "Home",
          },
          {
            to: "/delivery/available-orders",
            label: "Available Orders",
            icon: <PackageOpen size={19} />,
            badge: "Feed",
          },
          {
            to: "/delivery/active-delivery",
            label: "Active Delivery",
            icon: <Truck size={19} />,
            badge: "In Progress",
          },
          {
            to: "/delivery/history",
            label: "Delivery History",
            icon: <History size={19} />,
            badge: "Log",
          },
        ]
      : []),
    {
      to: "/delivery/profile",
      label: "Partner Profile",
      icon: <User size={19} />,
      badge:
        partnerStatus !== "approved"
          ? partnerStatus.toUpperCase()
          : "Account",
    },
  ];

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      {/* ─── Mobile Sidebar Overlay ─────────────────────────────────────── */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[100] md:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* ─── Desktop & Mobile Drawer Sidebar ────────────────────────────── */}
      <aside
        className={`fixed md:static top-0 left-0 z-[110] h-full w-64 bg-slate-900 text-slate-100 flex flex-col justify-between shadow-2xl md:shadow-none transform transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header & Logo */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0 border border-emerald-500/30 shadow-md">
                <img src={logo} alt="FarmsAge" className="w-full h-full object-cover" />
              </div>
              <div>
                <span className="font-black text-lg text-white tracking-tight flex items-center gap-1 font-['Outfit']">
                  Farms<span className="text-emerald-400">AGE</span>
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Rider Panel
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="md:hidden text-slate-400 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>

          {/* Quick Availability Card in Sidebar */}
          <div className="p-4 mx-3 my-3 rounded-2xl bg-slate-800/70 border border-slate-700/60">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-300">Status</span>
              <span
                className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                  isAvailable
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                    : "bg-slate-700 text-slate-400"
                }`}
              >
                {isAvailable ? "Online" : "Offline"}
              </span>
            </div>
            <button
              onClick={handleToggleAvailability}
              disabled={togglingAvail || partnerStatus !== "approved"}
              className={`w-full py-2.5 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isAvailable
                  ? "bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30"
                  : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30"
              } disabled:opacity-50`}
            >
              <Power size={14} className={togglingAvail ? "animate-spin" : ""} />
              <span>{isAvailable ? "Go Offline" : "Go Online"}</span>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-3 py-2 space-y-1.5 overflow-y-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-3 rounded-xl font-bold text-xs transition-all ${
                    isActive
                      ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/25"
                      : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                <span className="text-[10px] font-semibold opacity-70 px-1.5 py-0.5 rounded-md bg-black/20">
                  {item.badge}
                </span>
              </NavLink>
            ))}
          </nav>

          {/* Footer User Info & Logout */}
          <div className="p-4 border-t border-slate-800 bg-slate-950/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 font-black flex items-center justify-center border border-emerald-500/30 shrink-0 text-xs">
                  {user?.name ? user.name[0].toUpperCase() : "R"}
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-white truncate">{user?.name || "Rider"}</p>
                  <p className="text-[10px] text-slate-400 truncate">Delivery Partner</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition"
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* ─── Main Content Shell ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Bar */}
        <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3.5 flex items-center justify-between shrink-0 shadow-xs z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden text-slate-600 hover:text-slate-900 p-1.5 rounded-xl hover:bg-slate-100"
            >
              <Menu size={22} />
            </button>
            <div className="flex items-center gap-2">
              <Truck size={20} className="text-emerald-600" />
              <h1 className="text-base sm:text-lg font-black text-slate-900 font-['Outfit'] tracking-tight">
                Delivery Workspace
              </h1>
            </div>
          </div>

          {/* Live Availability Switch in Top Header */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2">
              <span
                className={`inline-block w-2.5 h-2.5 rounded-full ${
                  isAvailable ? "bg-emerald-500 animate-pulse" : "bg-slate-300"
                }`}
              />
              <span className="text-xs font-bold text-slate-700">
                {isAvailable ? "Online & Ready" : "Offline"}
              </span>
            </div>

            <button
              onClick={handleToggleAvailability}
              disabled={togglingAvail || partnerStatus !== "approved"}
              className={`px-3.5 py-1.5 rounded-full text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                isAvailable
                  ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-300"
              }`}
            >
              <Power size={13} className={togglingAvail ? "animate-spin" : ""} />
              <span>{isAvailable ? "ONLINE" : "OFFLINE"}</span>
            </button>
          </div>
        </header>

        {/* Page Content Outlet */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50/70 pb-24 md:pb-8">
          <Outlet context={{ isAvailable, setIsAvailable, partnerStatus }} />
        </main>

        {/* ─── Mobile Bottom Navigation Bar ────────────────────────────── */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-2 py-1.5 flex items-center justify-around z-30 shadow-lg">
          {navItems.slice(0, 4).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl text-[10px] font-extrabold transition-all ${
                  isActive ? "text-emerald-600 font-black scale-105" : "text-slate-400 hover:text-slate-600"
                }`
              }
            >
              {item.icon}
              <span className="truncate max-w-[65px]">{item.label.split(" ")[0]}</span>
            </NavLink>
          ))}
          <NavLink
            to="/delivery/profile"
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl text-[10px] font-extrabold transition-all ${
                isActive ? "text-emerald-600 font-black scale-105" : "text-slate-400 hover:text-slate-600"
              }`
            }
          >
            <User size={19} />
            <span>Profile</span>
          </NavLink>
        </nav>
      </div>
    </div>
  );
};

export default DeliveryLayout;
