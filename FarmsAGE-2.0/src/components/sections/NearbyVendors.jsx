import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Navigation2, Store, Star, ChevronRight } from "lucide-react";
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

          const vWithDistance = vendors
            .map((v) => ({
              ...v,
              distance: calculateDistance(lat, lon, v.latitude, v.longitude),
            }))
            .filter((v) => v.distance <= 10)
            .sort((a, b) => a.distance - b.distance);

          setSortedVendors(vWithDistance);
          setLocationStatus("success");
        },
        (error) => {
          console.error("Error obtaining location", error);
          setLocationStatus("error");
        },
      );
    } else {
      setLocationStatus("error");
    }
  };

  return (
    <section className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-8 sm:py-10 md:py-12 bg-white font-sans overflow-hidden">
      <div className="bg-[#fbfcff] rounded-[2.5rem] border border-slate-100 p-4 sm:p-6 md:p-8 lg:p-10 relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-50 rounded-full blur-[100px] -z-10 translate-x-1/2 -translate-y-1/2 opacity-60" />

        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 md:gap-8 mb-8 sm:mb-10 md:mb-12">
            <div>
              <div className="flex items-center gap-2 text-emerald-600 font-bold text-[10px] uppercase tracking-[0.2em] mb-3">
                <MapPin size={14} />
                <span>Harvesting Near You</span>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 tracking-tight font-['Outfit']">
                Directly from{" "}
                <span className="text-emerald-600">Local Farms</span>
              </h2>
            </div>

            <div className="shrink-0">
              {locationStatus === "idle" || locationStatus === "error" ? (
                <button
                  onClick={requestLocation}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-600 text-white px-5 sm:px-6 md:px-8 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-semibold shadow-md hover:bg-emerald-700 transition-all text-xs sm:text-sm active:scale-95"
                >
                  <Navigation2 size={16} />
                  Find Farms Near Me
                </button>
              ) : locationStatus === "loading" ? (
                <div className="flex items-center gap-3 text-emerald-600 font-bold px-8 py-3.5 bg-emerald-50 rounded-2xl">
                  <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm">Locating...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2.5 text-emerald-700 bg-emerald-50 px-8 py-3.5 rounded-2xl font-bold text-sm border border-emerald-100">
                  <MapPin size={16} className="text-emerald-500" />
                  Local Access Active
                </div>
              )}
            </div>
          </div>

          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6"
          >
            <AnimatePresence>
              {sortedVendors.length > 0 ? (
                sortedVendors.slice(0, 6).map((vendor) => (
                  <motion.div
                    key={vendor.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.4 }}
                    onClick={() => navigate("/category/all")}
                    className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm hover:shadow-lg transition-all duration-300 border border-slate-100 flex gap-3 sm:gap-4 items-center group cursor-pointer"
                  >
                    <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden shrink-0">
                      <img
                        src={vendor.image}
                        alt={vendor.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-bold text-slate-900 text-sm sm:text-base md:text-lg truncate group-hover:text-emerald-600 transition-colors uppercase tracking-tight">
                          {vendor.name}
                        </h3>
                      </div>
                      <p className="text-xs font-medium text-slate-400 mb-2 truncate">
                        {vendor.specialty}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-sm font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100">
                          <Star size={12} fill="currentColor" />
                          {vendor.rating}
                        </div>
                        {vendor.distance !== undefined && (
                          <div className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                            <ChevronRight
                              size={10}
                              className="text-emerald-500"
                            />
                            {vendor.distance.toFixed(1)} km away
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : locationStatus === "success" ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="col-span-full py-10 sm:py-12 md:py-16 text-center"
                >
                  <div className="bg-white/50 border border-dashed border-slate-200 inline-block p-10 rounded-[2.5rem]">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Store size={32} className="text-slate-300" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">
                      No Farms Nearby Yet
                    </h3>
                    <p className="text-slate-500 max-w-xs mx-auto text-sm font-medium">
                      We're onboarding more farmers daily. Check out our global
                      selection in the meantime!
                    </p>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default NearbyVendors;

