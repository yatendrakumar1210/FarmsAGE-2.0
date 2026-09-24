import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Store, MapPin, Tag, Image as ImageIcon, CheckCircle, AlertCircle, Clock, Mail, Phone, Navigation, Upload, Trash2, Camera } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import DetectLocation from "../../components/location/DetectLocation";
import MapLocationPicker from "../../components/location/MapLocationPicker";

const API = import.meta.env.MODE === "development" ? "http://localhost:3000" : "https://farmsage-2-0-2.onrender.com";

const VendorRegistration = ({ onStatusChange }) => {
  const { user, login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  
  const [formData, setFormData] = useState({
    storeName: user?.storeName || "",
    specialty: user?.specialty || "",
    storeImage: user?.storeImage || "",
    lat: user?.coordinates?.lat || "",
    lng: user?.coordinates?.lng || "",
    storeAddress: user?.storeAddress || "",
    phone: user?.phone || "",
    email: user?.email || "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Image file size must be less than 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, storeImage: reader.result }));
        setError("");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/api/vendor/register-shop`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          storeName: formData.storeName,
          specialty: formData.specialty,
          storeImage: formData.storeImage,
          storeAddress: formData.storeAddress,
          phone: formData.phone,
          email: formData.email,
          coordinates: {
            lat: parseFloat(formData.lat) || 0,
            lng: parseFloat(formData.lng) || 0,
          },
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        // Update local user state and token with the new role
        login(data.user, data.token);
        if (onStatusChange) onStatusChange();
      } else {
        setError(data.message || "Failed to register shop");
      }
    } catch (err) {
      setError("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (user?.shopStatus === "pending") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-6"
        >
          <Clock size={40} className="text-amber-600 animate-pulse" />
        </motion.div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Registration Pending</h2>
        <p className="text-slate-500 max-w-md mx-auto">
          Your shop registration request has been sent to the Admin. Please wait for approval to start managing your products and orders.
        </p>
        <div className="mt-8 p-4 bg-amber-50 rounded-xl border border-amber-100 text-sm text-amber-800">
           Status: <span className="font-bold uppercase">Pending Admin Approval</span>
        </div>
      </div>
    );
  }

  if (user?.shopStatus === "rejected") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6"
        >
          <AlertCircle size={40} className="text-red-600" />
        </motion.div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Registration Rejected</h2>
        <p className="text-slate-500 max-w-md mx-auto">
          Unfortunately, your shop registration was not approved. You can update your details and try again.
        </p>
        <button 
          onClick={() => login({ ...user, shopStatus: 'none' }, localStorage.getItem('token'))}
          className="mt-6 px-6 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition-all"
        >
          Update Details
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden">
        <div className="bg-emerald-600 p-8 text-white">
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Store size={28} />
            Register Your Shop
          </h1>
          <p className="text-emerald-100 mt-2">
            Complete your shop profile to start selling on FarmsAGE.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-2">
                <Store size={16} className="text-emerald-600" />
                Store Name
              </label>
              <input
                type="text"
                name="storeName"
                required
                value={formData.storeName}
                onChange={handleChange}
                placeholder="e.g. Green Valley Organics"
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-3 px-4 focus:border-emerald-500 outline-none transition-all font-medium text-slate-800"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-2">
                <Tag size={16} className="text-emerald-600" />
                Specialty
              </label>
              <input
                type="text"
                name="specialty"
                required
                value={formData.specialty}
                onChange={handleChange}
                placeholder="e.g. Fresh Fruits, Organic Dairy"
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-3 px-4 focus:border-emerald-500 outline-none transition-all font-medium text-slate-800"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <ImageIcon size={16} className="text-emerald-600" />
                  Store Banner / Photo
                </span>
                <span className="text-[11px] font-semibold text-slate-400">
                  PNG, JPG or WEBP (Max 5MB)
                </span>
              </label>

              {formData.storeImage ? (
                <div className="relative group rounded-2xl overflow-hidden border-2 border-emerald-200 bg-slate-900 shadow-md">
                  <img
                    src={formData.storeImage}
                    alt="Store Preview"
                    className="w-full h-44 object-cover group-hover:opacity-90 transition-opacity"
                  />
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <label className="px-3.5 py-2 bg-white/90 hover:bg-white text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-lg transition-transform active:scale-95">
                      <Upload size={14} className="text-emerald-600" />
                      <span>Change Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, storeImage: "" }))}
                      className="px-3.5 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg transition-transform active:scale-95 cursor-pointer"
                    >
                      <Trash2 size={14} />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              ) : (
                <label className="border-2 border-dashed border-slate-200 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/50 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all group text-center">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 group-hover:border-emerald-200 flex items-center justify-center text-slate-400 group-hover:text-emerald-600 shadow-sm mb-2 transition-colors">
                    <Camera size={22} />
                  </div>
                  <p className="text-xs font-extrabold text-slate-700 group-hover:text-emerald-800">
                    Click to upload Store Photo
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Upload your shop logo or storefront photo
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    required={!formData.storeImage}
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <label className="block text-sm font-bold text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <MapPin size={16} className="text-emerald-600" />
                  Store Location on Map
                </span>
                <span className="text-xs font-semibold text-emerald-600">
                  Interactive Map Pinning
                </span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setShowMapPicker(true)}
                  className="p-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-200 cursor-pointer"
                >
                  <Navigation size={16} />
                  <span>Select Location on Map</span>
                </button>

                <DetectLocation onLocationDetected={(data) => {
                  setFormData(prev => ({
                    ...prev,
                    lat: data.latitude,
                    lng: data.longitude,
                    storeAddress: data.fullAddress || prev.storeAddress
                  }));
                }} />
              </div>

              {formData.lat && formData.lng && (
                <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl text-xs text-emerald-900 font-semibold flex items-center justify-between">
                  <span className="flex items-center gap-1.5 truncate pr-2">
                    <MapPin size={14} className="text-emerald-600 shrink-0" />
                    Pinned Pin: <strong className="text-slate-900">{Number(formData.lat).toFixed(4)}, {Number(formData.lng).toFixed(4)}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowMapPicker(true)}
                    className="text-emerald-700 font-black underline hover:text-emerald-900 shrink-0"
                  >
                    Adjust Map Pin
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-2">
                <MapPin size={16} className="text-emerald-600" />
                Full Store Address
              </label>
              <textarea
                name="storeAddress"
                required
                rows={2}
                value={formData.storeAddress}
                onChange={handleChange}
                placeholder="Shop No, Street, Landmark, City, State"
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-3 px-4 focus:border-emerald-500 outline-none transition-all font-medium text-slate-800 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-2">
                  <Phone size={16} className="text-emerald-600" />
                  Contact Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="10-digit mobile"
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-3 px-4 focus:border-emerald-500 outline-none transition-all font-medium text-slate-800"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-2">
                  <Mail size={16} className="text-emerald-600" />
                  Email ID
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="store@example.com"
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-3 px-4 focus:border-emerald-500 outline-none transition-all font-medium text-slate-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-2">
                  <MapPin size={16} className="text-emerald-600" />
                  Latitude
                </label>
                <input
                  type="number"
                  step="any"
                  name="lat"
                  required
                  value={formData.lat}
                  onChange={handleChange}
                  placeholder="28.6139"
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-3 px-4 focus:border-emerald-500 outline-none transition-all font-medium text-slate-800"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-2">
                  <MapPin size={16} className="text-emerald-600" />
                  Longitude
                </label>
                <input
                  type="number"
                  step="any"
                  name="lng"
                  required
                  value={formData.lng}
                  onChange={handleChange}
                  placeholder="77.2090"
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-3 px-4 focus:border-emerald-500 outline-none transition-all font-medium text-slate-800"
                />
              </div>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">
              * Latitude and Longitude help users find shops near them.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-bold text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-3"
          >
            {loading ? "Registering..." : (
              <>
                Submit for Approval
                <CheckCircle size={20} />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Full Leaflet Interactive Map Picker Modal */}
      <MapLocationPicker
        isOpen={showMapPicker}
        onClose={() => setShowMapPicker(false)}
        onLocationSelect={(data) => {
          setFormData((prev) => ({
            ...prev,
            lat: data.latitude,
            lng: data.longitude,
            storeAddress: data.fullAddress || (data.street ? `${data.street}, ${data.city}` : prev.storeAddress),
          }));
          setShowMapPicker(false);
        }}
        initialCoords={
          formData.lat && formData.lng
            ? { lat: parseFloat(formData.lat), lng: parseFloat(formData.lng) }
            : null
        }
      />
    </div>
  );
};

export default VendorRegistration;
