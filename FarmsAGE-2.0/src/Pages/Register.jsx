import React, { useState } from "react";
import { motion } from "framer-motion";
import { Phone, Lock, User, Mail, ArrowRight, ShieldCheck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/logo.jpg";

const API = import.meta.env.MODE === "development" ? "http://localhost:3000" : "https://farmsage-2-0-2.onrender.com";

const Register = () => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
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
        body: JSON.stringify({ name, phone, email, password }),
      });
      const data = await resp.json();

      if (resp.ok) {
        login(data.user, data.token);
        navigate("/");
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
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-slate-100"
      >
        <div className="flex flex-col items-center text-center mb-6">
          <img src={logo} alt="FarmsAge Logo" className="w-16 h-16 rounded-full border-2 border-emerald-100 shadow-md mb-3" />
          <h1 className="text-2xl font-bold text-slate-800 font-['Outfit']">
            Create Account
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Join FarmsAge for farm-fresh fruits & vegetables delivered to your door
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus-within:border-emerald-500 focus-within:bg-white transition-all">
              <User size={18} className="text-slate-400" />
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-transparent outline-none text-sm font-semibold text-slate-800 placeholder:text-slate-400"
                required
              />
            </div>

            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus-within:border-emerald-500 focus-within:bg-white transition-all">
              <Phone size={18} className="text-slate-400" />
              <span className="text-xs font-bold text-slate-500 pr-1">+91</span>
              <input
                type="tel"
                maxLength={10}
                placeholder="10-digit Phone Number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-transparent outline-none text-sm font-semibold text-slate-800 placeholder:text-slate-400"
                required
              />
            </div>

            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus-within:border-emerald-500 focus-within:bg-white transition-all">
              <Mail size={18} className="text-slate-400" />
              <input
                type="email"
                placeholder="Email Address (Optional)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent outline-none text-sm font-semibold text-slate-800 placeholder:text-slate-400"
              />
            </div>

            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus-within:border-emerald-500 focus-within:bg-white transition-all">
              <Lock size={18} className="text-slate-400" />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent outline-none text-sm font-semibold text-slate-800 placeholder:text-slate-400"
                required
              />
            </div>
          </div>

          {error && (
            <p className="text-rose-500 text-xs font-bold text-center mt-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-100 transition-all flex items-center justify-center gap-2 mt-4"
          >
            {loading ? "Creating Account..." : <>Sign Up <ArrowRight size={18} /></>}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-slate-500 font-medium">
            Already have an account?{" "}
            <Link to="/login" className="text-emerald-600 font-bold hover:underline">
              Log In
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
