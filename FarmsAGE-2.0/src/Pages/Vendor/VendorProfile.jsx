import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { MapPin, Save, Loader, Navigation, Clock, AlertCircle, AlertTriangle, CheckCircle2 } from "lucide-react";
import MapLocationPicker from "../../components/location/MapLocationPicker";
import { useAuth } from "../../context/AuthContext";
import "./vendor.css";
import { API_BASE_URL as API } from "../../config/api";

const VendorProfile = () => {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState({
    storeName: "",
    specialty: "",
    storeImage: "",
    storeAddress: "",
    coordinates: { lat: "", lng: "" },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [showMapPicker, setShowMapPicker] = useState(false);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API}/api/vendor/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setProfile({
          storeName: data.storeName || "",
          specialty: data.specialty || "",
          storeImage: data.storeImage || "",
          storeAddress: data.storeAddress || "",
          coordinates: {
            lat: data.coordinates?.lat || "",
            lng: data.coordinates?.lng || "",
          },
        });
        if (data.shopStatus && data.shopStatus !== user?.shopStatus) {
          updateUser({ shopStatus: data.shopStatus });
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch(`${API}/api/vendor/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          storeName: profile.storeName,
          specialty: profile.specialty,
          storeImage: profile.storeImage,
          storeAddress: profile.storeAddress,
          coordinates: {
            lat: profile.coordinates.lat ? Number(profile.coordinates.lat) : null,
            lng: profile.coordinates.lng ? Number(profile.coordinates.lng) : null,
          },
        }),
      });
      if (res.ok) {
        setMessage("Profile updated successfully!");
        // Update user in context & localStorage
        const updatedFields = {
          storeName: profile.storeName,
          specialty: profile.specialty,
          storeImage: profile.storeImage,
          storeAddress: profile.storeAddress,
          coordinates: profile.coordinates,
        };
        updateUser(updatedFields);
      } else {
        const data = await res.json().catch(() => null);
        setMessage(data?.message || "Failed to update profile.");
      }
    } catch (err) {
      setMessage("Failed to update profile.");
      console.error("Save failed:", err);
    } finally {
      setSaving(false);
    }
  };

  const detectLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setProfile((prev) => ({
            ...prev,
            coordinates: {
              lat: position.coords.latitude.toFixed(6),
              lng: position.coords.longitude.toFixed(6),
            },
          }));
          setMessage("Location detected! Don't forget to save.");
        },
        (err) => {
          setMessage("Could not detect location. Please enter manually.");
          console.error("Geolocation error:", err);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      setMessage("Geolocation not supported by your browser.");
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "40vh", color: "#64748b", fontWeight: 600 }}>
        Loading profile...
      </div>
    );
  }

  const shopStatus = user?.shopStatus || "pending";

  return (
    <div className="fade-in">
      {/* ─── Vendor Status Banners ─── */}
      {shopStatus === "pending" && (
        <div style={{
          background: "#fffbeb",
          border: "1.5px solid #fde68a",
          borderRadius: "1rem",
          padding: "1.25rem",
          marginBottom: "1.5rem",
          display: "flex",
          alignItems: "flex-start",
          gap: "1rem"
        }}>
          <Clock size={28} style={{ color: "#d97706", flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.25rem" }}>
              <h3 style={{ fontSize: "0.95rem", fontWeight: 800, color: "#92400e", margin: 0 }}>
                Your vendor application is under review.
              </h3>
              <span style={{
                background: "#fef3c7",
                color: "#b45309",
                border: "1px solid #fde68a",
                fontSize: "0.65rem",
                fontWeight: 900,
                padding: "2px 8px",
                borderRadius: "9999px",
                letterSpacing: "0.05em",
                textTransform: "uppercase"
              }}>
                Status: PENDING
              </span>
            </div>
            <p style={{ fontSize: "0.8rem", color: "#b45309", margin: 0, lineHeight: 1.4 }}>
              Complete your store information and wait for admin approval. Once approved, your products and live vendor dashboard will be fully activated.
            </p>
          </div>
        </div>
      )}

      {shopStatus === "rejected" && (
        <div style={{
          background: "#fef2f2",
          border: "1.5px solid #fecaca",
          borderRadius: "1rem",
          padding: "1.25rem",
          marginBottom: "1.5rem",
          display: "flex",
          alignItems: "flex-start",
          gap: "1rem"
        }}>
          <AlertCircle size={28} style={{ color: "#dc2626", flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.25rem" }}>
              <h3 style={{ fontSize: "0.95rem", fontWeight: 800, color: "#991b1b", margin: 0 }}>
                Vendor Application Not Approved
              </h3>
              <span style={{
                background: "#fee2e2",
                color: "#b91c1c",
                border: "1px solid #fecaca",
                fontSize: "0.65rem",
                fontWeight: 900,
                padding: "2px 8px",
                borderRadius: "9999px",
                letterSpacing: "0.05em",
                textTransform: "uppercase"
              }}>
                Status: REJECTED
              </span>
            </div>
            <p style={{ fontSize: "0.8rem", color: "#b91c1c", margin: 0, lineHeight: 1.4 }}>
              Your application was not approved. You can review and update your store details below for admin reconsideration.
            </p>
          </div>
        </div>
      )}

      {shopStatus === "suspended" && (
        <div style={{
          background: "#fff7ed",
          border: "1.5px solid #fed7aa",
          borderRadius: "1rem",
          padding: "1.25rem",
          marginBottom: "1.5rem",
          display: "flex",
          alignItems: "flex-start",
          gap: "1rem"
        }}>
          <AlertTriangle size={28} style={{ color: "#ea580c", flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.25rem" }}>
              <h3 style={{ fontSize: "0.95rem", fontWeight: 800, color: "#9a3412", margin: 0 }}>
                Vendor Account Suspended
              </h3>
              <span style={{
                background: "#ffedd5",
                color: "#c2410c",
                border: "1px solid #fed7aa",
                fontSize: "0.65rem",
                fontWeight: 900,
                padding: "2px 8px",
                borderRadius: "9999px",
                letterSpacing: "0.05em",
                textTransform: "uppercase"
              }}>
                Status: SUSPENDED
              </span>
            </div>
            <p style={{ fontSize: "0.8rem", color: "#c2410c", margin: 0, lineHeight: 1.4 }}>
              Your vendor store is currently suspended by administration. Product listings and order fulfillment are disabled. Please contact support.
            </p>
          </div>
        </div>
      )}

      {shopStatus === "approved" && (
        <div style={{
          background: "#f0fdf4",
          border: "1.5px solid #bbf7d0",
          borderRadius: "1rem",
          padding: "0.875rem 1.25rem",
          marginBottom: "1.5rem",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem"
        }}>
          <CheckCircle2 size={20} style={{ color: "#16a34a", flexShrink: 0 }} />
          <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#15803d" }}>
            Your store is approved and active on FarmsAGE Marketplace.
          </span>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{
              background: "#dcfce7",
              color: "#15803d",
              border: "1px solid #bbf7d0",
              fontSize: "0.65rem",
              fontWeight: 900,
              padding: "2px 8px",
              borderRadius: "9999px",
              letterSpacing: "0.05em",
              textTransform: "uppercase"
            }}>
              Approved
            </span>
            <Link
              to="/vendor/dashboard"
              style={{
                background: "#16a34a",
                color: "#ffffff",
                fontSize: "0.75rem",
                fontWeight: 700,
                padding: "4px 10px",
                borderRadius: "0.5rem",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px"
              }}
            >
              Dashboard &rarr;
            </Link>
          </div>
        </div>
      )}

      <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#0f172a", marginBottom: "1.5rem", fontFamily: "'Outfit', sans-serif" }}>
        Store Profile
      </h2>

      <div className="vendor-profile-card">
        <h3>🏪 Your Store Information</h3>
        <p style={{ fontSize: "0.82rem", color: "#94a3b8", marginTop: "-1rem", marginBottom: "1.5rem" }}>
          This info is shown to customers when they browse nearby vendors.
        </p>

        <form onSubmit={handleSave}>
          <div className="form-group">
            <label>Store Name</label>
            <input
              type="text"
              placeholder="e.g. Ramesh Organic Farm"
              value={profile.storeName}
              onChange={(e) => setProfile({ ...profile, storeName: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Specialty</label>
            <input
              type="text"
              placeholder="e.g. Fresh Organic Vegetables"
              value={profile.specialty}
              onChange={(e) => setProfile({ ...profile, specialty: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Store Address</label>
            <input
              type="text"
              placeholder="e.g. Shop #4, Main Market, Sector 12"
              value={profile.storeAddress}
              onChange={(e) => setProfile({ ...profile, storeAddress: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Store Image / Banner</label>
            <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap", marginTop: "0.4rem" }}>
              {profile.storeImage ? (
                <div style={{ position: "relative" }}>
                  <img
                    src={profile.storeImage}
                    alt="Store preview"
                    style={{ width: 140, height: 90, objectFit: "cover", borderRadius: 12, border: "2px solid #10b981" }}
                  />
                  <button
                    type="button"
                    onClick={() => setProfile({ ...profile, storeImage: "" })}
                    style={{
                      position: "absolute", top: -8, right: -8, background: "#ef4444", color: "white",
                      border: "none", borderRadius: "50%", width: 22, height: 22, fontSize: 12,
                      cursor: "pointer", fontWeight: "bold"
                    }}
                  >
                    ×
                  </button>
                </div>
              ) : null}
              <label
                style={{
                  padding: "0.6rem 1.2rem", borderRadius: 10, border: "1.5px dashed #10b981",
                  background: "#ecfdf5", color: "#059669", fontSize: "0.8rem", fontWeight: 700,
                  cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6
                }}
              >
                📷 {profile.storeImage ? "Change Image" : "Upload Store Image"}
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setProfile((prev) => ({ ...prev, storeImage: reader.result }));
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
            </div>
          </div>

          {/* Coordinates */}
          <div style={{ marginBottom: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 0 }}>
                Store Location
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowMapPicker(true)}
                  style={{
                    display: "flex", alignItems: "center", gap: 4,
                    padding: "4px 12px", borderRadius: 8,
                    background: "#10b981", border: "none",
                    color: "#ffffff", fontSize: "0.75rem", fontWeight: 700,
                    cursor: "pointer", transition: "all 0.2s",
                  }}
                >
                  <Navigation size={12} /> Select on Map
                </button>
                <button
                  type="button"
                  onClick={detectLocation}
                  style={{
                    display: "flex", alignItems: "center", gap: 4,
                    padding: "4px 12px", borderRadius: 8,
                    background: "#ecfdf5", border: "1px solid #a7f3d0",
                    color: "#059669", fontSize: "0.75rem", fontWeight: 700,
                    cursor: "pointer", transition: "all 0.2s",
                  }}
                >
                  <MapPin size={12} /> Detect GPS
                </button>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <input
                type="number"
                step="any"
                placeholder="Latitude (e.g. 28.5355)"
                value={profile.coordinates.lat}
                onChange={(e) => setProfile({ ...profile, coordinates: { ...profile.coordinates, lat: e.target.value } })}
                style={{ width: "100%", padding: "0.7rem 1rem", border: "1.5px solid #e2e8f0", borderRadius: 10, fontSize: "0.9rem", color: "#334155", outline: "none" }}
              />
              <input
                type="number"
                step="any"
                placeholder="Longitude (e.g. 77.391)"
                value={profile.coordinates.lng}
                onChange={(e) => setProfile({ ...profile, coordinates: { ...profile.coordinates, lng: e.target.value } })}
                style={{ width: "100%", padding: "0.7rem 1rem", border: "1.5px solid #e2e8f0", borderRadius: 10, fontSize: "0.9rem", color: "#334155", outline: "none" }}
              />
            </div>
          </div>

          {message && (
            <div style={{
              padding: "0.6rem 1rem", borderRadius: 10, marginBottom: "1rem",
              fontSize: "0.82rem", fontWeight: 600,
              background: message.includes("success") ? "#f0fdf4" : "#fffbeb",
              color: message.includes("success") ? "#15803d" : "#b45309",
              border: `1px solid ${message.includes("success") ? "#dcfce7" : "#fef3c7"}`,
            }}>
              {message}
            </div>
          )}

          <button type="submit" className="vendor-profile-save" disabled={saving}>
            {saving ? (
              <><Loader size={14} style={{ animation: "spin 1s linear infinite" }} /> Saving...</>
            ) : (
              <><Save size={14} style={{ marginRight: 6 }} /> Save Profile</>
            )}
          </button>
        </form>
      </div>

      <MapLocationPicker
        isOpen={showMapPicker}
        onClose={() => setShowMapPicker(false)}
        onLocationSelect={(data) => {
          setProfile((prev) => ({
            ...prev,
            coordinates: {
              lat: data.latitude.toFixed(6),
              lng: data.longitude.toFixed(6),
            },
          }));
          setMessage("Location selected from map! Don't forget to save.");
          setShowMapPicker(false);
        }}
        initialCoords={
          profile.coordinates.lat && profile.coordinates.lng
            ? { lat: parseFloat(profile.coordinates.lat), lng: parseFloat(profile.coordinates.lng) }
            : null
        }
      />
    </div>
  );
};

export default VendorProfile;
