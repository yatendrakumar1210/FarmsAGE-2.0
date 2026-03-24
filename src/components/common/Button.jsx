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
    <div className="flex gap-5 justify-center text-white brightness-100  ">
      <button
        onClick={handleOrderNow}
        className="rounded-full bg-green-600 w-30 h-10 active:scale-95 hover:bg-green-700 "
      >
        Order Now
      </button>
      <button
        onClick={handleVendor}
        className="rounded-full bg-green-600 w-35 h-10 active:scale-95 hover:bg-green-700"
      >
        Become a Vendor
      </button>
    </div>
  );
};

export default Button;
