import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ShoppingBag, ArrowRight } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { motion, AnimatePresence } from "framer-motion";

const FloatingCartBar = () => {
  const { cart } = useCart();
  const location = useLocation();

  const hiddenRoutes = ["/cart", "/checkout", "/order-success", "/admin", "/vendor"];
  const isHidden = hiddenRoutes.some((route) => location.pathname.startsWith(route));

  const totalQuantity = cart.reduce((total, item) => total + item.quantity, 0);
  const totalPrice = cart.reduce((total, item) => total + item.price * item.quantity, 0);

  if (isHidden || totalQuantity === 0) return null;

  return (
    <AnimatePresence>
      <div className="fixed bottom-[68px] md:bottom-4 left-0 right-0 z-[120] px-3 sm:px-4 pointer-events-none flex justify-center">
        <motion.div
          initial={{ y: 50, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 50, opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="pointer-events-auto w-full max-w-lg bg-slate-900/95 text-white backdrop-blur-md rounded-2xl sm:rounded-3xl shadow-2xl p-3 sm:p-3.5 flex items-center justify-between border border-white/15 hover:shadow-emerald-950/20 transition-all"
        >
          {/* Left info: Icon, count, price */}
          <div className="flex items-center gap-3 pl-1.5">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black shadow-md">
                <ShoppingBag size={18} />
              </div>
              <span className="absolute -top-1 -right-1 bg-amber-400 text-slate-950 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-slate-900">
                {totalQuantity}
              </span>
            </div>

            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {totalQuantity} {totalQuantity === 1 ? "Item" : "Items"} in Cart
              </p>
              <p className="text-sm sm:text-base font-black text-white">
                ₹{totalPrice}
              </p>
            </div>
          </div>

          {/* Right Action: View Cart */}
          <Link
            to="/cart"
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl transition-all shadow-md active:scale-95 group"
          >
            <span>View Cart</span>
            <ArrowRight
              size={16}
              className="group-hover:translate-x-1 transition-transform"
            />
          </Link>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default FloatingCartBar;
