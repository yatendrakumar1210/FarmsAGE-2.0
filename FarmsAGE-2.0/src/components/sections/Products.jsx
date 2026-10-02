import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, Filter, AlertCircle, RefreshCw, PackageOpen } from "lucide-react";
import ProductCard from "../common/ProductCard";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../config/api";

const filterOptions = ["All", "Vegetables", "Fruits", "Organic", "Dairy"];

const Products = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState("All");
  const [productList, setProductList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/products?limit=40`);
      if (!res.ok) {
        throw new Error(`Failed to load products (HTTP ${res.status})`);
      }
      const data = await res.json();
      const items = Array.isArray(data) ? data : (data.products || []);
      setProductList(items);
    } catch (err) {
      console.error("Products API error:", err);
      setError("Unable to connect to the product catalog. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Filter & sort logic (in-stock items first)
  const isOutOfStock = (p) => {
    return Number(p.quantity) <= 0 || p.isOutOfStock === true || p.inStock === false;
  };

  const sortInStockFirst = (list) => {
    return [...list].sort((a, b) => (isOutOfStock(a) ? 1 : 0) - (isOutOfStock(b) ? 1 : 0));
  };

  const filteredProducts =
    activeFilter === "All"
      ? sortInStockFirst(productList).slice(0, 10)
      : sortInStockFirst(
          productList.filter((p) => {
            const cat = (p.category || "").toLowerCase();
            const filt = activeFilter.toLowerCase();
            if (filt === "organic") {
              return p.isOrganic || cat === "organic";
            }
            return cat === filt;
          })
        ).slice(0, 10);

  return (
    <section className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-8 sm:py-10 md:py-12 font-sans overflow-hidden">
      {/* 1. Header Section */}
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
        <div className="flex items-center gap-2 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide w-full sm:w-auto">
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

      {/* 3. Dynamic States: Loading, Error, Empty, and Responsive Product Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5 md:gap-6">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs animate-pulse flex flex-col justify-between h-[310px]"
            >
              <div className="w-full h-36 bg-slate-100 rounded-xl mb-3"></div>
              <div className="space-y-2">
                <div className="h-4 bg-slate-100 rounded-md w-3/4"></div>
                <div className="h-3 bg-slate-100 rounded-md w-1/2"></div>
              </div>
              <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-50">
                <div className="h-5 bg-slate-100 rounded-md w-14"></div>
                <div className="h-8 bg-slate-100 rounded-xl w-16"></div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-rose-50/60 border border-rose-100 rounded-3xl p-8 text-center max-w-lg mx-auto my-6">
          <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <AlertCircle size={24} />
          </div>
          <h3 className="text-base font-bold text-slate-800 mb-1">Catalog Connection Notice</h3>
          <p className="text-sm text-slate-500 mb-4">{error}</p>
          <button
            onClick={fetchProducts}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors shadow-xs"
          >
            <RefreshCw size={14} />
            Retry Connection
          </button>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-slate-50 border border-slate-100 rounded-3xl p-10 text-center max-w-md mx-auto my-6">
          <PackageOpen size={36} className="text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700 mb-1">No products found</h3>
          <p className="text-xs text-slate-400 mb-4">No {activeFilter} items are currently in stock in this category.</p>
          <button
            onClick={() => setActiveFilter("All")}
            className="text-xs font-bold text-emerald-600 hover:underline"
          >
            View all categories
          </button>
        </div>
      ) : (
        <motion.div
          layout
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5 md:gap-6"
        >
          <AnimatePresence mode="popLayout">
            {filteredProducts.map((item, idx) => (
              <motion.div
                key={item._id || item.id || idx}
                layout
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3 }}
              >
                <ProductCard product={item} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* 4. Bottom CTA: "View More" */}
      <div className="mt-10 sm:mt-12 md:mt-16 text-center">
        <button
          onClick={() => navigate("/category/all")}
          className="group inline-flex items-center gap-4 bg-white border border-slate-200 px-5 sm:px-8 md:px-10 py-2.5 sm:py-3 md:py-4 rounded-[1.5rem] font-bold text-slate-800 hover:border-emerald-500 hover:text-emerald-600 transition-all shadow-xs hover:shadow-xl hover:shadow-emerald-50/40 cursor-pointer"
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