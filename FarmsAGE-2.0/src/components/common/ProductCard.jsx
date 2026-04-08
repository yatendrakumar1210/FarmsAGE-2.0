import { Timer, Plus } from "lucide-react";
import { useState } from "react";
import { useCart } from "../../context/CartContext";

const weightOptions = [
  { label: "1 kg", multiplier: 1 },
  { label: "500 g", multiplier: 0.5 },
  { label: "250 g", multiplier: 0.25 },
];

const ProductCard = ({ product }) => {
  const [selectedWeight, setSelectedWeight] = useState(0); // index into weightOptions
  const [added, setAdded] = useState(false);
  const { addToCart } = useCart();

  const currentWeight = weightOptions[selectedWeight];
  const currentPrice = Math.round(product.price * currentWeight.multiplier);
  const originalPrice = Math.round(product.oldPrice * currentWeight.multiplier);

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
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="group bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300 flex flex-col p-3 relative w-full h-full min-h-[320px]">
      {/* Discount Badge - Blinkit style Blue */}
      {product.discount && (
        <div className="absolute top-0 left-0 z-10">
          <div className="bg-[#249bf5] text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-tl-xl rounded-br-lg flex flex-col items-center leading-tight">
            <span>{product.discount}</span>
            <span className="text-[8px]">OFF</span>
          </div>
        </div>
      )}

      {/* Product Image */}
      <div className="relative aspect-square flex items-center justify-center overflow-hidden rounded-lg mb-2">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-contain transform group-hover:scale-105 transition-transform duration-500"
        />
      </div>

      {/* Delivery Time */}
      <div className="flex items-center gap-1 text-[10px] font-bold text-gray-700 bg-gray-100 w-fit px-1.5 py-0.5 rounded-md mb-2">
        <Timer size={12} className="text-gray-900" />
        {product.deliveryTime || "17 MINS"}
      </div>

      {/* Title & Info */}
      <div className="flex-grow flex flex-col">
        <h3 className="font-bold text-gray-900 text-sm leading-tight mb-1 line-clamp-2">
          {product.name}
        </h3>
        
        {/* Weight / Variant */}
        <p className="text-gray-500 text-xs mb-3">
          {currentWeight.label}
        </p>
      </div>

      {/* Price & Add Button Row */}
      <div className="mt-auto flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-sm font-bold text-gray-900">
            ₹{currentPrice}
          </span>
          {originalPrice > currentPrice && (
            <span className="text-gray-400 line-through text-[10px]">
              ₹{originalPrice}
            </span>
          )}
        </div>

        <button
          onClick={handleAddToCart}
          className={`px-4 py-1.5 rounded-lg border font-bold text-xs uppercase transition-all flex items-center gap-1 ${
            added
              ? "bg-emerald-50 border-emerald-500 text-emerald-600"
              : "bg-white border-emerald-600 text-emerald-600 hover:bg-emerald-50"
          }`}
        >
          {added ? (
            "Added"
          ) : (
            <>
              ADD
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;

