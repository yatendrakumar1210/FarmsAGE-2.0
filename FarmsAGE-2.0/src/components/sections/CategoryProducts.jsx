import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ProductCard from "../common/ProductCard";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronRight, Filter, LayoutGrid, List } from "lucide-react";

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
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'list'

  return (
    <section className="bg-[#F8FAFC] min-h-screen">
      {/* Mobile Top Category Bar - Sticky */}
      <div className="md:hidden sticky top-[64px] z-30 bg-white/80 backdrop-blur-xl border-b border-gray-100 flex overflow-x-auto gap-1 px-4 py-3 scrollbar-hide snap-x">
        {SIDEBAR_CATEGORIES.map((cat) => {
          const isActive = location.pathname === cat.path;
          return (
            <button
              key={cat.id}
              onClick={() => navigate(cat.path)}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl shrink-0 snap-start transition-all ${
                isActive 
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200" 
                  : "bg-gray-50 text-gray-500 border border-gray-100"
              }`}
            >
              <img src={cat.icon} className={`w-5 h-5 object-contain ${isActive ? 'brightness-200' : ''}`} alt="" />
              <span className="text-xs font-black uppercase tracking-wider">{cat.name.split(" ").pop()}</span>
            </button>
          );
        })}
      </div>

      <div className="w-full max-w-[1400px] mx-auto flex">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-64 lg:w-72 flex-shrink-0 border-r border-gray-100 sticky top-20 h-[calc(100vh-80px)] overflow-y-auto pt-8 px-4 bg-white">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 ml-4">Categories</h3>
          <div className="flex flex-col gap-2">
            {SIDEBAR_CATEGORIES.map((cat) => {
              const isActive = location.pathname === cat.path;
              return (
                <button
                  key={cat.id}
                  onClick={() => navigate(cat.path)}
                  className={`flex items-center justify-between group px-5 py-4 rounded-[1.5rem] transition-all ${
                    isActive
                      ? "bg-emerald-50 text-emerald-800"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center p-2 transition-transform group-hover:scale-110 ${isActive ? 'bg-emerald-500 shadow-md' : 'bg-slate-100'}`}>
                      <img src={cat.icon} className={`w-full h-full object-contain ${isActive ? 'brightness-200' : ''}`} alt={cat.name} />
                    </div>
                    <span className={`text-[13px] font-black ${isActive ? 'tracking-tight' : 'tracking-normal'}`}>{cat.name}</span>
                  </div>
                  <ChevronRight size={16} className={`transition-transform ${isActive ? 'translate-x-0' : '-translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0'}`} />
                </button>
              );
            })}
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 w-full px-4 sm:px-6 lg:px-10 py-6 sm:py-10">
          {/* Page Header */}
          <div className="flex flex-col gap-6 mb-8 sm:mb-12">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                   <div className="w-8 h-1 bg-emerald-500 rounded-full" />
                   <p className="text-[10px] sm:text-xs font-black text-emerald-600 uppercase tracking-[0.2em]">Fresh Harvest</p>
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
                  {title}
                </h1>
              </div>

              {/* View Toggles (Desktop Only) */}
              <div className="hidden sm:flex items-center bg-white p-1 rounded-2xl border border-slate-100 shadow-sm">
                 <button 
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
                 >
                    <LayoutGrid size={20} />
                 </button>
                 <button 
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
                 >
                    <List size={20} />
                 </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
               <button className="flex items-center gap-2 bg-white px-5 py-3 rounded-2xl border border-slate-100 shadow-sm text-xs font-black text-slate-700 hover:bg-slate-50 shrink-0">
                  <Filter size={14} className="text-emerald-500" /> Filters
               </button>
               <div className="h-6 w-px bg-slate-200 shrink-0" />
               <select className="bg-white px-5 py-3 rounded-2xl border border-slate-100 shadow-sm text-xs font-black text-slate-700 outline-none cursor-pointer shrink-0">
                  <option>Relevance</option>
                  <option>Price: Low to High</option>
                  <option>Price: High to Low</option>
                  <option>Newest First</option>
               </select>
               <div className="bg-emerald-50 text-emerald-700 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider shrink-0 border border-emerald-100">
                  {productsData.length} Products Found
               </div>
            </div>
          </div>

          {/* Product Grid */}
          <div className={
            viewMode === 'grid' 
              ? "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8"
              : "flex flex-col gap-4"
          }>
            <AnimatePresence>
              {productsData.map((item, idx) => (
                <motion.div
                  key={item.id || idx}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                  className="h-full"
                >
                  <ProductCard product={item} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Empty State */}
          {productsData.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
               <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                  <LayoutGrid size={40} className="text-slate-300" />
               </div>
               <h3 className="text-xl font-black text-slate-900 mb-2">No Products Found</h3>
               <p className="text-slate-500 font-medium">Try adjusting your filters or checking another category.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default CategoryProducts;


