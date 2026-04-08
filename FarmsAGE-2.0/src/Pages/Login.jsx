import React, { useState } from "react";
import { motion } from "framer-motion";
import { Phone, ArrowRight, ShieldCheck, Leaf } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!phone || phone.length !== 10) {
      setError("Please enter a valid 10-digit phone number");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const resp = await fetch("http://localhost:3000/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone })
      });
      const data = await resp.json();
      if (resp.ok) {
        setIsOtpSent(true);
      } else {
        setError(data.message || "Failed to send OTP");
      }
    } catch (err) {
      setError("Server error. Make sure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp) {
      setError("Please enter a valid OTP");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const resp = await fetch("http://localhost:3000/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp })
      });
      const data = await resp.json();
      if (resp.ok) {
        login(data.user || { phone }, data.token);
        if (data.isNewUser) {
          navigate("/complete-profile");
        } else {
          navigate("/");
        }
      } else {
        setError(data.message || "Invalid OTP");
      }
    } catch (err) {
      setError("Server error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] relative overflow-hidden">
      {/* 1. Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full z-0 opacity-40">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-200 blur-[120px] rounded-full" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-amber-200 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-5xl w-full mx-6 grid lg:grid-cols-2 bg-white rounded-[3rem] shadow-2xl shadow-emerald-100/50 overflow-hidden relative z-10 border border-gray-100">
        {/* Left Side: Visual/Branding (Hidden on mobile) */}
        <div className="hidden lg:block relative bg-emerald-900 overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1500651230702-0e2d8a49d4ad?auto=format&fit=crop&q=80&w=800"
            alt="Farm background"
            className="absolute inset-0 w-full h-full object-cover opacity-60 scale-110 hover:scale-100 transition-transform duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-900 via-emerald-900/20 to-transparent" />

          <div className="absolute bottom-12 left-12 right-12 text-white">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6">
              <Leaf className="text-emerald-400" size={32} />
            </div>
            <h2 className="text-4xl font-black leading-tight mb-4">
              Freshness is just <br />a tap away.
            </h2>
            <p className="text-emerald-100/80 font-medium">
              Join 10,000+ families in Faridabad & Noida getting farm-fresh joy
              daily.
            </p>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="p-8 md:p-16 flex flex-col justify-center">
          <div className="mb-10">
            <h1 className="text-3xl font-black text-slate-800">Welcome Back</h1>
            <p className="text-slate-500 mt-2 font-medium">
              Login to access your fresh basket
            </p>
          </div>

          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                Phone Number
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors">
                  <span className="font-bold text-sm">+91</span>
                </div>
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={isOtpSent || loading}
                  className="w-full bg-slate-50 border-2 border-transparent rounded-2xl py-4 pl-14 pr-6 focus:border-emerald-500/20 focus:bg-white focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all font-bold text-slate-800 tracking-widest disabled:opacity-50"
                />
              </div>
            </div>

            {isOtpSent && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                  Enter OTP
                </label>
                <div className="relative group">
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    disabled={loading}
                    className="w-full bg-slate-50 border-2 border-transparent rounded-2xl py-4 px-6 focus:border-emerald-500/20 focus:bg-white focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all font-bold text-slate-800 tracking-widest disabled:opacity-50"
                  />
                </div>
              </div>
            )}

            {error && <p className="text-red-500 text-sm font-bold">{error}</p>}

            <button
              onClick={isOtpSent ? handleVerifyOtp : handleSendOtp}
              disabled={loading}
              className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95 flex items-center justify-center gap-3 group disabled:opacity-70 disabled:active:scale-100"
            >
              {loading ? "Processing..." : isOtpSent ? "Verify OTP" : "Send OTP"}
              {!loading && (
                <ArrowRight
                  size={20}
                  className="group-hover:translate-x-1 transition-transform"
                />
              )}
            </button>

            {/* Social Logins */}
            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-4 text-slate-400 font-bold tracking-widest">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button className="flex items-center justify-center gap-2 border-2 border-slate-100 py-3 rounded-xl hover:bg-slate-50 transition-all font-bold text-slate-700 text-sm">
                <img
                  src="https://www.svgrepo.com/show/475656/google-color.svg"
                  className="h-5"
                  alt="Google"
                />
                Google
              </button>
              <button className="flex items-center justify-center gap-2 border-2 border-slate-100 py-3 rounded-xl hover:bg-slate-50 transition-all font-bold text-slate-700 text-sm">
                <img
                  src="https://www.svgrepo.com/show/475647/facebook-color.svg"
                  className="h-5"
                  alt="FB"
                />
                Facebook
              </button>
            </div>
          </form>

          <p className="mt-10 text-center text-slate-500 font-medium text-sm">
            New to FarmsAge?{" "}
            <Link
              to="/signup"
              className="text-emerald-600 font-black hover:underline underline-offset-4"
            >
              Create Account
            </Link>
          </p>

          <div className="mt-8 pt-8 border-t border-slate-100 flex justify-center">
            <Link 
              to="/admin" 
              className="group flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-emerald-600 transition-all duration-300"
            >
              <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-all">
                <ShieldCheck size={14} />
              </div>
              <div className="flex flex-col">
                <span className="leading-none">Staff Member?</span>
                <span className="text-[10px] opacity-60">Access Admin Dashboard</span>
              </div>
            </Link>
          </div>

          {/* Trust Footer */}
          <div className="mt-12 flex items-center justify-center gap-2 text-slate-400">
            <ShieldCheck size={16} />
            <span className="text-[10px] font-bold uppercase tracking-widest">
              Secure 256-bit encrypted login
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
