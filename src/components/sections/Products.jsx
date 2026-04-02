import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, Filter } from "lucide-react";
import ProductCard from "../common/ProductCard";
import products from "../../data/products";

const filterOptions = ["All", "Vegetables", "Fruits", "Dairy", "Organic"];

const Products = () => {
  const [activeFilter, setActiveFilter] = useState("All");

  // Filter logic
  const filteredProducts =
    activeFilter === "All"
      ? products.slice(0, 8)
      : products.filter((p) => p.category === activeFilter).slice(0, 8);

  return (
    <section className="max-w-7xl mx-auto px-6 py-12">
      {/* 1. Enhanced Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm uppercase tracking-widest mb-2">
            <Sparkles size={16} />
            <span>Top Picks for You</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-slate-800">
            Popular <span className="text-emerald-600">Products</span>
          </h2>
        </div>

        {/* 2. Interaction: Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <div className="flex bg-gray-100 p-1 rounded-2xl border border-gray-200">
            {filterOptions.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-5 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${
                  activeFilter === filter
                    ? "bg-white text-emerald-600 shadow-md"
                    : "text-gray-500 hover:text-slate-800"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
          <button className="p-3 bg-slate-800 text-white rounded-2xl hover:bg-slate-700 transition-colors shadow-lg shadow-slate-200">
            <Filter size={18} />
          </button>
        </div>
      </div>

      {/* 3. Responsive Product Grid with Animations */}
      <motion.div
        layout
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8"
      >
        <AnimatePresence mode="popLayout">
          {filteredProducts.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
            >
              <ProductCard product={item} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* 4. Bottom CTA: "View More" */}
      <div className="mt-16 text-center">
        <button 
          onClick={() => window.location.href = '/category/all'}
          className="group inline-flex items-center gap-3 bg-white border-2 border-slate-200 px-10 py-4 rounded-2xl font-black text-slate-800 hover:border-emerald-500 hover:text-emerald-600 transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-emerald-50/50"
        >
          View All Products
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
