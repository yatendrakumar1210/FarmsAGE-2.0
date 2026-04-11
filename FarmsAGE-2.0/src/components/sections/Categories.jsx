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
    image: "https://media.istockphoto.com/id/686747322/photo/food-in-a-market-in-fes-morocco-the-market-is-one-of-the-most-important-attractions-of-the-city.jpg",
    path: "grains",
    bgColor: "bg-orange-50",
  },
  {
    name: "Daily Deals",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e",
    path: "all",
    bgColor: "bg-indigo-50",
  }
];

const Categories = () => {
  const navigate = useNavigate();

  return (
    <section className="max-w-7xl mx-auto px-6 py-16 font-sans">
      <div className="flex items-center justify-between mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight font-['Outfit']">
          What are you <span className="text-emerald-600">looking for?</span>
        </h2>
        <button 
          onClick={() => navigate('/category/all')}
          className="text-emerald-600 font-bold text-sm flex items-center gap-1 hover:gap-2 transition-all p-2 rounded-lg hover:bg-emerald-50"
        >
          View All <ChevronRight size={18} />
        </button>
      </div>

      <div className="flex flex-wrap justify-around sm:justify-between gap-y-8 sm:gap-y-10 gap-x-2 sm:gap-x-6 md:gap-x-8">
        {categories.map((cat, index) => (
          <motion.div
            key={cat.name}
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.05 }}
            onClick={() => navigate(`/category/${cat.path}`)}
            className="flex flex-col items-center group cursor-pointer w-[80px] sm:w-[100px] md:w-[150px]"
          >
            <div className={`relative w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-full ${cat.bgColor} flex items-center justify-center mb-3 sm:mb-4 transition-all duration-300 group-hover:shadow-[0_15px_30px_-10px_rgba(16,185,129,0.3)] border border-white group-hover:border-emerald-100 overflow-hidden`}>
               <motion.img
                 whileHover={{ scale: 1.15 }}
                 src={cat.image}
                 alt={cat.name}
                 className="w-full h-full object-cover transition-transform duration-500"
               />
               <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors" />
            </div>
            
            <h3 className="text-xs sm:text-sm md:text-base font-bold text-slate-700 text-center tracking-tight group-hover:text-emerald-600 transition-colors">
              {cat.name}
            </h3>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default Categories;
