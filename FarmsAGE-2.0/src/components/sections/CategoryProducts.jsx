import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ProductCard from "../common/ProductCard";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { ChevronRight, ChevronLeft, LayoutGrid, List, Search, X, Loader2 } from "lucide-react";

import productsData from "../../data/products";
import fruitsData from "../../data/fruits";
import organicData from "../../data/organic";
import dairyData from "../../data/dairy";

const API = import.meta.env.MODE === "development" ? "http://localhost:3000" : "https://farmsage-2-0-2.onrender.com";

const SIDEBAR_CATEGORIES = [
  {
    name: "Fresh Vegetables",
    path: "/category/vegetables",
    id: "vegetables",
    categoryKey: "Vegetables",
    icon: "https://cdn-icons-png.flaticon.com/512/2909/2909894.png",
  },
  {
    name: "Fresh Fruits",
    path: "/category/fruits",
    id: "fruits",
    categoryKey: "Fruits",
    icon: "https://cdn-icons-png.flaticon.com/512/590/590685.png",
  },
  {
    name: "Organic",
    path: "/category/organic",
    id: "organic",
    categoryKey: "Organic",
    icon: "https://cdn-icons-png.flaticon.com/512/1046/1046857.png",
  },
  {
    name: "Leafy & Herbs",
    path: "/category/herbs",
    id: "herbs",
    categoryKey: "Herbs",
    icon: "https://cdn-icons-png.flaticon.com/512/415/415733.png",
  },
  {
    name: "All Products",
    path: "/category/all",
    id: "all",
    categoryKey: "All",
    icon: "https://cdn-icons-png.flaticon.com/512/1170/1170678.png",
  },
];

const checkIsOutOfStock = (p) => {
  if (!p) return true;
  const catName = (p.category || "").toLowerCase();
  const prodName = (p.name || "").toLowerCase();
  const isOrganic = p.isOrganic || catName.includes("organic") || prodName.includes("organic");
  const isFruitsOrVegetables = 
    (catName === "vegetables" || catName === "fruits" || catName === "fresh vegetables" || catName === "fresh fruits") && !isOrganic;

  return (
    !isFruitsOrVegetables ||
    p.quantity === 0 || 
    p.quantity === '0' || 
    p.isOutOfStock === true || 
    p.inStock === false ||
    p.stockStatus === 'out_of_stock'
  );
};

const sortInStockFirst = (list, sortBy = "Relevance") => {
  return [...list].sort((a, b) => {
    const aOut = checkIsOutOfStock(a) ? 1 : 0;
    const bOut = checkIsOutOfStock(b) ? 1 : 0;
    if (aOut !== bOut) {
      return aOut - bOut; // In-stock (0) first, Out-of-stock (1) last
    }
    if (sortBy === "Price: Low to High") {
      return Number(a.price) - Number(b.price);
    } else if (sortBy === "Price: High to Low") {
      return Number(b.price) - Number(a.price);
    }
    return 0;
  });
};

const CategoryProducts = ({ title = "All Products", category = "All", productsData: propProducts = null }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const querySearch = searchParams.get("search") || "";
  const queryPage = parseInt(searchParams.get("page")) || 1;

  const [searchTerm, setSearchTerm] = useState(querySearch);
  const [debouncedSearch, setDebouncedSearch] = useState(querySearch);
  const [sortBy, setSortBy] = useState("Relevance");
  const [viewMode, setViewMode] = useState("grid");

  const [currentPage, setCurrentPage] = useState(queryPage);
  const [products, setProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Sync search input with searchParams
  useEffect(() => {
    setSearchTerm(querySearch);
    setDebouncedSearch(querySearch);
  }, [querySearch]);

  // Debounce search input changes
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      if (searchTerm !== querySearch) {
        setCurrentPage(1);
        if (searchTerm.trim()) {
          setSearchParams({ search: searchTerm.trim(), page: "1" });
        } else {
          setSearchParams({});
        }
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [searchTerm, setSearchParams, querySearch]);

  // Fetch paginated products from API with static fallback
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const limit = 12;

    // If propProducts is explicitly supplied (e.g. VendorStore), paginate locally
    if (propProducts && Array.isArray(propProducts)) {
      let filtered = [...propProducts];
      if (debouncedSearch.trim()) {
        const q = debouncedSearch.toLowerCase().trim();
        filtered = filtered.filter(p => p.name?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q));
      }
      const sorted = sortInStockFirst(filtered, sortBy);
      const total = sorted.length;
      const pages = Math.ceil(total / limit) || 1;
      const startIndex = (currentPage - 1) * limit;
      const paginated = sorted.slice(startIndex, startIndex + limit);

      setProducts(paginated);
      setTotalProducts(total);
      setTotalPages(pages);
      setLoading(false);
      return;
    }

    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(limit),
        sortBy,
      });

      if (category && category !== "All") {
        params.append("category", category);
      }
      if (debouncedSearch.trim()) {
        params.append("search", debouncedSearch.trim());
      }

      const res = await fetch(`${API}/api/products?${params.toString()}`);
      const data = await res.json();

      if (data && Array.isArray(data.products)) {
        const sorted = sortInStockFirst(data.products, sortBy);
        setProducts(sorted);
        setTotalProducts(data.totalProducts || data.products.length);
        setTotalPages(data.totalPages || 1);
        setLoading(false);
        return;
      }
    } catch (err) {
      console.warn("API pagination fetch warning, using static fallback:", err.message);
    }

    // Static Fallback - STRICTLY 12 ITEMS PER PAGE
    let staticList = [...productsData, ...fruitsData, ...organicData, ...dairyData];
    if (category && category !== "All") {
      if (category === "Organic") {
        staticList = staticList.filter(p => p.isOrganic || p.category === "Organic");
      } else {
        staticList = staticList.filter(p => p.category?.toLowerCase() === category.toLowerCase());
      }
    }
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase().trim();
      staticList = staticList.filter(p => p.name?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q));
    }

    const sorted = sortInStockFirst(staticList, sortBy);
    const total = sorted.length;
    const pages = Math.ceil(total / limit) || 1;
    const startIndex = (currentPage - 1) * limit;
    const paginated = sorted.slice(startIndex, startIndex + limit);

    setProducts(paginated);
    setTotalProducts(total);
    setTotalPages(pages);
    setLoading(false);
  }, [category, debouncedSearch, sortBy, currentPage, propProducts]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      const params = {};
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
      if (newPage > 1) params.page = String(newPage);
      setSearchParams(params);
      window.scrollTo({ top: 120, behavior: "smooth" });
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const clearSearch = () => {
    setSearchTerm("");
    setDebouncedSearch("");
    setCurrentPage(1);
    setSearchParams({});
  };

  return (
    <section className="bg-[#F8FAFC] min-h-screen">
      {/* Mobile Top Category Bar - Sticky */}
      <div className="md:hidden sticky top-[56px] z-30 bg-white/90 backdrop-blur-md border-b border-slate-100 flex overflow-x-auto gap-1.5 px-3 py-2.5 scrollbar-hide snap-x">
        {SIDEBAR_CATEGORIES.map((cat) => {
          const isActive = location.pathname === cat.path;
          return (
            <button
              key={cat.id}
              onClick={() => {
                setCurrentPage(1);
                navigate(cat.path);
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl shrink-0 snap-start transition-all ${
                isActive 
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-200" 
                  : "bg-slate-50 text-slate-600 border border-slate-100"
              }`}
            >
              <img src={cat.icon} className={`w-4 h-4 object-contain ${isActive ? 'brightness-200' : ''}`} alt="" />
              <span className="text-[11px] font-black uppercase tracking-wider">{cat.name.split(" ").pop()}</span>
            </button>
          );
        })}
      </div>

      <div className="w-full max-w-[1400px] mx-auto flex">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-64 lg:w-72 flex-shrink-0 border-r border-slate-200/60 sticky top-20 h-[calc(100vh-80px)] overflow-y-auto pt-6 px-4 bg-white/80 backdrop-blur-md">
          <div className="flex items-center justify-between mb-4 px-3">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Shop Categories</h3>
            <span className="text-[9px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">Explore</span>
          </div>

          <div className="flex flex-col gap-2">
            {SIDEBAR_CATEGORIES.map((cat) => {
              const isActive = location.pathname === cat.path;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setCurrentPage(1);
                    navigate(cat.path);
                  }}
                  className={`flex items-center justify-between group px-4 py-3.5 rounded-2xl transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/20"
                      : "text-slate-700 hover:bg-slate-50 hover:text-emerald-700"
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center p-2 transition-transform group-hover:scale-110 ${isActive ? 'bg-white/20' : 'bg-slate-100'}`}>
                      <img src={cat.icon} className={`w-full h-full object-contain ${isActive ? 'brightness-200' : ''}`} alt={cat.name} />
                    </div>
                    <span className={`text-xs font-black ${isActive ? 'tracking-tight text-white' : 'text-slate-800'}`}>{cat.name}</span>
                  </div>
                  <ChevronRight size={16} className={`transition-transform ${isActive ? 'translate-x-0 text-white' : '-translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 text-emerald-600'}`} />
                </button>
              );
            })}
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 w-full px-3 sm:px-6 lg:px-10 py-4 sm:py-10">
          {/* Page Header */}
          <div className="flex flex-col gap-4 sm:gap-6 mb-6 sm:mb-10">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5 mb-1 sm:mb-2">
                   <div className="w-6 sm:w-8 h-1 bg-emerald-500 rounded-full" />
                   <p className="text-[9px] sm:text-xs font-black text-emerald-600 uppercase tracking-[0.2em]">Fresh Harvest</p>
                </div>
                <h1 className="text-xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
                  {debouncedSearch ? `Search: "${debouncedSearch}"` : title}
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

            {/* Filter & Live Search Bar - Mobile Optimized */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
               {/* Live Search Input */}
               <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    placeholder="Search products..."
                    className="w-full bg-white border border-slate-200 rounded-xl sm:rounded-2xl py-2.5 pl-10 pr-9 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-sm"
                  />
                  {searchTerm && (
                    <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1">
                      <X size={14} />
                    </button>
                  )}
               </div>

               {/* Sort & Result Count Row on Mobile */}
               <div className="flex items-center justify-between sm:justify-start gap-2">
                 <select 
                   value={sortBy} 
                   onChange={(e) => {
                     setSortBy(e.target.value);
                     setCurrentPage(1);
                   }}
                   className="bg-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm text-xs font-bold text-slate-700 outline-none cursor-pointer flex-1 sm:flex-none"
                 >
                    <option value="Relevance">Sort: Relevance</option>
                    <option value="Price: Low to High">Price: Low to High</option>
                    <option value="Price: High to Low">Price: High to Low</option>
                    <option value="Newest First">Newest First</option>
                 </select>

                 <div className="bg-emerald-50 text-emerald-700 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-[10px] font-black uppercase tracking-wider border border-emerald-100 flex items-center gap-1.5 shrink-0">
                    {loading && <Loader2 size={12} className="animate-spin text-emerald-600" />}
                    <span>{totalProducts} Found</span>
                 </div>
               </div>
            </div>
          </div>

          {/* Loading Skeleton */}
          {loading && (
            <div className={
              viewMode === 'grid' 
                ? "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-6 lg:gap-8"
                : "flex flex-col gap-3"
            }>
              {Array.from({ length: 12 }).map((_, idx) => (
                <div key={idx} className="bg-white rounded-2xl h-64 sm:h-72 p-3 sm:p-4 border border-slate-100 flex flex-col gap-3 animate-pulse">
                  <div className="w-full h-32 sm:h-36 bg-slate-100 rounded-xl" />
                  <div className="w-3/4 h-3.5 bg-slate-100 rounded-md" />
                  <div className="w-1/2 h-3.5 bg-slate-100 rounded-md mt-auto" />
                </div>
              ))}
            </div>
          )}

          {/* Product Grid - Ultra Responsive */}
          {!loading && (
            <div className={
              viewMode === 'grid' 
                ? "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-6 lg:gap-8"
                : "flex flex-col gap-3"
            }>
              <AnimatePresence mode="popLayout">
                {products.map((item, idx) => (
                  <motion.div
                    key={item._id || item.id || idx}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.25, delay: idx * 0.015 }}
                    className="h-full"
                  >
                    <ProductCard product={item} priority={idx < 4} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Empty State */}
          {!loading && products.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 sm:py-20 text-center">
               <div className="w-20 h-20 sm:w-24 sm:h-24 bg-slate-100 rounded-full flex items-center justify-center mb-4 sm:mb-6">
                  <Search size={36} className="text-slate-300" />
               </div>
               <h3 className="text-lg sm:text-xl font-black text-slate-900 mb-2">No Products Found</h3>
               <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-sm mb-4 px-4">
                 {debouncedSearch ? `We couldn't find any products matching "${debouncedSearch}".` : "No products available in this category."}
               </p>
               {debouncedSearch && (
                 <button onClick={clearSearch} className="px-4 sm:px-5 py-2 sm:py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-xs shadow-md">
                   Clear Search & View All
                 </button>
               )}
            </div>
          )}

          {/* Pagination Controls - Mobile Responsive */}
          {!loading && totalPages > 1 && (
            <div className="mt-8 sm:mt-12 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 border-t border-slate-100 pt-5 sm:pt-6">
              <p className="text-[11px] sm:text-xs font-bold text-slate-500 text-center sm:text-left">
                Page <span className="text-emerald-600 font-extrabold">{currentPage}</span> of{" "}
                <span className="text-slate-800 font-extrabold">{totalPages}</span> ({totalProducts} total)
              </p>

              <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap justify-center">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1 || loading}
                  className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold transition-all bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 shadow-sm"
                >
                  <ChevronLeft size={14} /> Prev
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pNum) => (
                  <button
                    key={pNum}
                    onClick={() => handlePageChange(pNum)}
                    disabled={loading}
                    className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl text-xs font-black transition-all ${
                      pNum === currentPage
                        ? "bg-emerald-600 text-white shadow-md shadow-emerald-200"
                        : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm"
                    }`}
                  >
                    {pNum}
                  </button>
                ))}

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages || loading}
                  className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold transition-all bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 shadow-sm"
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default CategoryProducts;
