import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Phone,
  Lock,
  User,
  Store,
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck,
  Leaf,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/logo.jpg";

const API =
  import.meta.env.MODE === "development"
    ? "http://localhost:3000"
    : "https://farmsage-2-0-2.onrender.com";

const Register = () => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("user");
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
    if (!phone || phone.length !== 10) {
      setError("Please enter a valid 10-digit phone number");
      return;
    }
    if (!password || password.length < 4) {
      setError("Password must be at least 4 characters long");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const resp = await fetch(`${API}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, password, role }),
      });
      const data = await resp.json();

      if (resp.ok) {
        login(data.user, data.token);
        if (data.user?.role?.toLowerCase() === "vendor") {
          navigate("/vendor");
        } else {
          navigate("/");
        }
      } else {
        setError(data.message || "Registration failed");
      }
    } catch (err) {
      setError("Server error. Please ensure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center selection:bg-emerald-100 font-sans">
      {/* 1. Hero Background Section (Matching Login Page Aesthetic) */}
      <div className="relative w-full h-[38vh] lg:h-[35vh] overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1400&q=80"
          alt="Fresh Organic Harvest"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-slate-50" />

        {/* Hero Branding Content */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center w-full px-4">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex flex-col items-center"
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-full flex items-center justify-center shadow-2xl mb-3 border-4 border-emerald-400/40 p-1">
              <img
                src={logo}
                alt="FarmsAge Logo"
                className="w-full h-full object-cover rounded-full"
              />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 backdrop-blur-md mb-2">
              <Sparkles size={13} className="text-amber-300 animate-pulse" />
              <span className="text-[11px] font-black uppercase text-emerald-300 tracking-wider">
                India's 100% Organic Marketplace
              </span>
            </div>

            <h1 className="text-white text-3xl sm:text-5xl font-black tracking-tight drop-shadow-lg font-['Outfit']">
              Farms<span className="text-emerald-400">AGE</span> 2.0
            </h1>
          </motion.div>
        </div>
      </div>

      {/* 2. Registration Form Card */}
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="w-full max-w-lg px-4 sm:px-6 -mt-12 relative z-20 pb-16"
      >
        <div className="bg-white rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)] p-6 sm:p-10 border border-slate-100/80">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight font-['Outfit']">
              Create Your Account
            </h2>
            <p className="text-xs text-slate-500 mt-1.5 font-medium">
              Join thousands of customers & local farmers on FarmsAge
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            {/* Account Role Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider ml-1">
                Select Account Type
              </label>
              <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100/80 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setRole("user")}
                  className={`py-3 px-3 rounded-xl font-bold text-xs flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    role === "user"
                      ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/30 scale-[1.02]"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <User size={16} />
                    <span>Customer</span>
                  </div>
                  <span className={`text-[10px] font-normal ${role === "user" ? "text-emerald-100" : "text-slate-400"}`}>
                    Shop Farm Produce
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole("vendor")}
                  className={`py-3 px-3 rounded-xl font-bold text-xs flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    role === "vendor"
                      ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/30 scale-[1.02]"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Store size={16} />
                    <span>Vendor</span>
                  </div>
                  <span className={`text-[10px] font-normal ${role === "vendor" ? "text-emerald-100" : "text-slate-400"}`}>
                    Sell Your Harvest
                  </span>
                </button>
              </div>
            </div>

            {/* Inputs Container */}
            <div className="space-y-3.5 pt-2">
              {/* Name */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 ml-1">
                  Full Name
                </label>
                <div className="flex items-center gap-3 w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3.5 focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all">
                  <User size={18} className="text-slate-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-transparent outline-none text-sm font-bold text-slate-800 placeholder:text-slate-300"
                    required
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 ml-1">
                  Mobile Phone Number
                </label>
                <div className="flex items-center gap-3 w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3.5 focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all">
                  <div className="flex items-center gap-1.5 border-r border-slate-200 pr-3 shrink-0">
                    <img
                      src="https://flagcdn.com/w20/in.png"
                      alt="India Flag"
                      className="w-5 h-3.5 rounded-xs object-cover"
                    />
                    <span className="font-bold text-slate-700 text-sm">
                      +91
                    </span>
                  </div>
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="10-digit Mobile Number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-transparent outline-none text-sm font-bold text-slate-800 placeholder:text-slate-300 tracking-wider"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 ml-1">
                  Password
                </label>
                <div className="flex items-center gap-3 w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3.5 focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all">
                  <Lock size={18} className="text-slate-400 shrink-0" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-transparent outline-none text-sm font-bold text-slate-800 placeholder:text-slate-300"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-400 hover:text-slate-600 transition"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold py-4 rounded-2xl shadow-xl shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] disabled:opacity-70 mt-4"
            >
              {loading ? (
                "Creating Account..."
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-slate-500 font-semibold">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-emerald-600 font-extrabold hover:underline"
              >
                Log In Here
              </Link>
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-around text-slate-400 text-[11px] font-bold">
            <span className="flex items-center gap-1 text-slate-600">
              <CheckCircle2 size={13} className="text-emerald-500" /> 100% Fresh Guarantee
            </span>
            <span className="flex items-center gap-1 text-slate-600">
              <ShieldCheck size={13} className="text-emerald-500" /> Secure Sockets
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
