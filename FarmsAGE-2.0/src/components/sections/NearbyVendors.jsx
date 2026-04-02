import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Navigation2, Store, Star } from "lucide-react";
import vendors from "../../data/vendors";
import { calculateDistance } from "../../utils/location";
import { useNavigate } from "react-router-dom";

const NearbyVendors = () => {
  const navigate = useNavigate();
  const [userLocation, setUserLocation] = useState(null);
  const [sortedVendors, setSortedVendors] = useState(vendors);
  const [locationStatus, setLocationStatus] = useState("idle"); // idle, loading, success, error

  const requestLocation = () => {
    setLocationStatus("loading");
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          setUserLocation({ lat, lon });
          
          // Calculate distance and sort
          const vWithDistance = vendors.map(v => ({
            ...v,
            distance: calculateDistance(lat, lon, v.latitude, v.longitude)
          }));
          
          vWithDistance.sort((a, b) => a.distance - b.distance);
          setSortedVendors(vWithDistance);
          setLocationStatus("success");
        },
        (error) => {
          console.error("Error obtaining location", error);
          setLocationStatus("error");
        }
      );
    } else {
      setLocationStatus("error");
    }
  };



  return (
    <section className="max-w-7xl mx-auto px-6 py-12 bg-emerald-50 rounded-3xl my-12 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-emerald-100 rounded-full blur-3xl opacity-50 z-0"></div>
      
      <div className="relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm uppercase tracking-widest mb-2">
              <MapPin size={16} />
              <span>Local Farms & Shops</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-slate-800">
              Nearby <span className="text-emerald-600">Vendors</span>
            </h2>
          </div>

          <div className="flex items-center">
            {locationStatus === "idle" || locationStatus === "error" ? (
              <button 
                onClick={requestLocation}
                className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-3 rounded-2xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 hover:-translate-y-1 transition-all"
              >
                <Navigation2 size={18} />
                Find Near Me
              </button>
            ) : locationStatus === "loading" ? (
              <div className="flex items-center gap-2 text-emerald-600 font-bold px-5 py-3">
                <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                Locating...
              </div>
            ) : (
              <div className="flex items-center gap-2 text-emerald-700 bg-emerald-100 px-5 py-3 rounded-2xl font-bold">
                <MapPin size={18} />
                Location Active
              </div>
            )}
          </div>
        </div>

        <motion.div 
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence>
            {sortedVendors.slice(0, 6).map((vendor) => (
              <motion.div
                key={vendor.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                onClick={() => navigate('/category/all')}
                className="bg-white rounded-3xl p-5 shadow-sm hover:shadow-xl transition-all duration-300 border border-emerald-100 flex gap-4 items-center group cursor-pointer"
              >
                <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0">
                  <img 
                    src={vendor.image} 
                    alt={vendor.name} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-800 text-lg line-clamp-1">{vendor.name}</h3>
                  <p className="text-sm text-gray-500 mb-2 line-clamp-1">{vendor.specialty}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-sm font-bold text-amber-500">
                      <Star size={14} className="fill-amber-500" />
                      {vendor.rating}
                    </div>
                    {vendor.distance !== undefined && (
                      <div className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg">
                        {vendor.distance.toFixed(1)} km
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
};

export default NearbyVendors;
