import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, Filter, ChevronRight } from "lucide-react";
import ProductCard from "../common/ProductCard";
import products from "../../data/products";
import { useNavigate } from "react-router-dom";

const filterOptions = ["All", "Vegetables", "Fruits", "Dairy", "Organic"];

const Products = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState("All");

  // Filter logic
  const filteredProducts =
    activeFilter === "All"
      ? products.slice(0, 10)
      : products.filter((p) => p.category === activeFilter).slice(0, 8);

  return (
    <section className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-8 sm:py-10 md:py-12 font-sans overflow-hidden">
      {/* 1. Enhanced Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 mb-8 sm:mb-10 md:mb-12">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 font-bold text-[10px] uppercase tracking-[0.2em] mb-2">
            <Sparkles size={14} />
            <span>Curated For Your Kitchen</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 tracking-tight font-['Outfit']">
            Featured <span className="text-emerald-600">Freshness</span>
          </h2>
        </div>

        {/* 2. Interaction: Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide w-full sm:w-auto scrollbar-hide">
          <div className="flex bg-slate-50 p-1 rounded-xl sm:rounded-2xl border border-slate-100 snap-start">
            {filterOptions.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 text-xs sm:text-sm rounded-2xl font-bold transition-all duration-300 ${
                  activeFilter === filter
                    ? "bg-white text-emerald-600 shadow-sm border border-slate-100"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
          <button className="p-2.5 sm:p-3 bg-slate-900 text-white rounded-2xl hover:bg-black transition-all shadow-lg shadow-slate-200">
            <Filter size={18} />
          </button>
        </div>
      </div>

      {/* 3. Responsive Product Grid with Animations */}
      <motion.div
        layout
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5 md:gap-6"
      >
        <AnimatePresence mode="popLayout">
          {filteredProducts.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
            >
              <ProductCard product={item} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* 4. Bottom CTA: "View More" */}
      <div className="mt-10 sm:mt-12 md:mt-16 text-center">
        <button
          onClick={() => navigate("/category/all")}
          className="group inline-flex items-center gap-4 bg-white border border-slate-200 px-5 sm:px-8 md:px-10 py-2.5 sm:py-3 md:py-4 rounded-[1.5rem] font-bold text-slate-800 hover:border-emerald-500 hover:text-emerald-600 transition-all shadow-sm hover:shadow-xl hover:shadow-emerald-50/40"
        >
          Explore All Products
          <ArrowRight
            size={20}
            className="group-hover:translate-x-2 transition-transform"
          />
        </button>
      </div>
    </section>
  );
};

export default Products;
