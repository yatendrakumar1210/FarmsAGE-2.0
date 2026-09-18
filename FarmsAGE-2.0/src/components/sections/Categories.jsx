import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";

const categories = [
  {
    name: "Vegetables",
    image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=60&w=250",
    path: "vegetables",
    bgColor: "bg-emerald-50 border-emerald-100",
  },
  {
    name: "Fresh Fruits",
    image: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&q=60&w=250",
    path: "fruits",
    bgColor: "bg-rose-50 border-rose-100",
  },
  {
    name: "Organic Store",
    image: "https://images.unsplash.com/photo-1506806732259-39c2d0268443?auto=format&fit=crop&q=60&w=250",
    path: "organic",
    bgColor: "bg-amber-50 border-amber-100",
  },
  {
    name: "Leafy Herbs",
    image: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&q=60&w=250",
    path: "all?search=leaf",
    bgColor: "bg-teal-50 border-teal-100",
  },
  {
    name: "Dairy & Milk",
    image: "https://images.unsplash.com/photo-1528750997573-59b89d56f4f7?auto=format&fit=crop&q=60&w=250",
    path: "all?search=milk",
    bgColor: "bg-blue-50 border-blue-100",
  },
  {
    name: "Farm Oils",
    image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=60&w=250",
    path: "all?search=oil",
    bgColor: "bg-yellow-50 border-yellow-100",
  },
  {
    name: "Dry Fruits",
    image: "https://images.unsplash.com/photo-1596547609652-9cf5d8d76921?auto=format&fit=crop&q=60&w=250",
    path: "all?search=dry",
    bgColor: "bg-orange-50 border-orange-100",
  },
  {
    name: "Daily Deals",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=60&w=250",
    path: "all",
    bgColor: "bg-indigo-50 border-indigo-100",
  },
];

const Categories = () => {
  const navigate = useNavigate();

  return (
    <section className="max-w-7xl mx-auto px-2.5 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-8 md:py-14 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-3.5 sm:mb-8 md:mb-10 px-1">
        <div>
          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-0.5 block">
            ⚡ 10-15 Min Delivery
          </span>
          <h2 className="text-lg sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight font-['Outfit']">
            Explore <span className="text-emerald-600">Fresh Categories</span>
          </h2>
        </div>

        <button
          onClick={() => navigate("/category/all")}
          className="text-emerald-600 hover:text-emerald-700 font-black text-[11px] sm:text-sm flex items-center gap-0.5 hover:gap-1.5 transition-all px-2.5 py-1.5 rounded-xl hover:bg-emerald-50 shrink-0"
        >
          <span>See All</span>
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Categories Grid - 4 on mobile, 8 on desktop */}
      <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-2 sm:gap-4 md:gap-6">
        {categories.map((cat, index) => (
          <motion.div
            key={cat.name}
            initial={{ opacity: 0, scale: 0.85 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.04 }}
            onClick={() => navigate(`/category/${cat.path}`)}
            className="flex flex-col items-center group cursor-pointer"
          >
            {/* Image */}
            <div
              className={`relative w-14 h-14 min-[380px]:w-16 min-[380px]:h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 rounded-full ${cat.bgColor} flex items-center justify-center mb-1.5 sm:mb-3 transition-all duration-300 group-hover:shadow-[0_15px_30px_-10px_rgba(16,185,129,0.3)] border border-white group-hover:border-emerald-100 overflow-hidden shadow-xs`}
            >
              <motion.img
                whileHover={{ scale: 1.15 }}
                src={cat.image}
                alt={cat.name}
                className="w-full h-full object-cover transition-transform duration-500"
              />

              <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors" />
            </div>

            {/* Title */}
            <h3 className="text-[10px] min-[380px]:text-[11px] sm:text-xs md:text-sm font-bold text-slate-800 text-center tracking-tight group-hover:text-emerald-600 transition-colors line-clamp-1 w-full px-0.5">
              {cat.name}
            </h3>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default Categories;


