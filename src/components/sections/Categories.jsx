import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const categories = [
  {
    name: "Fresh Fruits",
    image: "https://images.unsplash.com/photo-1610832958506-aa56368176cf",
    path: "fruits",
    color: "bg-orange-50",
    border: "border-orange-100",
    textColor: "text-orange-700",
  },
  {
    name: "Vegetables",
    image: "https://images.unsplash.com/photo-1540420773420-3366772f4999",
    path: "vegetables",
    color: "bg-emerald-50",
    border: "border-emerald-100",
    textColor: "text-emerald-700",
  },
  {
    name: "Dairy & Eggs",
    image:
      "https://images.unsplash.com/photo-1622371684824-dc014541a4f5?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    path: "dairy",
    color: "bg-blue-50",
    border: "border-blue-100",
    textColor: "text-blue-700",
  },
  {
    name: "Organic Store",
    image: "https://images.unsplash.com/photo-1506806732259-39c2d0268443",
    path: "organic",
    color: "bg-green-50",
    border: "border-green-100",
    textColor: "text-green-700",
  },
  {
    name: "Atta & Rice",
    image:
      "https://media.istockphoto.com/id/686747322/photo/food-in-a-market-in-fes-morocco-the-market-is-one-of-the-most-important-attractions-of-the-city.jpg?s=1024x1024&w=is&k=20&c=_PHFB3jkuJFslsAOL1kvkm2gvAhqxUxyxgGkuWhGezY=",
    path: "grains",
    color: "bg-amber-50",
    border: "border-amber-100",
    textColor: "text-amber-700",
  },
  {
    name: "Snacks & Munchies",
    image: "https://images.unsplash.com/photo-1599490659213-e2b9527bd087",
    path: "snacks",
    color: "bg-rose-50",
    border: "border-rose-100",
    textColor: "text-rose-700",
  },
  {
    name: "Cold Drinks",
    image: "https://images.unsplash.com/photo-1581006852262-e4307cf6283a",
    path: "drinks",
    color: "bg-purple-50",
    border: "border-purple-100",
    textColor: "text-purple-700",
  },
  {
    name: "Instant Food",
    image: "https://images.unsplash.com/photo-1604909052743-94e838986d24",
    path: "instant",
    color: "bg-yellow-50",
    border: "border-yellow-100",
    textColor: "text-yellow-700",
  },
];

const Categories = () => {
  const navigate = useNavigate();

  return (
    <section className="max-w-7xl mx-auto px-6 py-16">
      {/* Header with "View All" */}
      <div className="flex justify-between items-end mb-10">
        <div>
          <span className="text-emerald-600 font-bold text-sm uppercase tracking-widest">
            Our Pantry
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-slate-800 mt-1">
            Shop by Category
          </h2>
        </div>
        <button className="hidden sm:flex items-center gap-2 text-emerald-600 font-bold hover:gap-3 transition-all">
          View All <ArrowRight size={20} />
        </button>
      </div>

      {/* Modern Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 md:gap-8">
        {categories.map((cat, index) => (
          <motion.div
            key={cat.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.05 }}
            onClick={() => navigate(`/category/${cat.path}`)}
            className={`group relative ${cat.color} ${cat.border} border-2 p-6 rounded-[2rem] cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-100 hover:-translate-y-2`}
          >
            {/* Decorative Circle Background */}
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/40 rounded-full group-hover:scale-150 transition-transform duration-500" />

            <div className="relative z-10 flex flex-col items-center">
              <div className="bg-white p-4 rounded-2xl shadow-sm mb-4 group-hover:rotate-12 transition-transform duration-300">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="h-16 w-16 object-cover rounded-xl"
                />
              </div>
              <h3
                className={`font-black text-center text-sm md:text-base ${cat.textColor}`}
              >
                {cat.name}
              </h3>

              {/* Subtle "Shop Now" text that appears on hover */}
              <span className="text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity mt-2 uppercase tracking-widest text-slate-500">
                Browse Items
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default Categories;
