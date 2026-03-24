import { Bookmark, ShoppingCart, Timer } from "lucide-react";
import { useState } from "react";

const ProductCard = ({ product }) => {
  const [isBookmarked, setIsBookmarked] = useState(false);

  return (
    <div className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col p-4 relative w-full max-w-sm mx-auto">
      {/* Premium Discount Badge */}
      <div className="absolute top-3 left-3 z-10">
        <span className="bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider">
          {product.discount} OFF
        </span>
      </div>

      {/* Product Image Container */}
      <div className="relative h-40 sm:h-48 flex items-center justify-center overflow-hidden rounded-xl bg-gray-50 mb-3">
        <img
          src={product.image}
          alt={product.name}
          className="h-3/4 object-contain transform group-hover:scale-110 transition-transform duration-500 ease-in-out"
        />

        {/* Quick View / Timer Overlay */}
        <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center">
          <span className="flex items-center gap-1 text-[10px] font-medium bg-white/90 backdrop-blur-sm text-gray-700 px-2 py-1 rounded-full shadow-sm">
            <Timer size={12} className="text-amber-500" /> 10 MINS
          </span>
        </div>
      </div>

      {/* Brand & Title */}
      <div className="flex-grow">
        <p className="text-emerald-600 text-[10px] font-bold uppercase tracking-widest mb-1">
          {product.brand || "Farm Fresh"}
        </p>
        <h3 className="font-semibold text-gray-800 text-sm sm:text-base leading-tight min-h-[40px]">
          {product.name}
        </h3>

        {/* Weight Selector - Styled for modern UI */}
        <div className="mt-3">
          <select className="appearance-none bg-gray-50 border border-gray-200 text-gray-600 text-xs rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block w-full p-2 cursor-pointer outline-none">
            <option>1 kg - ₹{product.price}</option>
            <option>500 g - ₹{(product.price / 2).toFixed(0)}</option>
            <option>250 g - ₹{(product.price / 4).toFixed(0)}</option>
          </select>
        </div>
      </div>

      {/* Pricing & Actions */}
      <div className="mt-4 pt-3 border-t border-gray-50 flex flex-col gap-3">
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-bold text-gray-900">
            ₹{product.price}
          </span>
          <span className="text-gray-400 line-through text-xs">
            ₹{product.oldPrice}
          </span>
        </div>

        <div className="flex justify-between items-center gap-2">
          <button
            onClick={() => setIsBookmarked(!isBookmarked)}
            className={`p-2.5 rounded-xl border transition-colors duration-200 ${
              isBookmarked
                ? "bg-amber-50 border-amber-200 text-amber-500"
                : "bg-white border-gray-200 text-gray-400 hover:border-emerald-200 hover:text-emerald-500"
            }`}
          >
            <Bookmark size={18} fill={isBookmarked ? "currentColor" : "none"} />
          </button>

          <button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-emerald-100">
            <ShoppingCart size={16} />
            <span className="text-sm">Add</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
