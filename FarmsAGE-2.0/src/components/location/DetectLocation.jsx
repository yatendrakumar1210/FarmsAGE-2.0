import React, { useState } from "react";
import { getAddressFromCoords } from "../../utils/getAddress";
import { saveAddress } from "../../services/locationServices";
import { MapPin, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

const DetectLocation = ({ onLocationDetected }) => {
  const [loading, setLoading] = useState(false);
  const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  const detectLocation = () => {
    if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY === "YOUR_GOOGLE_MAPS_API_KEY_HERE") {
      alert("Google Maps API Key is not configured. Please add it to your .env file.");
      // We will still try with the fallback if they click OK, but warning is better.
    }

    setLoading(true);
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      setLoading(false);
      return;
    }

    // Force Real-Time High Accuracy GPS
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          console.log(`Real-time coords detected: ${latitude}, ${longitude}`);

          const addressData = await getAddressFromCoords(latitude, longitude);

          if (addressData) {
            // Save to backend
            await saveAddress({
              address: addressData.fullAddress,
              latitude,
              longitude,
            });

            // Update parent component
            if (onLocationDetected) {
              onLocationDetected(addressData);
            }
          }
        } catch (err) {
          console.error("Processing error:", err);
          alert(
            "GPS data captured but failed to fetch address. Please enter manually.",
          );
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.error("GPS Error:", err);
        let msg = "Real-time location failed.";

        switch (err.code) {
          case err.PERMISSION_DENIED:
            msg =
              "Location Access Denied. Please unblock location in browser settings.";
            break;
          case err.POSITION_UNAVAILABLE:
            msg =
              "GPS Signal Unavailable. Ensure your device GPS is ON and you are in an open area.";
            break;
          case err.TIMEOUT:
            msg = "GPS request timed out. Please try again.";
            break;
          default:
            msg = "An unknown error occurred while getting GPS data.";
        }

        alert(msg);
        setLoading(false);
      },
      {
        enableHighAccuracy: true, // Force Real-time/GPS
        timeout: 20000, // Increased to 20 seconds for a better fix
        maximumAge: 0, // Force bypass of cache
      },
    );
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      onClick={detectLocation}
      disabled={loading}
      className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 sm:py-2 bg-emerald-50 text-emerald-600 rounded-xl font-semibold text-xs sm:text-sm hover:bg-emerald-100 transition-colors border border-emerald-100 mt-2 disabled:opacity-60"
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin shrink-0" />
      ) : (
        <MapPin size={16} className="shrink-0" />
      )}

      <span className="whitespace-nowrap">
        {loading ? "Detecting..." : "Detect My Location"}
      </span>
    </motion.button>
  );
};

export default DetectLocation;


