import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapPin, Star, ArrowLeft, ShoppingCart, Store, ShieldCheck, Clock } from "lucide-react";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import CategoryProducts from "../components/sections/CategoryProducts";
import { motion } from "framer-motion";

const API = import.meta.env.MODE === "development" ? "http://localhost:3000" : "https://farmsage-2-0-2.onrender.com";

const VendorStore = () => {
  const { vendorId } = useParams();
  const navigate = useNavigate();
  const [vendor, setVendor] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [distance, setDistance] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [vendorRes, productsRes] = await Promise.all([
          fetch(`${API}/api/vendor/${vendorId}/info`),
          fetch(`${API}/api/vendor/${vendorId}/products`),
        ]);
        const vendorData = await vendorRes.json();
        const productsData = await productsRes.json();
        setVendor(vendorData);
        setProducts(Array.isArray(productsData) ? productsData : []);

        if (vendorData.coordinates?.lat && vendorData.coordinates?.lng) {
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                const uLat = pos.coords.latitude;
                const uLng = pos.coords.longitude;
                setUserLocation({ lat: uLat, lng: uLng });
                const toRad = (deg) => (deg * Math.PI) / 180;
                const R = 6371;
                const dLat = toRad(vendorData.coordinates.lat - uLat);
                const dLon = toRad(vendorData.coordinates.lng - uLng);
                const a =
                  Math.sin(dLat / 2) ** 2 +
                  Math.cos(toRad(uLat)) * Math.cos(toRad(vendorData.coordinates.lat)) *
                  Math.sin(dLon / 2) ** 2;
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                setDistance((R * c).toFixed(1));
              },
              () => {},
              { enableHighAccuracy: true, timeout: 5000 }
            );
          }
        }
      } catch (err) {
        console.error("Failed to load vendor store:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [vendorId]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-[60vh] flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
        </div>
        <Footer />
      </>
    );
  }

  if (!vendor) {
    return (
      <>
        <Navbar />
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 px-4 text-center">
          <div className="bg-slate-100 p-8 rounded-full">
             <Store size={64} className="text-slate-300" />
          </div>
          <div>
             <h2 className="text-2xl font-black text-slate-800 mb-2">Vendor not found</h2>
             <p className="text-slate-500">The requested store could not be located.</p>
          </div>
          <button 
           onClick={() => navigate("/")} 
           className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-black shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all"
          >
            Return to Marketplace
          </button>
        </div>
        <Footer />
      </>
    );
  }

  const displayName = vendor.storeName || vendor.name || "Vendor Store";

  return (
    <div className="bg-[#F8FAFC] min-h-screen">
      <Navbar />
      
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Vendor Header Hero Card */}
        <section className="relative overflow-hidden bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-emerald-900/5 p-6 sm:p-10 mb-8 sm:mb-12">
           {/* Background Decorative Blob */}
           <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-emerald-50 rounded-full blur-3xl opacity-50" />
           
           <div className="relative flex flex-col md:flex-row items-center md:items-start gap-8">
              {/* Action Buttons & Image */}
              <div className="flex flex-col items-center gap-4 shrink-0">
                 <div className="relative">
                    <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-[2rem] overflow-hidden border-4 border-white shadow-2xl relative z-10">
                       <img 
                          src={vendor.storeImage || "https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&q=80&w=200"} 
                          alt={displayName}
                          className="w-full h-full object-cover"
                       />
                    </div>
                    {/* Floating Status */}
                    <div className="absolute -bottom-2 -right-2 z-20 bg-emerald-500 text-white p-2 rounded-xl shadow-lg border-2 border-white">
                       <ShieldCheck size={16} />
                    </div>
                 </div>

                 <button
                   onClick={() => navigate(-1)}
                   className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-600 px-4 py-2 rounded-xl text-xs font-black transition-all border border-slate-200"
                 >
                   <ArrowLeft size={14} /> Back
                 </button>
              </div>

              {/* Info content */}
              <div className="flex-1 text-center md:text-left pt-2">
                 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div>
                       <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                          {displayName}
                       </h1>
                       <p className="text-emerald-600 font-bold uppercase tracking-[0.2em] text-[10px] sm:text-xs mt-1">
                          {vendor.specialty || "Verified Neighborhood Vendor"}
                       </p>
                    </div>

                    <div className="flex items-center justify-center md:justify-end gap-2">
                       <div className="bg-amber-50 text-amber-700 px-4 py-2 rounded-2xl flex items-center gap-2 border border-amber-100 font-black text-xs">
                          <Star size={16} fill="currentColor" /> 4.9 (2k+ Reviews)
                       </div>
                    </div>
                 </div>

                 <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 sm:gap-4 mb-6">
                    {distance && (
                       <div className="flex items-center gap-2 bg-slate-50 text-slate-700 px-4 py-2 rounded-xl border border-slate-100 text-xs font-bold">
                          <MapPin size={14} className="text-emerald-500" /> {distance} km away
                       </div>
                    )}
                    <div className="flex items-center gap-2 bg-slate-50 text-slate-700 px-4 py-2 rounded-xl border border-slate-100 text-xs font-bold">
                       <Clock size={14} className="text-blue-500" /> Fast Delivery
                    </div>
                    <div className="flex items-center gap-2 bg-slate-50 text-slate-700 px-4 py-2 rounded-xl border border-slate-100 text-xs font-bold">
                       <ShoppingCart size={14} className="text-amber-500" /> {products.length} Items Available
                    </div>
                 </div>

                 <p className="text-slate-500 text-sm sm:text-base max-w-2xl leading-relaxed">
                    Welcome to our digital storefront! We bring the freshest organic produce directly from our farm to your kitchen. Support your local vendor and enjoy premium quality freshness.
                 </p>
              </div>
           </div>
        </section>

        {/* Product Grid Section */}
        <section className="min-h-[400px]">
           {products.length === 0 ? (
             <div className="bg-white rounded-[2.5rem] border border-slate-100 flex flex-col items-center justify-center py-20 text-center shadow-xl shadow-slate-900/5">
               <div className="bg-slate-50 p-8 rounded-full mb-6">
                  <Store size={48} className="text-slate-200" />
               </div>
               <h3 className="text-xl font-black text-slate-800 mb-2">No products available</h3>
               <p className="text-slate-500 max-w-sm">This vendor hasn't added any products yet. Please check back later or explore other vendors.</p>
             </div>
           ) : (
             <CategoryProducts
               title="Available In-Store"
               productsData={products.map((p) => ({
                 ...p,
                 id: p._id,
                 vendorId: vendorId,
                 vendorName: displayName,
               }))}
             />
           )}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default VendorStore;
