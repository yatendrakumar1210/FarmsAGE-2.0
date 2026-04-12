import React from "react";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Button = () => {
  const navigate = useNavigate();

  const handleOrderNow = () => {
    navigate("/order");
  };

  const handleVendor = () => {
    navigate("/vendor");
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full">
      {/* Order Now */}
      <button
        onClick={handleOrderNow}
        className="w-full sm:w-auto px-6 py-2.5 sm:py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-all active:scale-95 flex items-center justify-center gap-2"
      >
        Order Now
        <ArrowRight size={16} />
      </button>

      {/* Vendor */}
      <button
        onClick={handleVendor}
        className="w-full sm:w-auto px-6 py-2.5 sm:py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-all active:scale-95 flex items-center justify-center gap-2"
      >
        Become a Vendor
        <ArrowRight size={16} />
      </button>
    </div>
  );
};

export default Button;

