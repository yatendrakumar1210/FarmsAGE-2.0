import { Plus, Minus } from "lucide-react";
import { useState, memo } from "react";
import { useCart } from "../../context/CartContext";
import { motion, AnimatePresence } from "framer-motion";
import { optimizeImageUrl } from "../../utils/optimizeImage";

const standardWeightOptions = [
  { label: "1 kg", multiplier: 1 },
  { label: "500 g", multiplier: 0.5 },
  { label: "250 g", multiplier: 0.25 },
];

const bananaPieceOptions = [
  { label: "12 pcs", multiplier: 1 },
  { label: "6 pcs", multiplier: 0.5 },
];

const singlePieceOptions = [
  { label: "1 Piece", multiplier: 1 },
  { label: "2 Pieces", multiplier: 2 },
];

const boxOptions = [
  { label: "1 Box", multiplier: 1 },
  { label: "2 Boxes", multiplier: 2 },
];

const packOptions = [
  { label: "1 pack", multiplier: 1 },
  { label: "2 packs", multiplier: 2 },
];

const ProductCard = ({ product, priority = false }) => {
  const normUnit = (product.unit || "").toLowerCase();
  const normName = (product.name || "").toLowerCase();

  const isBoxItem = normUnit.includes("box") || normName.includes("box");
  const isPackItem = normUnit.includes("pack") || normName.includes("strawberry");
  const isSinglePieceItem = 
    normUnit.includes("piece") || 
    normName.includes("coconut") || 
    normName.includes("nariyal") || 
    normName.includes("dragon fruit") ||
    normName.includes("pineapple") ||
    normName.includes("kiwi");

  const isBananaItem = 
    normUnit.includes("12 pcs") || 
    normUnit.includes("6 pcs") || 
    normName.includes("banana") || 
    normUnit.includes("pcs");

  const weightOptions = isBoxItem
    ? boxOptions
    : isPackItem
    ? packOptions
    : isSinglePieceItem
    ? singlePieceOptions
    : isBananaItem
    ? bananaPieceOptions
    : standardWeightOptions;

  const defaultWeightIndex = product.unit
    ? weightOptions.findIndex(
        (w) => w.label.toLowerCase() === product.unit?.toLowerCase(),
      )
    : 0;

  const [selectedWeight, setSelectedWeight] = useState(
    defaultWeightIndex >= 0 ? defaultWeightIndex : 0,
  );
  const [added, setAdded] = useState(false);

  const { cart, addToCart, updateQuantity, removeFromCart } = useCart();

  const catName = (product.category || "").toLowerCase();
  const prodName = (product.name || "").toLowerCase();
  const isOrganic = product.isOrganic || catName.includes("organic") || prodName.includes("organic");
  const isFruitsOrVegetables = 
    (catName === "vegetables" || catName === "fruits" || catName === "fresh vegetables" || catName === "fresh fruits") && !isOrganic;

  const isOutOfStock = 
    !isFruitsOrVegetables ||
    product.quantity === 0 || 
    product.quantity === '0' || 
    product.isOutOfStock === true || 
    product.inStock === false ||
    product.stockStatus === 'out_of_stock';

  const currentWeight = weightOptions[selectedWeight] || weightOptions[0];
  const currentPrice = Math.round(product.price * currentWeight.multiplier);
  const baseOldPrice = product.oldPrice || Math.round(product.price * 1.25);
  const originalPrice = Math.round(baseOldPrice * currentWeight.multiplier);
  const discountAmount = originalPrice - currentPrice;

  const cartItemId = product._id || product.id;
  const cartItem = cart.find(
    (item) => String(item._id || item.id) === String(cartItemId) && item.weight === currentWeight.label
  );
  const cartQuantity = cartItem ? cartItem.quantity : 0;

  // 🔥 Optimized Image URL
  const optimizedImage = optimizeImageUrl(product.image, 360);

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
      <div className="relative bg-slate-50/80 p-2 sm:p-4 aspect-square flex items-center justify-center overflow-hidden">
        <img
          src={optimizedImage}
          alt={product.name}
          loading={priority ? "eager" : "lazy"} // 🔥 smart loading
          decoding="async"
          width="150"
          height="150"
          onError={(e) => (e.target.src = "https://via.placeholder.com/150?text=No+Image")}
          className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-700"
        />

        {/* BLINKIT DELIVERY TIME & DISCOUNT BADGES */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
          <span className="bg-slate-900/90 backdrop-blur-xs text-white text-[8px] sm:text-[9px] font-black px-1.5 sm:px-2 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-1 shadow-sm">
            <span className="text-emerald-400">⚡</span> 30 MINS
          </span>
          {discountAmount > 0 && (
            <span className="bg-emerald-600 text-white text-[8px] sm:text-[9px] font-black px-1.5 sm:px-2 py-0.5 rounded-md shadow-sm">
              ₹{discountAmount} OFF
            </span>
          )}
        </div>

        {/* QUICK ADD */}
        {!isOutOfStock && (
          <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
            <button
              onClick={handleAddToCart}
              className="bg-white text-emerald-600 p-2.5 sm:p-3 rounded-full shadow hover:bg-emerald-600 hover:text-white transition"
            >
              <Plus size={18} />
            </button>
          </div>
        )}
      </div>

      {/* CONTENT */}
      <div className="p-2.5 sm:p-3 flex flex-col flex-1 justify-between">
        <div>
          <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 line-clamp-2 h-8 sm:h-9 leading-snug">
            {product.name}
          </h3>

          <div className="mt-1">
            <select
              disabled={isOutOfStock}
              value={selectedWeight}
              onChange={(e) => setSelectedWeight(Number(e.target.value))}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-[10px] sm:text-[11px] font-bold rounded-lg px-1.5 sm:px-2 py-0.5 sm:py-1 outline-none cursor-pointer hover:border-emerald-500 transition-colors w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {weightOptions.map((w, idx) => (
                <option key={idx} value={idx}>
                  {w.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* PRICE & QTY CONTROLS */}
        <div className="mt-auto flex justify-between items-center pt-2 gap-1">
          <div className="flex flex-col sm:flex-row sm:items-baseline leading-none">
            <span className="font-black text-xs sm:text-base text-slate-900">₹{currentPrice}</span>
            {originalPrice > currentPrice && (
              <span className="text-[9px] sm:text-xs line-through text-gray-400 sm:ml-1 mt-0.5 sm:mt-0">
                ₹{originalPrice}
              </span>
            )}
          </div>

          {isOutOfStock ? (
            <button
              disabled
              className="px-1.5 py-1 rounded-lg text-[9px] sm:text-[11px] font-extrabold bg-slate-100 text-rose-600 border border-slate-200 cursor-not-allowed shrink-0"
            >
              Out of Stock
            </button>
          ) : cartQuantity > 0 ? (
            <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-300 px-1 sm:px-2 py-0.5 sm:py-1 rounded-lg shadow-xs">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (cartQuantity <= 1) {
                    removeFromCart(cartItemId, currentWeight.label);
                  } else {
                    updateQuantity(cartItemId, currentWeight.label, -1);
                  }
                }}
                className="text-emerald-700 hover:text-emerald-900 font-bold p-0.5"
              >
                <Minus size={11} className="sm:w-3 sm:h-3" />
              </button>
              <span className="text-[11px] sm:text-xs font-black text-emerald-800 min-w-[12px] text-center">{cartQuantity}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  updateQuantity(cartItemId, currentWeight.label, 1);
                }}
                className="text-emerald-700 hover:text-emerald-900 font-bold p-0.5"
              >
                <Plus size={11} className="sm:w-3 sm:h-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleAddToCart}
              className={`px-2 sm:px-3 py-1 rounded-lg text-[10px] sm:text-xs font-black border transition-all active:scale-95 shrink-0 ${
                added
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white"
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
