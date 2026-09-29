import React, { useState } from "react";
import { ArrowRight, UserCircle, CheckCircle2, Phone, Mail, Package, Headphones, History, User } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL as API } from "../config/api";
import logo from "../assets/logo.jpg";

const CompleteProfile = () => {
  const { user, login } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [role, setRole] = useState(user?.role || "user");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const hasExistingEmail = Boolean(user?.email && user.email.trim() !== "");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }
    
    // Only validate email if user didn't already have one
    const finalEmail = hasExistingEmail ? user.email.trim() : email.trim();
    if (!finalEmail) {
      setError("Please enter your email address");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(finalEmail)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const resp = await fetch(`${API}/api/auth/complete-profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: name.trim(), role, email: finalEmail }),
      });
      const data = await resp.json();
      if (resp.ok) {
        login(data.user, data.token); // Use new token with updated role
        if (role === "vendor") {
          navigate("/vendor");
        } else {
          navigate("/");
        }
      } else {
        setError(data.message || "Failed to update profile");
      }
    } catch (err) {
      setError("Server error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] relative overflow-hidden py-10">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full z-0 opacity-40">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-200 blur-[120px] rounded-full" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-amber-200 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-lg w-full mx-4 sm:mx-6 bg-white rounded-2xl sm:rounded-[3rem] shadow-2xl shadow-emerald-100/50 overflow-hidden relative z-10 border border-gray-100 p-5 sm:p-8 md:p-12 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
          <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center shrink-0">
            <UserCircle className="text-emerald-600" size={30} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 font-['Outfit']">Profile & Account</h1>
            <p className="text-slate-500 text-xs font-medium mt-0.5">
              Review your details and complete registration
            </p>
          </div>
        </div>

        {/* Existing User Details Card */}
        {user && (
          <div className="p-4 bg-gradient-to-br from-slate-900 via-emerald-950 to-teal-950 text-white rounded-3xl shadow-lg border border-emerald-500/20 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-slate-950 font-black flex items-center justify-center text-lg shadow-md shrink-0 border-2 border-emerald-400/40">
                {user.name?.charAt(0).toUpperCase() || <User size={20} />}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-black text-sm text-white truncate font-['Outfit']">
                  {user.name || "FarmsAge User"}
                </h3>
                {user.phone && (
                  <p className="flex items-center gap-1.5 text-[11px] text-emerald-200/90 font-medium mt-0.5">
                    <Phone size={12} className="text-emerald-400 shrink-0" /> {user.phone}
                  </p>
                )}
                {hasExistingEmail && (
                  <p className="flex items-center gap-1.5 text-[11px] text-emerald-300 font-medium mt-0.5 truncate">
                    <Mail size={12} className="text-emerald-400 shrink-0" /> {user.email}
                  </p>
                )}
              </div>
            </div>

            {/* Quick Action Badges */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-emerald-800/60">
              <Link
                to="/my-orders"
                className="flex items-center gap-2 p-2 bg-emerald-900/60 hover:bg-emerald-800/80 border border-emerald-700/50 rounded-xl text-xs font-bold text-emerald-100 transition"
              >
                <History size={14} className="text-emerald-400 shrink-0" />
                <span className="truncate">Order History</span>
              </Link>

              <Link
                to="/contact"
                className="flex items-center gap-2 p-2 bg-emerald-900/60 hover:bg-emerald-800/80 border border-emerald-700/50 rounded-xl text-xs font-bold text-emerald-100 transition"
              >
                <Headphones size={14} className="text-emerald-400 shrink-0" />
                <span className="truncate">Customer Support</span>
              </Link>
            </div>
          </div>
        )}

        <form className="space-y-5" onSubmit={handleSubmit}>
          {/* Name Input */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
              Your Name
            </label>
            <input
              type="text"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              className="w-full bg-slate-50 border-2 border-transparent rounded-2xl py-3.5 px-5 focus:border-emerald-500/20 focus:bg-white focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all font-bold text-slate-800 disabled:opacity-50 text-sm"
            />
          </div>

          {/* Email Input (ONLY shown if user has NOT given email yet) */}
          {!hasExistingEmail ? (
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                Gmail / Email Address
              </label>
              <input
                type="email"
                placeholder="Enter your Gmail address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="w-full bg-slate-50 border-2 border-transparent rounded-2xl py-3.5 px-5 focus:border-emerald-500/20 focus:bg-white focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all font-bold text-slate-800 disabled:opacity-50 text-sm"
              />
            </div>
          ) : (
            <div className="p-3.5 bg-emerald-50/80 border border-emerald-200/80 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                <div>
                  <p className="text-[10px] font-black uppercase text-emerald-800 tracking-wider">Email Verified</p>
                  <p className="text-xs font-bold text-slate-800">{user.email}</p>
                </div>
              </div>
              <span className="text-[9px] font-extrabold bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full">Saved</span>
            </div>
          )}

          {/* Role Selection */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
              Select Account Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole("user")}
                className={`py-3.5 rounded-2xl font-bold text-sm transition-all border-2 ${
                  role === "user"
                    ? "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-md shadow-emerald-100"
                    : "bg-slate-50 border-transparent text-slate-600 hover:bg-slate-100"
                }`}
              >
                🛒 Customer
              </button>
              <button
                type="button"
                onClick={() => setRole("vendor")}
                className={`py-3.5 rounded-2xl font-bold text-sm transition-all border-2 ${
                  role === "vendor"
                    ? "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-md shadow-emerald-100"
                    : "bg-slate-50 border-transparent text-slate-600 hover:bg-slate-100"
                }`}
              >
                🌾 Vendor
              </button>
            </div>
          </div>

          {error && <p className="text-red-500 text-xs font-bold px-1">{error}</p>}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black text-base shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95 flex items-center justify-center gap-3 group disabled:opacity-70 disabled:active:scale-100"
          >
            {loading ? "Saving Profile..." : "Save Profile & Continue"}
            {!loading && (
              <ArrowRight
                size={18}
                className="group-hover:translate-x-1 transition-transform"
              />
            )}
          </button>
        </form>

        {/* Branding */}
        <div className="pt-2 flex items-center justify-center gap-2 text-slate-400">
          <div className="w-5 h-5 rounded-md overflow-hidden flex-shrink-0">
            <img src={logo} alt="FarmsAge" className="w-full h-full object-cover" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest">
            FarmsAge — Fresh from farm to table
          </span>
        </div>
      </div>
    </div>
  );
};

export default CompleteProfile;
