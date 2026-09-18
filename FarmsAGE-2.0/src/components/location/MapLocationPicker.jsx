import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import {
  MapPin,
  Search,
  Crosshair,
  X,
  Check,
  Building,
  Home,
  Briefcase,
  Loader2,
  Navigation,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Custom Blinkit-Style Emerald Map Pin
const createCustomMarker = (labelText = "Delivering Here") => {
  return L.divIcon({
    className: "custom-leaflet-pin",
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%);">
        <div style="background: #0f172a; color: #fff; font-size: 11px; font-weight: 800; padding: 3px 8px; border-radius: 9999px; box-shadow: 0 4px 12px rgba(0,0,0,0.25); white-space: nowrap; margin-bottom: 4px; display: flex; align-items: center; gap: 4px; border: 1px solid rgba(255,255,255,0.2);">
          <span style="color: #10b981;">⚡</span> ${labelText}
        </div>
        <div style="width: 38px; height: 38px; background: #10b981; border: 3px solid #ffffff; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); box-shadow: 0 6px 16px rgba(16,185,129,0.5); display: flex; align-items: center; justify-content: center;">
          <div style="width: 12px; height: 12px; background: #ffffff; border-radius: 50%; transform: rotate(45deg);"></div>
        </div>
        <div style="width: 12px; height: 4px; background: rgba(0,0,0,0.3); border-radius: 50%; filter: blur(1px); margin-top: 2px;"></div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
};

// Map click & pan controller
const MapClickHandler = ({ onPositionChange }) => {
  useMapEvents({
    click(e) {
      onPositionChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

const ChangeMapView = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, 16, { duration: 1.2 });
    }
  }, [center, map]);
  return null;
};

const MapLocationPicker = ({
  isOpen,
  onClose,
  onLocationSelect,
  initialCoords = null,
  initialAddress = null,
}) => {
  // Default coordinates: Connaught Place, New Delhi (central India default)
  const defaultLat = 28.6139;
  const defaultLng = 77.209;

  const [position, setPosition] = useState([
    initialCoords?.lat || defaultLat,
    initialCoords?.lng || defaultLng,
  ]);
  const [addressDetails, setAddressDetails] = useState({
    street: initialAddress?.street || "",
    city: initialAddress?.city || "",
    pincode: initialAddress?.pincode || "",
    state: initialAddress?.state || "",
    formattedAddress: initialAddress?.fullAddress || "",
    houseNumber: initialAddress?.houseNumber || "",
    landmark: initialAddress?.landmark || "",
    name: initialAddress?.name || "",
    phone: initialAddress?.phone || "",
    label: initialAddress?.label || "Home",
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isDetectingGPS, setIsDetectingGPS] = useState(false);
  const [gpsError, setGpsError] = useState("");

  const searchTimeoutRef = useRef(null);

  // Reverse geocoding via OpenStreetMap Nominatim
  const reverseGeocode = async (lat, lng) => {
    setIsGeocoding(true);
    setGpsError("");
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
        {
          headers: {
            "Accept-Language": "en",
          },
        }
      );
      if (!res.ok) throw new Error("Network response error");
      const data = await res.json();

      if (data && data.address) {
        const addr = data.address;
        const streetName =
          addr.road ||
          addr.suburb ||
          addr.neighbourhood ||
          addr.commercial ||
          addr.residential ||
          data.name ||
          "";
        const city =
          addr.city ||
          addr.state_district ||
          addr.town ||
          addr.village ||
          addr.county ||
          "";
        const pincode = addr.postcode || "";
        const state = addr.state || "";

        setAddressDetails((prev) => ({
          ...prev,
          street: streetName || data.display_name?.split(",")[0] || prev.street,
          city: city || prev.city,
          pincode: pincode || prev.pincode,
          state: state || prev.state,
          formattedAddress: data.display_name || prev.formattedAddress,
        }));
      }
    } catch (err) {
      console.warn("Reverse geocode fallback warning:", err);
    } finally {
      setIsGeocoding(false);
    }
  };

  // Initial geocode if needed
  useEffect(() => {
    if (isOpen) {
      if (initialCoords?.lat && initialCoords?.lng) {
        setPosition([initialCoords.lat, initialCoords.lng]);
        reverseGeocode(initialCoords.lat, initialCoords.lng);
      } else {
        // Automatically attempt GPS detection on open if no initial coords
        detectGPSLocation();
      }
    }
  }, [isOpen]);

  // Handle address search suggestions
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (val.trim().length < 3) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            val
          )}&countrycodes=in&addressdetails=1&limit=5`,
          {
            headers: {
              "Accept-Language": "en",
            },
          }
        );
        const data = await res.json();
        setSearchResults(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Location search failed:", err);
      } finally {
        setIsSearching(false);
      }
    }, 400);
  };

  const handleSelectSearchResult = (result) => {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    setPosition([lat, lon]);
    setSearchResults([]);
    setSearchQuery(result.display_name.split(",")[0]);

    const addr = result.address || {};
    setAddressDetails((prev) => ({
      ...prev,
      street:
        addr.road ||
        addr.suburb ||
        addr.neighbourhood ||
        result.display_name.split(",")[0],
      city: addr.city || addr.state_district || addr.town || "",
      pincode: addr.postcode || "",
      state: addr.state || "",
      formattedAddress: result.display_name,
    }));
  };

  // GPS Device Detection
  const detectGPSLocation = () => {
    if (!navigator.geolocation) {
      setGpsError("Geolocation is not supported by your browser");
      return;
    }

    setIsDetectingGPS(true);
    setGpsError("");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setPosition([latitude, longitude]);
        reverseGeocode(latitude, longitude);
        setIsDetectingGPS(false);
      },
      (err) => {
        console.error("GPS detection error:", err);
        setIsDetectingGPS(false);
        setGpsError("Unable to access your GPS location. Please pick manually.");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const handleMarkerDragEnd = (e) => {
    const marker = e.target;
    const pos = marker.getLatLng();
    setPosition([pos.lat, pos.lng]);
    reverseGeocode(pos.lat, pos.lng);
  };

  const handleMapClick = (lat, lng) => {
    setPosition([lat, lng]);
    reverseGeocode(lat, lng);
  };

  const handleSaveAndConfirm = () => {
    if (!addressDetails.street && !addressDetails.city) {
      alert("Please enter your street address or landmark");
      return;
    }

    const payload = {
      ...addressDetails,
      latitude: position[0],
      longitude: position[1],
      fullAddress:
        addressDetails.formattedAddress ||
        `${addressDetails.houseNumber ? addressDetails.houseNumber + ", " : ""}${
          addressDetails.street
        }, ${addressDetails.city} - ${addressDetails.pincode}`,
    };

    if (onLocationSelect) {
      onLocationSelect(payload);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[250] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.98 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="bg-white rounded-t-[2.2rem] sm:rounded-[2.5rem] w-full max-w-4xl h-[92vh] sm:h-auto sm:max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100"
      >
        {/* Mobile Sheet Drag Handle */}
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-2.5 sm:hidden" />

        {/* Header */}
        <div className="p-3.5 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <MapPin size={20} />
            </div>
            <div>
              <h2 className="text-sm sm:text-lg font-black text-slate-900 font-['Outfit']">
                Select Delivery Location
              </h2>
              <p className="text-[10px] sm:text-[11px] font-semibold text-slate-400">
                Move map pin or search for your exact door / address
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"
          >
            <X size={17} />
          </button>
        </div>

        {/* Content Body: Map + Form */}
        <div className="flex-1 overflow-y-auto flex flex-col lg:flex-row">
          {/* Left Column: Interactive Map Canvas */}
          <div className="w-full lg:w-3/5 h-[230px] sm:h-[340px] lg:h-[500px] relative bg-slate-100 shrink-0">
            {/* Search Bar Overlay */}
            <div className="absolute top-3 left-3 right-3 z-[1000]">
              <div className="relative">
                <Search
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Search locality, building, street or apartment..."
                  className="w-full bg-white/95 backdrop-blur-md border border-slate-200 py-3 pl-11 pr-10 rounded-2xl text-xs sm:text-sm font-bold text-slate-800 shadow-lg outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all placeholder:text-slate-400"
                />
                {isSearching && (
                  <Loader2
                    size={16}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-600 animate-spin"
                  />
                )}
                {searchQuery && !isSearching && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSearchResults([]);
                    }}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Suggestions Dropdown */}
              {searchResults.length > 0 && (
                <div className="mt-1.5 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden divide-y divide-slate-50">
                  {searchResults.map((res, i) => (
                    <div
                      key={i}
                      onClick={() => handleSelectSearchResult(res)}
                      className="p-3 hover:bg-emerald-50/70 cursor-pointer flex items-start gap-2.5 transition-colors"
                    >
                      <MapPin
                        size={16}
                        className="text-emerald-600 shrink-0 mt-0.5"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-800 truncate">
                          {res.display_name.split(",")[0]}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {res.display_name}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* GPS Quick Action Button */}
            <button
              onClick={detectGPSLocation}
              disabled={isDetectingGPS}
              className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 z-[1000] bg-white text-slate-800 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl sm:rounded-2xl shadow-xl border border-slate-100 flex items-center gap-1.5 hover:bg-emerald-50 hover:text-emerald-700 transition-all text-[11px] sm:text-xs font-black"
            >
              {isDetectingGPS ? (
                <Loader2 size={14} className="text-emerald-600 animate-spin" />
              ) : (
                <Crosshair size={14} className="text-emerald-600" />
              )}
              <span>{isDetectingGPS ? "Locating..." : "Use GPS"}</span>
            </button>

            {/* Draggable Tip Badge */}
            <div className="hidden min-[420px]:flex absolute bottom-3 left-3 sm:bottom-4 sm:left-4 z-[1000] bg-slate-900/80 backdrop-blur-md text-white px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl text-[9px] sm:text-[10px] font-extrabold items-center gap-1.5 shadow-md">
              <span className="text-amber-400">💡</span>
              <span>Tap or drag pin to your door</span>
            </div>

            {/* Leaflet Map */}
            <MapContainer
              center={position}
              zoom={16}
              scrollWheelZoom={true}
              className="w-full h-full"
              style={{ zIndex: 1 }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <ChangeMapView center={position} />
              <MapClickHandler onPositionChange={handleMapClick} />
              <Marker
                position={position}
                draggable={true}
                eventHandlers={{
                  dragend: handleMarkerDragEnd,
                }}
                icon={createCustomMarker("Pin Your Door")}
              />
            </MapContainer>
          </div>

          {/* Right Column: Address Details Form */}
          <div className="flex-1 p-3.5 sm:p-6 flex flex-col justify-between bg-white space-y-3 sm:space-y-4">
            <div className="space-y-4">
              {/* Detected Location Box */}
              <div className="p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-100/80">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 flex items-center gap-1">
                    <Navigation size={12} />
                    <span>Selected Pin Location</span>
                  </span>
                  {isGeocoding && (
                    <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                      <Loader2 size={10} className="animate-spin" /> Fetching
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm font-black text-slate-800 leading-snug">
                  {addressDetails.street || "Locating address..."}
                </p>
                <p className="text-[11px] font-semibold text-slate-500 truncate mt-0.5">
                  {addressDetails.city} {addressDetails.pincode && `• ${addressDetails.pincode}`}
                </p>
              </div>

              {gpsError && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-xs font-bold text-amber-700">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{gpsError}</span>
                </div>
              )}

              {/* Form Fields */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-extrabold text-slate-700 block mb-1">
                      House / Flat / Floor No. *
                    </label>
                    <input
                      type="text"
                      value={addressDetails.houseNumber}
                      onChange={(e) =>
                        setAddressDetails({
                          ...addressDetails,
                          houseNumber: e.target.value,
                        })
                      }
                      placeholder="e.g. Flat 402, 4th Floor"
                      className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-extrabold text-slate-700 block mb-1">
                      Landmark / Area *
                    </label>
                    <input
                      type="text"
                      value={addressDetails.landmark}
                      onChange={(e) =>
                        setAddressDetails({
                          ...addressDetails,
                          landmark: e.target.value,
                        })
                      }
                      placeholder="e.g. Near City Park"
                      className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-extrabold text-slate-700 block mb-1">
                    Street & Locality
                  </label>
                  <input
                    type="text"
                    value={addressDetails.street}
                    onChange={(e) =>
                      setAddressDetails({
                        ...addressDetails,
                        street: e.target.value,
                      })
                    }
                    placeholder="Street name or society"
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-extrabold text-slate-700 block mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      value={addressDetails.city}
                      onChange={(e) =>
                        setAddressDetails({
                          ...addressDetails,
                          city: e.target.value,
                        })
                      }
                      placeholder="City"
                      className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-extrabold text-slate-700 block mb-1">
                      Pincode
                    </label>
                    <input
                      type="text"
                      value={addressDetails.pincode}
                      onChange={(e) =>
                        setAddressDetails({
                          ...addressDetails,
                          pincode: e.target.value,
                        })
                      }
                      placeholder="Pincode"
                      className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {/* Address Label Chips (Blinkit Style) */}
                <div>
                  <label className="text-[11px] font-extrabold text-slate-700 block mb-1.5">
                    Save Address As
                  </label>
                  <div className="flex items-center gap-2">
                    {[
                      { id: "Home", icon: <Home size={14} />, label: "Home" },
                      { id: "Work", icon: <Briefcase size={14} />, label: "Work" },
                      { id: "Other", icon: <Building size={14} />, label: "Other" },
                    ].map((t) => {
                      const isSelected = addressDetails.label === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() =>
                            setAddressDetails({ ...addressDetails, label: t.id })
                          }
                          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                            isSelected
                              ? "bg-emerald-600 text-white shadow-md shadow-emerald-200"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          {t.icon}
                          <span>{t.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Confirm Action */}
            <div className="pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={handleSaveAndConfirm}
                className="w-full py-3.5 sm:py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm rounded-2xl shadow-xl shadow-emerald-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <Check size={18} />
                <span>Save & Deliver to this Location</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default MapLocationPicker;
