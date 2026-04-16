import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapPin, Star, ArrowLeft, ShoppingCart, Store } from "lucide-react";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import CategoryProducts from "../components/sections/CategoryProducts";

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

        // Try to calculate distance if we have vendor coordinates
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
              () => { /* ignore geolocation error */ },
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
        <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", fontSize: "1rem", fontWeight: 600 }}>
          Loading vendor store...
        </div>
        <Footer />
      </>
    );
  }

  if (!vendor) {
    return (
      <>
        <Navbar />
        <div style={{ minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
          <Store size={48} style={{ color: "#cbd5e1" }} />
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#334155" }}>Vendor not found</h2>
          <button onClick={() => navigate("/")} style={{ padding: "8px 24px", borderRadius: 10, background: "#059669", color: "white", border: "none", fontWeight: 700, cursor: "pointer" }}>
            Go Home
          </button>
        </div>
        <Footer />
      </>
    );
  }

  const displayName = vendor.storeName || vendor.name || "Vendor Store";

  return (
    <>
      <Navbar />
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 16px" }}>
        {/* Vendor Header */}
        <div style={{
          background: "linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 50%, #f8fafc 100%)",
          borderRadius: 24,
          padding: "1.5rem 2rem",
          marginTop: "1rem",
          marginBottom: "1.5rem",
          border: "1px solid #d1fae5",
          display: "flex",
          alignItems: "center",
          gap: "1.5rem",
          flexWrap: "wrap",
        }}>
          {/* Back button */}
          <button
            onClick={() => navigate(-1)}
            style={{
              width: 40, height: 40, borderRadius: 12,
              background: "white", border: "1px solid #e2e8f0",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", flexShrink: 0, transition: "all 0.2s",
            }}
          >
            <ArrowLeft size={18} style={{ color: "#64748b" }} />
          </button>

          {/* Store Image */}
          {vendor.storeImage && (
            <img
              src={vendor.storeImage}
              alt={displayName}
              style={{
                width: 80, height: 80, borderRadius: 16,
                objectFit: "cover", border: "3px solid white",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)", flexShrink: 0,
              }}
            />
          )}

          {/* Store Info */}
          <div style={{ flex: 1, minWidth: 200 }}>
            <h1 style={{
              fontSize: "1.5rem", fontWeight: 800, color: "#0f172a",
              fontFamily: "'Outfit', sans-serif", marginBottom: 4,
            }}>
              {displayName}
            </h1>
            {vendor.specialty && (
              <p style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 500, marginBottom: 8 }}>
                {vendor.specialty}
              </p>
            )}
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
              {distance && (
                <span style={{
                  display: "flex", alignItems: "center", gap: 4,
                  fontSize: "0.8rem", fontWeight: 700, color: "#059669",
                  background: "white", padding: "4px 12px", borderRadius: 20,
                  border: "1px solid #a7f3d0",
                }}>
                  <MapPin size={13} /> {distance} km away
                </span>
              )}
              <span style={{
                display: "flex", alignItems: "center", gap: 4,
                fontSize: "0.8rem", fontWeight: 700, color: "#d97706",
                background: "white", padding: "4px 12px", borderRadius: 20,
                border: "1px solid #fef3c7",
              }}>
                <ShoppingCart size={13} /> {products.length} Products
              </span>
            </div>
          </div>
        </div>

        {/* Products */}
        {products.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem 1rem" }}>
            <Store size={48} style={{ color: "#cbd5e1", marginBottom: 16 }} />
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#334155", marginBottom: 8 }}>No products available</h3>
            <p style={{ fontSize: "0.85rem", color: "#94a3b8", maxWidth: 320, margin: "0 auto" }}>
              This vendor hasn't added any products yet. Check back later!
            </p>
          </div>
        ) : (
          <CategoryProducts
            title={`Products from ${displayName}`}
            productsData={products.map((p) => ({
              ...p,
              id: p._id,
              vendorId: vendorId,
              vendorName: displayName,
            }))}
          />
        )}
      </div>
      <Footer />
    </>
  );
};

export default VendorStore;
