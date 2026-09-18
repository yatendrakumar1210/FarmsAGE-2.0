import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, LayoutGrid, Package, ShoppingCart, User } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";

const MobileBottomNav = () => {
  const location = useLocation();
  const { cart } = useCart();
  const { user } = useAuth();

  // Hide bottom nav on admin or vendor dashboards or during checkout to prevent clutter
  const hiddenPrefixes = ["/admin", "/vendor", "/checkout", "/order-success"];
  const isHidden = hiddenPrefixes.some((prefix) => location.pathname.startsWith(prefix));

  if (isHidden) return null;

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

  const navItems = [
    {
      id: "home",
      label: "Home",
      icon: Home,
      path: "/",
      isActive: location.pathname === "/" || location.pathname === "/home",
    },
    {
      id: "categories",
      label: "Categories",
      icon: LayoutGrid,
      path: "/category/all",
      isActive: location.pathname.startsWith("/category"),
    },
    {
      id: "orders",
      label: "Orders",
      icon: Package,
      path: user ? "/my-orders" : "/login",
      isActive: location.pathname === "/my-orders",
    },
    {
      id: "cart",
      label: "Cart",
      icon: ShoppingCart,
      path: "/cart",
      isActive: location.pathname === "/cart",
      badge: cartCount > 0 ? cartCount : null,
    },
    {
      id: "account",
      label: user ? user.name?.split(" ")[0] || "Account" : "Login",
      icon: User,
      path: user ? "/complete-profile" : "/login",
      isActive: location.pathname === "/login" || location.pathname === "/complete-profile",
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[110] bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-safe">
      <div className="flex items-center justify-around h-14 px-2 max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.isActive;
          return (
            <Link
              key={item.id}
              to={item.path}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-all relative ${
                active ? "text-emerald-600 font-extrabold" : "text-slate-500 font-medium hover:text-slate-800"
              }`}
            >
              <div className="relative">
                <Icon size={20} strokeWidth={active ? 2.5 : 1.8} className={active ? "scale-110 transition-transform" : ""} />
                {item.badge && (
                  <span className="absolute -top-1.5 -right-2.5 bg-amber-400 text-slate-950 text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-white shadow-xs">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] tracking-tight mt-0.5 truncate max-w-[64px]">
                {item.label}
              </span>
              {active && (
                <div className="w-1 h-1 bg-emerald-600 rounded-full mt-0.5" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
