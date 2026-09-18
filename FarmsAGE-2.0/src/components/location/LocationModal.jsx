import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Crosshair,
  Plus,
  Check,
  X,
  Home,
  Briefcase,
  Building,
  Navigation,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import MapLocationPicker from "./MapLocationPicker";

const API =
  import.meta.env.MODE === "development"
    ? "http://localhost:3000"
    : "https://farmsage-2-0-2.onrender.com";

const LocationModal = ({ isOpen, onClose, onSelectLocation, currentLocationName }) => {
  const { user } = useAuth();
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [detectingGps, setDetectingGps] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      fetchUserAddresses();
    }
  }, [isOpen, user]);

  const fetchUserAddresses = async () => {
    setLoadingProfile(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch(`${API}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.user && Array.isArray(data.user.addresses)) {
        setSavedAddresses(data.user.addresses);
      }
    } catch (err) {
      console.error("Failed to fetch saved addresses:", err);
    } finally {
      setLoadingProfile(false);
    }
  };

  // 1-Click GPS Detection with Reverse Geocode
  const handleGPSDetect = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
          );
          const data = await res.json();
          const addr = data.address || {};
          const city =
            addr.city || addr.town || addr.village || addr.state_district || "";
          const locality =
            addr.road || addr.suburb || addr.neighbourhood || data.display_name?.split(",")[0] || "My Current Location";
          const fullAddress = data.display_name || `${locality}, ${city}`;

          const locationData = {
            latitude,
            longitude,
            city,
            street: locality,
            pincode: addr.postcode || "",
            fullAddress,
            label: "Current Location",
          };

          localStorage.setItem("detectedLocation", locality || city);
          if (onSelectLocation) onSelectLocation(locationData);
          onClose();
        } catch (err) {
          console.error("GPS reverse geocoding failed:", err);
          alert("GPS captured but address lookup failed. Pick on map instead.");
        } finally {
          setDetectingGps(false);
        }
      },
      (err) => {
        console.error("GPS error:", err);
        setDetectingGps(false);
        alert("Location access denied or unavailable. Please pick location on map.");
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const handleSelectSaved = (addr) => {
    const locName = addr.street || addr.city;
    localStorage.setItem("detectedLocation", locName);
    if (onSelectLocation) onSelectLocation(addr);
    onClose();
  };

  const handleMapLocationConfirmed = async (newLocationData) => {
    const locName = newLocationData.street || newLocationData.city;
    localStorage.setItem("detectedLocation", locName);

    // Save to user profile if logged in
    const token = localStorage.getItem("token");
    if (token) {
      try {
        await fetch(`${API}/api/auth/address`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: user?.name || "Customer",
            phone: user?.phone || "9999999999",
            street: newLocationData.street,
            city: newLocationData.city,
            pincode: newLocationData.pincode,
            houseNumber: newLocationData.houseNumber,
            landmark: newLocationData.landmark,
            latitude: newLocationData.latitude,
            longitude: newLocationData.longitude,
            label: newLocationData.label,
          }),
        });
      } catch (e) {
        console.error("Error persisting address to profile:", e);
      }
    }

    if (onSelectLocation) onSelectLocation(newLocationData);
    setShowMapPicker(false);
    onClose();
  };

  if (!isOpen && !showMapPicker) return null;

  return (
    <>
      {/* Background Overlay */}
      {isOpen && !showMapPicker && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.98 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-t-[2.2rem] sm:rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl border border-slate-100 p-5 sm:p-7 max-h-[88vh] overflow-y-auto pb-8 sm:pb-7"
          >
            {/* Mobile Sheet Drag Handle */}
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-3.5 sm:hidden" />

            {/* Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                  <MapPin size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 font-['Outfit']">
                    Choose Delivery Location
                  </h3>
                  <p className="text-[11px] font-bold text-slate-400">
                    Fast 10-15 minute grocery delivery
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Actions: GPS + Map Pin Button */}
            <div className="py-5 space-y-3">
              {/* GPS Button */}
              <button
                type="button"
                onClick={handleGPSDetect}
                disabled={detectingGps}
                className="w-full p-3.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 flex items-center justify-between transition group text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white text-emerald-600 flex items-center justify-center shadow-sm shrink-0">
                    {detectingGps ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Crosshair size={18} />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-black text-emerald-950">
                      {detectingGps ? "Detecting location..." : "Use Current GPS Location"}
                    </p>
                    <p className="text-[10px] font-semibold text-emerald-700">
                      Enable GPS for instant pinpoint delivery
                    </p>
                  </div>
                </div>
                <ChevronRight
                  size={16}
                  className="text-emerald-600 group-hover:translate-x-1 transition-transform"
                />
              </button>

              {/* Set on Map Button */}
              <button
                type="button"
                onClick={() => setShowMapPicker(true)}
                className="w-full p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/70 flex items-center justify-between transition group text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white text-slate-700 flex items-center justify-center shadow-sm shrink-0">
                    <Navigation size={18} className="text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-800">
                      Set Location on Interactive Map
                    </p>
                    <p className="text-[10px] font-semibold text-slate-400">
                      Drag pin to select exact building or door
                    </p>
                  </div>
                </div>
                <div className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider">
                  Open Map
                </div>
              </button>
            </div>

            {/* Saved Addresses Section */}
            {user && (
              <div className="pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Saved Delivery Addresses
                  </p>
                  <button
                    onClick={() => setShowMapPicker(true)}
                    className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                  >
                    <Plus size={13} /> Add New
                  </button>
                </div>

                {loadingProfile ? (
                  <div className="py-4 text-center text-xs text-slate-400 font-bold flex items-center justify-center gap-2">
                    <Loader2 size={14} className="animate-spin text-emerald-600" />
                    <span>Loading addresses...</span>
                  </div>
                ) : savedAddresses.length > 0 ? (
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {savedAddresses.map((addr, idx) => {
                      const isSelected =
                        currentLocationName &&
                        (currentLocationName.includes(addr.street) ||
                          currentLocationName.includes(addr.city));

                      return (
                        <div
                          key={idx}
                          onClick={() => handleSelectSaved(addr)}
                          className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? "bg-emerald-50/80 border-emerald-400 shadow-sm"
                              : "bg-white border-slate-100 hover:border-slate-200"
                          }`}
                        >
                          <div className="flex items-start gap-2.5 min-w-0 flex-1">
                            <div className="p-1.5 bg-slate-100 text-slate-600 rounded-lg shrink-0 mt-0.5">
                              {addr.label === "Work" ? (
                                <Briefcase size={14} />
                              ) : addr.label === "Other" ? (
                                <Building size={14} />
                              ) : (
                                <Home size={14} />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="text-xs font-black text-slate-800">
                                  {addr.label || "Home"}
                                </p>
                                {addr.houseNumber && (
                                  <span className="text-[10px] text-slate-400 font-medium">
                                    ({addr.houseNumber})
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 font-medium truncate">
                                {addr.street}, {addr.city} {addr.pincode && `• ${addr.pincode}`}
                              </p>
                            </div>
                          </div>
                          {isSelected && (
                            <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                              <Check size={12} strokeWidth={3} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-center py-4 text-xs font-bold text-slate-400">
                    No saved addresses yet. Pick on map to save your home!
                  </p>
                )}
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Full Map Picker Modal */}
      <MapLocationPicker
        isOpen={showMapPicker}
        onClose={() => setShowMapPicker(false)}
        onLocationSelect={handleMapLocationConfirmed}
      />
    </>
  );
};

export default LocationModal;
