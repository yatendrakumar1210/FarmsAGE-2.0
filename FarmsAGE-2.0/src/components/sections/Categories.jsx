import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";

const categories = [
  {
    name: "Vegetables",
    image: "https://images.unsplash.com/photo-1540420773420-3366772f4999",
    path: "vegetables",
    bgColor: "bg-emerald-50",
  },
  {
    name: "Fresh Fruits",
    image: "https://images.unsplash.com/photo-1610832958506-aa56368176cf",
    path: "fruits",
    bgColor: "bg-rose-50",
  },
  {
    name: "Dairy & Milk",
    image: "https://images.unsplash.com/photo-1622371684824-dc014541a4f5",
    path: "dairy",
    bgColor: "bg-blue-50",
  },
  {
    name: "Organic Store",
    image: "https://images.unsplash.com/photo-1506806732259-39c2d0268443",
    path: "organic",
    bgColor: "bg-amber-50",
  },
  {
    name: "Atta & Dal",
    image:
      "https://media.istockphoto.com/id/686747322/photo/food-in-a-market-in-fes-morocco-the-market-is-one-of-the-most-important-attractions-of-the-city.jpg",
    path: "grains",
    bgColor: "bg-orange-50",
  },
  {
    name: "Daily Deals",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e",
    path: "all",
    bgColor: "bg-indigo-50",
  },
];

const Categories = () => {
  const navigate = useNavigate();

  return (
    <section className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-10 sm:py-12 md:py-16 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 sm:mb-10 md:mb-12">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 tracking-tight font-['Outfit']">
          What are you <span className="text-emerald-600">looking for?</span>
        </h2>

        <button
          onClick={() => navigate("/category/all")}
          className="self-start sm:self-auto text-emerald-600 font-bold text-sm flex items-center gap-1 hover:gap-2 transition-all px-3 py-2 rounded-lg hover:bg-emerald-50"
        >
          View All <ChevronRight size={18} />
        </button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-6 sm:gap-8 md:gap-10">
        {categories.map((cat, index) => (
          <motion.div
            key={cat.name}
            initial={{ opacity: 0, scale: 0.85 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.05 }}
            onClick={() => navigate(`/category/${cat.path}`)}
            className="flex flex-col items-center group cursor-pointer"
          >
            {/* Image */}
            <div
              className={`relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 rounded-full ${cat.bgColor} flex items-center justify-center mb-2 sm:mb-3 md:mb-4 transition-all duration-300 group-hover:shadow-[0_15px_30px_-10px_rgba(16,185,129,0.3)] border border-white group-hover:border-emerald-100 overflow-hidden`}
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
            <h3 className="text-[11px] sm:text-xs md:text-sm lg:text-base font-bold text-slate-700 text-center tracking-tight group-hover:text-emerald-600 transition-colors">
              {cat.name}
            </h3>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default Categories;

