import React, { useState, useEffect } from "react";
import { MapPin, Save, Loader, Navigation } from "lucide-react";
import MapLocationPicker from "../../components/location/MapLocationPicker";
import "./vendor.css";

const API = import.meta.env.MODE === "development" ? "http://localhost:3000" : "https://farmsage-2-0-2.onrender.com";

const VendorProfile = () => {
  const [profile, setProfile] = useState({
    storeName: "",
    specialty: "",
    storeImage: "",
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
          coordinates: {
            lat: data.coordinates?.lat || "",
            lng: data.coordinates?.lng || "",
          },
        });
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
          coordinates: {
            lat: profile.coordinates.lat ? Number(profile.coordinates.lat) : null,
            lng: profile.coordinates.lng ? Number(profile.coordinates.lng) : null,
          },
        }),
      });
      if (res.ok) {
        setMessage("Profile updated successfully!");
        // Update local storage user data
        const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
        storedUser.storeName = profile.storeName;
        localStorage.setItem("user", JSON.stringify(storedUser));
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

  return (
    <div className="fade-in">
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
