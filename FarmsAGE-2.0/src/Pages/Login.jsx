import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, ArrowRight, ShieldCheck, Leaf, ChevronDown, Mail, Search } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useGoogleLogin } from '@react-oauth/google';
import logo from "../assets/logo.jpg"

const API = import.meta.env.MODE === "development" ? "http://localhost:3000" : "https://farmsage-2-0-2.onrender.com";


const Login = () => {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setLoading(true);
        setError("");
        const res = await fetch(`${API}/api/auth/google`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ access_token: tokenResponse.access_token }),
        });
        const data = await res.json();
        if (res.ok) {
          login(data.user, data.token);
          if (data.isNewUser) {
            navigate("/complete-profile");
          } else {
            navigate("/");
          }
        } else {
          setError(data.message || "Google Login failed");
        }
      } catch (err) {
        setError("Server error during Google Login");
      } finally {
        setLoading(false);
      }
    },
    onError: () => {
      setError("Google Login failed");
    }
  });

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!phone || phone.length !== 10) {
      setError("Please enter a valid 10-digit phone number");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const resp = await fetch(`${API}/api/auth/send-otp`, {
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
      const resp = await fetch(`${API}/api/auth/verify-otp`, {
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
    <div className="min-h-screen bg-white flex flex-col items-center selection:bg-rose-50 font-sans">
      {/* 1. Hero Background Section (Zomato Style) */}
      <div className="relative w-full h-[45vh] lg:h-[40vh] overflow-hidden">
        <img
          src="https://media.istockphoto.com/id/188081154/photo/fruit-market-with-various-colorful-fresh-fruits-and-vegetables.jpg?s=1024x1024&w=is&k=20&c=QoyIKOQXCb7l33tZVCWLtZELfCv39YuRHop4jUHWW0k="
          alt="Fresh Farm"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-white" />

        {/* Branding */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center w-full px-4">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex flex-col items-center"
          >
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl mb-4 border-4 border-emerald-50">
              <img className="rounded-full" src={logo} />
                {/* className="text-emerald-600"
                size={40}
                fill="currentColor"
               */}
            </div>
            <h1 className="text-white text-5xl font-bold tracking-tighter mb-2 drop-shadow-lg font-['Outfit']">
              Farms<span className="text-emerald-400">AGE</span>
            </h1>
            <p className="text-white/90 font-semibold text-lg tracking-tight drop-shadow-md">
              India's #1 Fresh & Organic Harvest App
            </p>
          </motion.div>
        </div>
      </div>

      {/* 2. Login Card Section */}
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="w-full max-w-md px-6 -mt-10 relative z-20"
      >
        <div className="bg-white rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] p-8 md:p-10 border border-slate-50">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
              Login or Signup
            </h2>
          </div>

          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-4">
              <div className="flex items-center gap-3 w-full bg-white border-2 border-slate-100 rounded-2xl px-4 py-4 focus-within:border-emerald-500 transition-all">
                <div className="flex items-center gap-1 border-r border-slate-200 pr-3 cursor-pointer hover:bg-slate-50 rounded-lg transition-colors p-1">
                  <img
                    src="https://flagcdn.com/w20/in.png"
                    alt="India"
                    className="w-5 h-4 rounded-sm object-cover"
                  />
                  <span className="font-bold text-slate-700 text-sm ml-1">
                    +91
                  </span>
                  <ChevronDown size={14} className="text-slate-400" />
                </div>
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="Enter Phone Number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={isOtpSent || loading}
                  className="flex-1 bg-transparent border-none outline-none font-bold text-slate-800 placeholder:text-slate-300 placeholder:font-medium tracking-widest disabled:opacity-50"
                />
              </div>

              <AnimatePresence>
                {isOtpSent && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-2 pt-2">
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="Enter 6-digit OTP"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        disabled={loading}
                        className="w-full bg-emerald-50/30 border-2 border-emerald-100/50 rounded-2xl py-4 px-6 focus:border-emerald-500/20 focus:bg-white focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all font-bold text-slate-800 tracking-[0.5em] text-center placeholder:tracking-normal placeholder:font-medium"
                      />
                      <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest mt-2">
                        OTP sent to +91 {phone}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {error && (
              <p className="text-rose-500 text-xs font-bold text-center">
                {error}
              </p>
            )}

            <button
              onClick={isOtpSent ? handleVerifyOtp : handleSendOtp}
              disabled={loading}
              className="w-full bg-emerald-600 text-white py-4.5 rounded-2xl font-bold text-lg shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-[0.98] disabled:opacity-70"
            >
              {loading ? "Please wait..." : "Continue"}
            </button>

            {/* Zomato Style Divider */}
            <div className="relative flex items-center gap-4 py-4">
              <div className="flex-1 border-t border-slate-100" />
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em] bg-white px-2">
                or
              </span>
              <div className="flex-1 border-t border-slate-100" />
            </div>

            <div className="flex justify-center gap-8">
              <button
                type="button"
                onClick={() => handleGoogleLogin()}
                className="w-12 h-12 rounded-full border border-slate-100 flex items-center justify-center hover:bg-slate-50 transition-all shadow-sm"
              >
                <img
                  src="https://www.svgrepo.com/show/475656/google-color.svg"
                  className="w-6 h-6"
                  alt="Google"
                />
              </button>
              <button
                type="button"
                className="w-12 h-12 rounded-full border border-slate-100 flex items-center justify-center hover:bg-slate-50 transition-all shadow-sm"
              >
                <Mail className="text-slate-400" size={20} />
              </button>
            </div>
          </form>

          <p className="mt-8 text-center text-slate-400 text-xs font-medium">
            By continuing, you agree to our <br />
            <span className="text-slate-600 font-bold border-b border-dotted border-slate-400 cursor-pointer">
              Terms of Service
            </span>{" "}
            &
            <span className="text-slate-600 font-bold border-b border-dotted border-slate-400 cursor-pointer ml-1">
              Privacy Policy
            </span>
          </p>
        </div>

        {/* Footer Links */}
        <div className="mt-8 flex flex-col items-center gap-4 pb-12">
          <Link
            to="/admin"
            className="group flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-emerald-600 transition-colors"
          >
            <div className="w-8 h-8 rounded-full border border-slate-100 flex items-center justify-center group-hover:bg-emerald-50 group-hover:border-emerald-100 transition-all">
              <ShieldCheck size={14} />
            </div>
            Admin Portal
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;


