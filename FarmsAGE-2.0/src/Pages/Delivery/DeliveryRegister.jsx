import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Phone,
  Lock,
  User,
  Mail,
  Truck,
  FileText,
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { API_BASE_URL as API } from "../../config/api";
import logo from "../../assets/logo.jpg";

const DeliveryRegister = () => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [vehicleType, setVehicleType] = useState("Bike");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [drivingLicenceNumber, setDrivingLicenceNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter your full name");
      return;
    }
    if (!phone || phone.trim().length !== 10) {
      setError("Please enter a valid 10-digit phone number");
      return;
    }
    if (!password || password.length < 4) {
      setError("Password must be at least 4 characters long");
      return;
    }
    if (vehicleType !== "Bicycle" && !drivingLicenceNumber.trim()) {
      setError("Driving licence number is required for motorized vehicles");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const resp = await fetch(`${API}/api/delivery/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          password,
          vehicleType,
          vehicleNumber: vehicleNumber.trim().toUpperCase(),
          drivingLicenceNumber: drivingLicenceNumber.trim().toUpperCase(),
        }),
      });

      const data = await resp.json();

      if (resp.ok) {
        login(data.user, data.token);
        navigate("/delivery/profile", { replace: true });
      } else {
        setError(data.message || "Registration failed. Please try again.");
      }
    } catch (err) {
      console.error("Delivery registration error:", err);
      setError("Server error. Please ensure the backend server is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center selection:bg-emerald-100 font-sans pb-16">
      {/* Hero Header */}
      <div className="relative w-full h-[32vh] overflow-hidden bg-slate-900 flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/80 via-slate-900/90 to-slate-900/95" />
        <div className="relative z-10 text-center px-4 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30 mb-3">
            <Truck size={14} />
            <span>FarmsAGE 2.0 Delivery Network</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Delivery Partner Registration
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 font-medium">
            Deliver fresh farm-direct harvest to customers. Earn on your schedule with zero platform base fees.
          </p>
        </div>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-xl px-4 -mt-10 relative z-20">
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-100">
          <div className="flex items-center gap-3 pb-6 border-b border-slate-100 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
              <Truck size={24} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">Partner Application</h2>
              <p className="text-xs text-slate-500 font-medium">
                Submit your vehicle and licence details for admin verification
              </p>
            </div>
          </div>

          {error && (
            <div className="p-3 mb-5 bg-rose-50 text-rose-600 text-xs font-bold rounded-xl border border-rose-100 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Full Name *</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 focus:outline-none transition"
                />
              </div>
            </div>

            {/* Phone & Email Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Phone Number *</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="10-digit mobile"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 focus:outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Email (Optional)</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    placeholder="rider@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 focus:outline-none transition"
                  />
                </div>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Password *</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="At least 4 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 focus:outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Vehicle Details Section */}
            <div className="pt-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">
                Vehicle & Compliance Information
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Vehicle Type *</label>
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-emerald-500 focus:outline-none transition"
                  >
                    <option value="Bike">Motorcycle / Bike</option>
                    <option value="Scooter">Scooter / Moped</option>
                    <option value="Electric Vehicle">Electric Vehicle (EV)</option>
                    <option value="Bicycle">Bicycle</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Vehicle Plate Number</label>
                  <input
                    type="text"
                    placeholder="e.g. DL 01 AB 1234"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 focus:outline-none transition uppercase"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Driving Licence Number {vehicleType !== "Bicycle" && "*"}
                </label>
                <div className="relative">
                  <FileText size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="e.g. DL-1420110012345"
                    value={drivingLicenceNumber}
                    onChange={(e) => setDrivingLicenceNumber(e.target.value.toUpperCase())}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 focus:outline-none transition uppercase"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Submit Partner Application</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          {/* Footer note */}
          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500 font-medium">
              Already an approved delivery partner?{" "}
              <Link to="/login" className="text-emerald-600 font-bold hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryRegister;
