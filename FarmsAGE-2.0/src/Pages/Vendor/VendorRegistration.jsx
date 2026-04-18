import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Store, MapPin, Tag, Image as ImageIcon, CheckCircle, AlertCircle, Clock, Mail, Phone } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import DetectLocation from "../../components/location/DetectLocation";

const API = import.meta.env.MODE === "development" ? "http://localhost:3000" : "https://farmsage-2-0-2.onrender.com";

const VendorRegistration = ({ onStatusChange }) => {
  const { user, login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  
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
              <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-2">
                <ImageIcon size={16} className="text-emerald-600" />
                Store Image URL
              </label>
              <input
                type="url"
                name="storeImage"
                required
                value={formData.storeImage}
                onChange={handleChange}
                placeholder="https://images.unsplash.com/..."
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-3 px-4 focus:border-emerald-500 outline-none transition-all font-medium text-slate-800"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="block text-sm font-bold text-slate-700 flex items-center gap-2">
                <MapPin size={16} className="text-emerald-600" />
                Store Location
              </label>
              <DetectLocation onLocationDetected={(data) => {
                setFormData(prev => ({
                  ...prev,
                  lat: data.latitude,
                  lng: data.longitude,
                  storeAddress: data.fullAddress || prev.storeAddress
                }));
              }} />
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
    </div>
  );
};

export default VendorRegistration;
