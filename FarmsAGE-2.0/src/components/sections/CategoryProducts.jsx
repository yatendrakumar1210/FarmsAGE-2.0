import React, { useState } from "react";
import { motion } from "framer-motion";
import ProductCard from "../common/ProductCard";
import { useNavigate, useLocation } from "react-router-dom";

const SIDEBAR_CATEGORIES = [
  {
    name: "Fresh Vegetables",
    path: "/category/vegetables",
    id: "vegetables",
    icon: "https://cdn-icons-png.flaticon.com/512/2909/2909894.png",
  },
  {
    name: "Fresh Fruits",
    path: "/category/fruits",
    id: "fruits",
    icon: "https://cdn-icons-png.flaticon.com/512/590/590685.png",
  },
  {
    name: "Exotics",
    path: "/category/exotics",
    id: "exotics",
    icon: "https://cdn-icons-png.flaticon.com/512/3075/3075977.png",
  },
  {
    name: "Seasonal",
    path: "/category/seasonal",
    id: "seasonal",
    icon: "https://cdn-icons-png.flaticon.com/512/869/869869.png",
  },
  {
    name: "Organic Store",
    path: "/category/organic",
    id: "organic",
    icon: "https://cdn-icons-png.flaticon.com/512/1046/1046857.png",
  },
  {
    name: "Leafy & Herbs",
    path: "/category/herbs",
    id: "herbs",
    icon: "https://cdn-icons-png.flaticon.com/512/415/415733.png",
  },
  {
    name: "All Products",
    path: "/category/all",
    id: "all",
    icon: "https://cdn-icons-png.flaticon.com/512/1170/1170678.png",
  },
];

const CategoryProducts = ({ title, productsData }) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <section className="bg-white min-h-screen">
      <div className="max-w-[1400px] mx-auto flex pt-4">
        {/* Left Sidebar - Categories */}
        <aside className="w-64 flex-shrink-0 border-r border-gray-100 hidden md:block sticky top-20 h-[calc(100vh-80px)] overflow-y-auto pt-4 shadow-sm">
          <div className="flex flex-col">
            {SIDEBAR_CATEGORIES.map((cat) => {
              const isActive = location.pathname === cat.path;
              return (
                <button
                  key={cat.id}
                  onClick={() => navigate(cat.path)}
                  className={`flex items-center gap-3 px-6 py-3 transition-transform border-r-4 ${
                    isActive
                      ? "bg-emerald-50 border-emerald-500 text-emerald-800 font-black shadow-sm"
                      : "border-transparent text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center p-2 ${isActive ? "bg-white shadow-xl shadow-emerald-100" : "bg-gray-50"}`}
                  >
                    <img
                      src={cat.icon}
                      className="w-full h-full object-contain"
                      alt={cat.name}
                      onError={(e) => {
                        e.target.src =
                          "https://cdn-icons-png.flaticon.com/512/847/847969.png";
                      }}
                    />
                  </div>
                  <span className="text-sm text-left leading-tight font-medium max-w-[100px]">
                    {cat.name}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Right Section - Header + Grid */}
        <div className="flex-1 px-4 md:px-8 py-6 bg-gray-50/30">
          {/* Mobile Category Picker */}
          <div className="md:hidden flex overflow-x-auto gap-3 pb-6 scrollbar-hide -mx-4 px-4">
            {SIDEBAR_CATEGORIES.map((cat) => {
              const isActive = location.pathname === cat.path;
              return (
                <button
                  key={cat.id}
                  onClick={() => navigate(cat.path)}
                  className={`flex flex-col items-center gap-2 shrink-0 transition-all ${
                    isActive ? "scale-105" : "opacity-70"
                  }`}
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center p-2.5 ${
                    isActive ? "bg-emerald-600 shadow-lg shadow-emerald-200" : "bg-white border border-gray-100"
                  }`}>
                    <img
                      src={cat.icon}
                      className={`w-full h-full object-contain ${isActive ? "brightness-0 invert" : ""}`}
                      alt={cat.name}
                      onError={(e) => { e.target.src = "https://cdn-icons-png.flaticon.com/512/847/847969.png"; }}
                    />
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${
                    isActive ? "text-emerald-600" : "text-gray-400"
                  }`}>
                    {cat.id === "all" ? "All" : cat.name.split(' ').pop()}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-black text-gray-900">{title}</h2>
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm">
              <span className="text-xs text-gray-400 font-bold uppercase tracking-tighter">
                Sort By:
              </span>
              <select className="text-xs font-black text-emerald-600 bg-transparent cursor-pointer outline-none">
                <option>Relevance</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {productsData.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3 }}
              >
                <ProductCard product={item} />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CategoryProducts;
