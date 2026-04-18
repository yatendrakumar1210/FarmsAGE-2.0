import React, { useState } from "react";
import { ArrowRight, UserCircle, Leaf } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API = import.meta.env.MODE === "development" ? "http://localhost:3000" : "https://farmsage-2-0-2.onrender.com";


const CompleteProfile = () => {
  const [name, setName] = useState("");
  const [role, setRole] = useState("user");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter your name");
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
        body: JSON.stringify({ name: name.trim(), role }),
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
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full z-0 opacity-40">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-200 blur-[120px] rounded-full" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-amber-200 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-lg w-full mx-6 bg-white rounded-[3rem] shadow-2xl shadow-emerald-100/50 overflow-hidden relative z-10 border border-gray-100 p-8 md:p-16">
        {/* Header */}
        <div className="flex items-center gap-4 mb-10">
          <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center">
            <UserCircle className="text-emerald-600" size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800">Complete Your Profile</h1>
            <p className="text-slate-500 text-sm font-medium mt-1">
              Just one more step to get started!
            </p>
          </div>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Name Input */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
              Your Name
            </label>
            <input
              type="text"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              className="w-full bg-slate-50 border-2 border-transparent rounded-2xl py-4 px-6 focus:border-emerald-500/20 focus:bg-white focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all font-bold text-slate-800 disabled:opacity-50"
            />
          </div>

          {/* Role Selection */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
              I am a
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole("user")}
                className={`py-4 rounded-2xl font-bold text-sm transition-all border-2 ${
                  role === "user"
                    ? "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-lg shadow-emerald-100"
                    : "bg-slate-50 border-transparent text-slate-600 hover:bg-slate-100"
                }`}
              >
                🛒 Customer
              </button>
              <button
                type="button"
                onClick={() => setRole("vendor")}
                className={`py-4 rounded-2xl font-bold text-sm transition-all border-2 ${
                  role === "vendor"
                    ? "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-lg shadow-emerald-100"
                    : "bg-slate-50 border-transparent text-slate-600 hover:bg-slate-100"
                }`}
              >
                🌾 Vendor
              </button>
            </div>
          </div>

          {error && <p className="text-red-500 text-sm font-bold">{error}</p>}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95 flex items-center justify-center gap-3 group disabled:opacity-70 disabled:active:scale-100"
          >
            {loading ? "Saving..." : "Get Started"}
            {!loading && (
              <ArrowRight
                size={20}
                className="group-hover:translate-x-1 transition-transform"
              />
            )}
          </button>
        </form>

        {/* Branding */}
        <div className="mt-10 flex items-center justify-center gap-2 text-slate-400">
          <Leaf size={14} />
          <span className="text-[10px] font-bold uppercase tracking-widest">
            FarmsAge — Fresh from farm to table
          </span>
        </div>
      </div>
    </div>
  );
};

export default CompleteProfile;


