import { Plus } from "lucide-react";
import { useState, memo } from "react";
import { useCart } from "../../context/CartContext";
import { motion, AnimatePresence } from "framer-motion";

const weightOptions = [
  { label: "1 kg", multiplier: 1 },
  { label: "500 g", multiplier: 0.5 },
  { label: "250 g", multiplier: 0.25 },
  { label: "1 pack", multiplier: 1 },
  { label: "1 Piece", multiplier: 1 },
];

const ProductCard = ({ product, priority = false }) => {
  const defaultWeightIndex = product.unit
    ? weightOptions.findIndex(
        (w) => w.label.toLowerCase() === product.unit?.toLowerCase(),
      )
    : 0;

  const [selectedWeight] = useState(
    defaultWeightIndex >= 0 ? defaultWeightIndex : 0,
  );
  const [added, setAdded] = useState(false);

  const { addToCart } = useCart();

  const isOutOfStock = product.quantity === 0;

  const currentWeight = weightOptions[selectedWeight];
  const currentPrice = Math.round(product.price * currentWeight.multiplier);
  const baseOldPrice = product.oldPrice || Math.round(product.price * 1.25);
  const originalPrice = Math.round(baseOldPrice * currentWeight.multiplier);
  const discountAmount = originalPrice - currentPrice;

  // 🔥 Optimized Image URL
  const optimizedImage = product.image.includes("?")
    ? `${product.image}&w=300&q=70&fm=webp`
    : `${product.image}?w=300&q=70&fm=webp`;

  const handleAddToCart = (e) => {
    e.stopPropagation();
    if (isOutOfStock) return;

    addToCart(
      {
        ...product,
        price: currentPrice,
        originalPricePerKg: product.price,
      },
      currentWeight.label,
    );

    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const getTag = () => {
    if (product.isOrganic) return "Organic";
    if (product.category === "Fruits") return "Fresh";
    if (product.name?.toLowerCase().includes("leaf")) return "Fresh Leaf";
    return "Fresh";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="group bg-white rounded-2xl h-full border border-gray-100/60 shadow-sm hover:shadow-xl hover:shadow-emerald-900/5 transition-all duration-500 overflow-hidden flex flex-col"
    >
      {/* IMAGE */}
      <div className="relative bg-slate-50/80 p-4 aspect-square flex items-center justify-center overflow-hidden">
        <img
          src={optimizedImage}
          alt={product.name}
          loading={priority ? "eager" : "lazy"} // 🔥 smart loading
          decoding="async"
          width="150"
          height="150"
          onError={(e) => (e.target.src = "https://via.placeholder.com/150?text=No+Image")}
          className={`w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-700 ${
            isOutOfStock ? "opacity-40 grayscale" : ""
          }`}
        />

        {/* TAG */}
        {!isOutOfStock && (
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            <span className="bg-emerald-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
              {getTag()}
            </span>

            {discountAmount > 0 && (
              <span className="bg-amber-400 text-black text-[9px] font-black px-2 py-0.5 rounded-full">
                Save ₹{discountAmount}
              </span>
            )}
          </div>
        )}

        {/* OUT OF STOCK */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
            <span className="bg-red-600 text-white px-3 py-1 rounded text-xs font-bold">
              Sold Out
            </span>
          </div>
        )}

        {/* QUICK ADD */}
        {!isOutOfStock && (
          <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
            <button
              onClick={handleAddToCart}
              className="bg-white text-emerald-600 p-3 rounded-full shadow hover:bg-emerald-600 hover:text-white transition"
            >
              <Plus size={20} />
            </button>
          </div>
        )}
      </div>

      {/* CONTENT */}
      <div className="p-3 flex flex-col flex-1">
        <h3 className="font-bold text-sm text-slate-800 line-clamp-2 h-10">
          {product.name}
        </h3>

        <p className="text-xs text-gray-400">
          {product.unit || currentWeight.label}
        </p>

        {/* PRICE */}
        <div className="mt-auto flex justify-between items-end pt-2">
          <div>
            <span className="font-bold text-lg">₹{currentPrice}</span>
            {originalPrice > currentPrice && (
              <span className="text-xs line-through text-gray-400 ml-2">
                ₹{originalPrice}
              </span>
            )}
          </div>

          {!isOutOfStock && (
            <button
              onClick={handleAddToCart}
              className={`px-3 py-1 rounded-lg text-xs font-bold border ${
                added
                  ? "bg-green-500 text-white border-green-500"
                  : "border-green-600 text-green-600 hover:bg-green-600 hover:text-white"
              }`}
            >
              <AnimatePresence mode="wait">
                {added ? (
                  <motion.span
                    key="added"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    ✓ Added
                  </motion.span>
                ) : (
                  <motion.span
                    key="add"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    ADD
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// 🔥 Prevent unnecessary re-renders
export default memo(ProductCard);
