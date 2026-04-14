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
  // {
  //   name: "Exotics",
  //   path: "/category/exotics",
  //   id: "exotics",
  //   icon: "https://cdn-icons-png.flaticon.com/512/3075/3075977.png",
  // },
  // {
  //   name: "Seasonal",
  //   path: "/category/seasonal",
  //   id: "seasonal",
  //   icon: "https://cdn-icons-png.flaticon.com/512/869/869869.png",
  // },
  {
    name: "Organic",
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
      <div className="w-full max-w-7xl mx-auto flex">
        {/* Sidebar */}
        <aside className="hidden md:flex flex-col w-56 lg:w-64 flex-shrink-0 border-r border-gray-100 sticky top-16 h-[calc(100vh-64px)] overflow-y-auto pt-4 bg-white">
          <div className="flex flex-col">
            {SIDEBAR_CATEGORIES.map((cat) => {
              const isActive = location.pathname === cat.path;
              return (
                <button
                  key={cat.id}
                  onClick={() => navigate(cat.path)}
                  className={`flex items-center gap-3 px-4 lg:px-6 py-2.5 transition-all border-l-4 ${
                    isActive
                      ? "bg-pink-50 border-pink-500 text-pink-700 font-semibold"
                      : "border-transparent text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <div
                    className={`w-8 h-8 lg:w-10 lg:h-10 rounded-lg flex items-center justify-center p-1.5 ${
                      isActive ? "opacity-100" : "opacity-80 grayscale"
                    }`}
                  >
                    <img
                      src={cat.icon}
                      className="w-full h-full object-contain"
                      alt={cat.name}
                    />
                  </div>

                  <span className="text-xs lg:text-sm text-left leading-tight font-medium truncate">
                    {cat.name}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Right Content */}
        <div className="flex-1 w-full px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 bg-gray-50/30">
          {/* Mobile Categories */}
          <div className="md:hidden flex overflow-x-auto gap-7 pb-4 scrollbar-hide snap-x snap-mandatory">
            {SIDEBAR_CATEGORIES.map((cat) => {
              const isActive = location.pathname === cat.path;
              return (
                <button
                  key={cat.id}
                  onClick={() => navigate(cat.path)}
                  className={`flex flex-col items-center gap-1.5 shrink-0 snap-start ${
                    isActive ? "scale-105" : "opacity-100"
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center p-2 ${
                      isActive
                        ? "bg-green-400 shadow-md"
                        : "bg-white border border-gray-100"
                    }`}
                  >
                    <img
                      src={cat.icon}
                      className={`w-full h-full object-contain ${
                        isActive ? "brightness-0 invert" : ""
                      }`}
                      alt={cat.name}
                    />
                  </div>

                  <span
                    className={`text-[10px] font-bold whitespace-nowrap ${
                      isActive ? "text-pink-600" : "text-gray-400"
                    }`}
                  >
                    {cat.id === "all" ? "All" : cat.name.split(" ").pop()}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
            <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900">
              {title}
            </h2>

            <div className="flex items-center gap-2 bg-white px-2.5 sm:px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm w-fit">
              <span className="text-[10px] sm:text-xs text-gray-400 font-bold uppercase">
                Sort:
              </span>

              <select className="text-[10px] sm:text-xs font-bold text-emerald-600 bg-transparent cursor-pointer outline-none">
                <option>Relevance</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 sm:gap-5 md:gap-6">
            {productsData.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3 }}
                className="h-full"
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


