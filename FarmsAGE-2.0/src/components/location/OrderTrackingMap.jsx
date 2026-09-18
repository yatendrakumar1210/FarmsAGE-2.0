import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import { Truck, Navigation, MapPin, Clock, Phone, ShieldCheck, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

// Custom Icon for Customer Home
const customerIcon = L.divIcon({
  className: "tracking-customer-pin",
  html: `
    <div style="transform: translate(-50%, -100%); display: flex; flex-direction: column; align-items: center;">
      <div style="background: #0f172a; color: #fff; font-size: 10px; font-weight: 800; padding: 2px 7px; border-radius: 9999px; margin-bottom: 2px; white-space: nowrap; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
        🏠 Your Door
      </div>
      <div style="width: 32px; height: 32px; background: #10b981; border: 3px solid #ffffff; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); box-shadow: 0 4px 12px rgba(16,185,129,0.4); display: flex; align-items: center; justify-content: center;">
        <div style="width: 8px; height: 8px; background: #ffffff; border-radius: 50%; transform: rotate(45deg);"></div>
      </div>
    </div>
  `,
  iconSize: [0, 0],
  iconAnchor: [0, 0],
});

// Custom Icon for Dark Store / Vendor
const storeIcon = L.divIcon({
  className: "tracking-store-pin",
  html: `
    <div style="transform: translate(-50%, -100%); display: flex; flex-direction: column; align-items: center;">
      <div style="background: #1e293b; color: #f59e0b; font-size: 10px; font-weight: 800; padding: 2px 7px; border-radius: 9999px; margin-bottom: 2px; white-space: nowrap; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
        🏪 Local Dark Store
      </div>
      <div style="width: 32px; height: 32px; background: #f59e0b; border: 3px solid #ffffff; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); box-shadow: 0 4px 12px rgba(245,158,11,0.4); display: flex; align-items: center; justify-content: center;">
        <div style="width: 8px; height: 8px; background: #ffffff; border-radius: 50%; transform: rotate(45deg);"></div>
      </div>
    </div>
  `,
  iconSize: [0, 0],
  iconAnchor: [0, 0],
});

// Custom Icon for Delivery Partner
const riderIcon = L.divIcon({
  className: "tracking-rider-pin",
  html: `
    <div style="transform: translate(-50%, -50%); width: 36px; height: 36px; background: #0f172a; border: 2.5px solid #10b981; border-radius: 50%; box-shadow: 0 4px 14px rgba(16,185,129,0.4); display: flex; align-items: center; justify-content: center; color: #10b981; font-size: 16px;">
      🛵
    </div>
  `,
  iconSize: [0, 0],
  iconAnchor: [0, 0],
});

// Fit map bounds to encompass store, customer, and rider
const MapBoundsController = ({ points }) => {
  const map = useMap();
  useEffect(() => {
    if (points && points.length > 1) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    }
  }, [points, map]);
  return null;
};

const OrderTrackingMap = ({ order }) => {
  // Default coordinates (Delhi) or order's saved coords
  const customerLat = order?.deliveryAddress?.latitude || 28.6139;
  const customerLng = order?.deliveryAddress?.longitude || 77.209;

  // Simulate local vendor store at ~1.5 km distance
  const storeLat = customerLat + 0.009;
  const storeLng = customerLng - 0.008;

  // Intermediate rider position along the route
  const riderLat = customerLat + 0.004;
  const riderLng = customerLng - 0.0035;

  const routePositions = [
    [storeLat, storeLng],
    [riderLat, riderLng],
    [customerLat, customerLng],
  ];

  const status = order?.status || "Placed";

  const getStatusDisplay = () => {
    switch (status) {
      case "Placed":
      case "Pending":
        return {
          title: "Order Placed & Confirmed",
          eta: "20–25 Mins",
          sub: "Store is prepping your fresh items",
          progress: 25,
        };
      case "Packing":
      case "Processing":
      case "Accepted":
        return {
          title: "Items Quality Checked & Packed",
          eta: "15–20 Mins",
          sub: "Delivery partner assigned",
          progress: 55,
        };
      case "OutForDelivery":
        return {
          title: "Out for Express Delivery",
          eta: "8–12 Mins",
          sub: "Delivery partner is on the way to your door",
          progress: 80,
        };
      case "Delivered":
        return {
          title: "Order Delivered!",
          eta: "Delivered",
          sub: "Enjoy your farm-fresh harvest",
          progress: 100,
        };
      default:
        return {
          title: "Order Received",
          eta: "25 Mins",
          sub: "Processing with high priority",
          progress: 30,
        };
    }
  };

  const statusInfo = getStatusDisplay();

  return (
    <div className="bg-white rounded-3xl sm:rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
      {/* Top Delivery Header Banner */}
      <div className="p-4 sm:p-6 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Truck size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                Live Delivery Tracking
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <h3 className="text-base sm:text-lg font-black text-white font-['Outfit']">
              {statusInfo.title}
            </h3>
            <p className="text-xs text-slate-400 font-medium">{statusInfo.sub}</p>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 flex items-center gap-3 shrink-0">
          <Clock size={18} className="text-amber-400 shrink-0" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
              Estimated Arrival
            </p>
            <p className="text-sm font-black text-white">{statusInfo.eta}</p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 h-1.5">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${statusInfo.progress}%` }}
          transition={{ duration: 0.8 }}
          className="h-full bg-gradient-to-r from-emerald-500 to-teal-400"
        />
      </div>

      {/* Interactive Map View */}
      <div className="h-[280px] sm:h-[340px] w-full relative z-10">
        <MapContainer
          center={[customerLat, customerLng]}
          zoom={14}
          scrollWheelZoom={false}
          className="w-full h-full"
          style={{ zIndex: 1 }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapBoundsController points={routePositions} />

          {/* Route Line */}
          <Polyline
            positions={routePositions}
            pathOptions={{
              color: "#10b981",
              weight: 4,
              dashArray: "8, 8",
              lineCap: "round",
            }}
          />

          {/* Store Pin */}
          <Marker position={[storeLat, storeLng]} icon={storeIcon} />

          {/* Rider Pin */}
          <Marker position={[riderLat, riderLng]} icon={riderIcon} />

          {/* Customer Destination Pin */}
          <Marker position={[customerLat, customerLng]} icon={customerIcon} />
        </MapContainer>
      </div>

      {/* Delivery Details Footer */}
      <div className="p-4 sm:p-5 bg-slate-50/70 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 text-slate-700 font-bold">
          <MapPin size={16} className="text-emerald-600 shrink-0" />
          <span className="truncate max-w-sm">
            {order?.deliveryAddress?.street || "Selected Delivery Location"},{" "}
            {order?.deliveryAddress?.city}
          </span>
        </div>

        <div className="flex items-center gap-2 text-slate-500 font-semibold">
          <ShieldCheck size={16} className="text-emerald-600" />
          <span>Contactless Express Delivery</span>
        </div>
      </div>
    </div>
  );
};

export default OrderTrackingMap;
