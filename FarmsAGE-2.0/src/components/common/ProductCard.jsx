import { Plus } from "lucide-react";
import { useState } from "react";
import { useCart } from "../../context/CartContext";

const weightOptions = [
  { label: "1 kg", multiplier: 1 },
  { label: "500 g", multiplier: 0.5 },
  { label: "250 g", multiplier: 0.25 },
  { label: "1 pack", multiplier: 1 },
  { label: "1 Piece", multiplier: 1 },
];

const ProductCard = ({ product }) => {
  // Try to match the product's unit if it exists
  const defaultWeightIndex = product.unit
    ? weightOptions.findIndex(
        (w) => w.label.toLowerCase() === product.unit.toLowerCase(),
      )
    : 0;
  const safeWeightIndex = defaultWeightIndex >= 0 ? defaultWeightIndex : 0;
  const [selectedWeight, setSelectedWeight] = useState(safeWeightIndex);
  const [added, setAdded] = useState(false);
  const { addToCart } = useCart();

  const currentWeight = weightOptions[selectedWeight];
  const currentPrice = Math.round(product.price * currentWeight.multiplier);
  // Give some realistic old price if not present
  const baseOldPrice = product.oldPrice || Math.round(product.price * 1.25);
  const originalPrice = Math.round(baseOldPrice * currentWeight.multiplier);
  const discountAmount = originalPrice - currentPrice;

  const handleAddToCart = () => {
    addToCart(
      {
        ...product,
        price: currentPrice,
        originalPricePerKg: product.price,
      },
      currentWeight.label,
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  // Extract a mock tag from name or category if product doesn't have one
  const getTag = () => {
    if (product.isOrganic) return "Organic";
    if (product.category === "Fruits") return "Fresh";
    if (product.name.toLowerCase().includes("leaf")) return "Fresh Leaf";
    return "Fresh";
  };

  return (
    <div className="group bg-white rounded-xl hover:shadow-md transition-all duration-300 flex flex-col relative w-full h-full border border-transparent hover:border-gray-100 p-2 sm:p-3 md:p-4">
      {/* Product Image */}
      <div className="relative bg-[#f4f6f8] rounded-xl mb-3 p-2 sm:p-3 aspect-square flex items-center justify-center overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
        />

        {/* ADD Button */}
        <button
          onClick={handleAddToCart}
          className={`absolute bottom-2 right-2 sm:bottom-3 sm:right-3 px-3 sm:px-4 py-1.5 rounded-lg border font-bold text-[10px] sm:text-xs transition-all shadow-sm ${
            added
              ? "bg-pink-50 border-pink-500 text-pink-600"
              : "bg-white border-pink-600 text-pink-600 hover:bg-pink-50"
          }`}
        >
          {added ? "ADDED" : "ADD"}
        </button>
      </div>

      <div className="flex-1 flex flex-col">
        {/* Price */}
        <div className="flex items-center gap-1.5 mb-1 mt-1 flex-wrap">
          <span className="bg-[#138f4d] text-white px-1.5 py-0.5 rounded text-[11px] sm:text-xs font-bold">
            ₹{currentPrice}
          </span>

          {originalPrice > currentPrice && (
            <span className="text-gray-500 line-through text-[11px] sm:text-xs font-medium">
              ₹{originalPrice}
            </span>
          )}
        </div>

        {/* Discount */}
        {discountAmount > 0 && (
          <div className="text-[#138f4d] text-[10px] sm:text-xs font-bold mb-1">
            ₹{discountAmount} OFF
          </div>
        )}

        {/* Title */}
        <h3 className="font-semibold text-gray-800 text-sm sm:text-base leading-snug line-clamp-2 mb-1">
          {product.name}
        </h3>

        {/* Weight */}
        <p className="text-gray-500 text-xs sm:text-sm mb-1">
          {product.unit || currentWeight.label}
        </p>

        {/* Tag */}
        <div className="mt-auto pt-2">
          <span className="text-teal-600 text-[10px] sm:text-xs font-bold">
            {getTag()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;


