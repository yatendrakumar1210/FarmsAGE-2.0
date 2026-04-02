import { Bookmark, ShoppingCart, Timer, Check } from "lucide-react";
import { useState } from "react";
import { useCart } from "../../context/CartContext";

const weightOptions = [
  { label: "1 kg", multiplier: 1 },
  { label: "500 g", multiplier: 0.5 },
  { label: "250 g", multiplier: 0.25 },
];

const ProductCard = ({ product }) => {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [selectedWeight, setSelectedWeight] = useState(0); // index into weightOptions
  const [added, setAdded] = useState(false);
  const { addToCart } = useCart();

  const currentWeight = weightOptions[selectedWeight];
  const currentPrice = Math.round(product.price * currentWeight.multiplier);

  const handleAddToCart = () => {
    addToCart(
      {
        ...product,
        price: currentPrice,
        originalPricePerKg: product.price,
      },
      currentWeight.label
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  return (
    <div className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col p-4 relative w-full max-w-sm mx-auto">
      {/* Premium Discount Badge */}
      <div className="absolute top-3 left-3 z-10">
        <span className="bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider">
          {product.discount}
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

        {/* Weight Selector */}
        <div className="mt-3">
          <select
            value={selectedWeight}
            onChange={(e) => setSelectedWeight(Number(e.target.value))}
            className="appearance-none bg-gray-50 border border-gray-200 text-gray-600 text-xs rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block w-full p-2 cursor-pointer outline-none"
          >
            {weightOptions.map((opt, idx) => (
              <option key={idx} value={idx}>
                {opt.label} - ₹{Math.round(product.price * opt.multiplier)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Pricing & Actions */}
      <div className="mt-4 pt-3 border-t border-gray-50 flex flex-col gap-3">
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-bold text-gray-900">
            ₹{currentPrice}
          </span>
          <span className="text-gray-400 line-through text-xs">
            ₹{Math.round(product.oldPrice * currentWeight.multiplier)}
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

          <button
            onClick={handleAddToCart}
            className={`flex-1 font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg ${
              added
                ? "bg-emerald-700 text-white shadow-emerald-200"
                : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-100"
            }`}
          >
            {added ? (
              <>
                <Check size={16} />
                <span className="text-sm">Added!</span>
              </>
            ) : (
              <>
                <ShoppingCart size={16} />
                <span className="text-sm">Add</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
