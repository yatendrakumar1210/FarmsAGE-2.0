import React, { useState, useEffect } from "react";
import {
  Truck,
  User,
  Phone,
  Mail,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Save,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { API_BASE_URL as API } from "../../config/api";

const DeliveryProfile = () => {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || "");
  const [vehicleType, setVehicleType] = useState(
    user?.vehicleDetails?.vehicleType || "Bike"
  );
  const [vehicleNumber, setVehicleNumber] = useState(
    user?.vehicleDetails?.vehicleNumber || ""
  );
  const [drivingLicenceNumber, setDrivingLicenceNumber] = useState(
    user?.drivingLicenceNumber || ""
  );

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API}/api/delivery/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok && data.user) {
          updateUser(data.user);
          setName(data.user.name || "");
          setVehicleType(data.user.vehicleDetails?.vehicleType || "Bike");
          setVehicleNumber(data.user.vehicleDetails?.vehicleNumber || "");
          setDrivingLicenceNumber(data.user.drivingLicenceNumber || "");
        }
      } catch (err) {
        console.error("Failed to load delivery profile", err);
      } finally {
        setFetching(false);
      }
    };

    fetchProfile();
  }, [token]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    setError("");

    try {
      const res = await fetch(`${API}/api/delivery/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          vehicleType,
          vehicleNumber: vehicleNumber.trim().toUpperCase(),
          drivingLicenceNumber: drivingLicenceNumber.trim().toUpperCase(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.user) {
        updateUser(data.user);
        setMsg("Profile updated successfully!");
        if (user?.deliveryStatus === "rejected") {
          setMsg(
            "Profile updated and resubmitted for admin reconsideration! Status is now pending."
          );
        }
      } else {
        setError(data.message || "Failed to update profile.");
      }
    } catch (err) {
      console.error(err);
      setError("Server error while updating profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const deliveryStatus = user?.deliveryStatus || "pending";
  const isSuspended = deliveryStatus === "suspended";

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-16">
      {/* Top Navbar Header */}
      <header className="bg-slate-900 border-b border-slate-800 text-white px-4 sm:px-8 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Truck size={20} />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-1.5">
              Farms<span className="text-emerald-400">AGE</span>
              <span className="text-[10px] uppercase font-black bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">
                Delivery Partner
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">
              Rider Account Onboarding Portal
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition flex items-center gap-1.5"
        >
          <LogOut size={14} />
          <span>Sign Out</span>
        </button>
      </header>

      {/* Main Container */}
      <main className="max-w-2xl mx-auto px-4 pt-8">
        {/* Application Status Banner */}
        <div className="mb-6">
          {deliveryStatus === "pending" && (
            <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200/80 shadow-sm flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                <Clock size={22} className="animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-black text-amber-900 font-['Outfit']">
                  Your delivery partner application is pending admin approval.
                </h3>
                <p className="text-xs text-amber-700 mt-1 leading-relaxed font-medium">
                  Our operations team is currently reviewing your registration details, vehicle compliance, and driving licence. Once approved, you will gain full access to the delivery partner console.
                </p>
              </div>
            </div>
          )}

          {deliveryStatus === "approved" && (
            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 shadow-sm flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <CheckCircle2 size={22} />
              </div>
              <div>
                <h3 className="text-sm font-black text-emerald-900 font-['Outfit']">
                  Application Approved
                </h3>
                <p className="text-xs text-emerald-700 mt-1 leading-relaxed font-medium">
                  Your delivery partner credentials have been verified and approved by the administration. The active delivery console will be accessible in Phase 2.
                </p>
              </div>
            </div>
          )}

          {deliveryStatus === "rejected" && (
            <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 shadow-sm flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <AlertCircle size={22} />
              </div>
              <div>
                <h3 className="text-sm font-black text-rose-900 font-['Outfit']">
                  Application Rejected
                </h3>
                <p className="text-xs text-rose-700 mt-1 leading-relaxed font-medium">
                  Your delivery partner application was rejected by administration. Please correct your vehicle information and driving licence number below, then save changes to resubmit for reconsideration.
                </p>
              </div>
            </div>
          )}

          {deliveryStatus === "suspended" && (
            <div className="p-5 rounded-2xl bg-orange-50 border border-orange-200 shadow-sm flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                <AlertTriangle size={22} />
              </div>
              <div>
                <h3 className="text-sm font-black text-orange-900 font-['Outfit']">
                  Account Suspended
                </h3>
                <p className="text-xs text-orange-700 mt-1 leading-relaxed font-medium">
                  Your delivery partner account has been suspended by administration. Operational access is paused. Please reach out to FarmsAGE administrator for assistance.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Profile Details Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 pb-5 border-b border-slate-100 mb-6">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
              <User size={20} />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 font-['Outfit']">
                Partner Profile & Compliance Details
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Verified registration details for road delivery
              </p>
            </div>
          </div>

          {msg && (
            <div className="p-3 mb-5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-100 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {msg}
            </div>
          )}

          {error && (
            <div className="p-3 mb-5 bg-rose-50 text-rose-600 text-xs font-bold rounded-xl border border-rose-100 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              {error}
            </div>
          )}

          <form onSubmit={handleUpdate} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                disabled={isSuspended}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-emerald-500 focus:outline-none transition disabled:opacity-60"
              />
            </div>

            {/* Read-only contact credentials */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Phone (Registered)
                </label>
                <div className="relative">
                  <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    disabled
                    value={user?.phone || ""}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    disabled
                    value={user?.email || "Not Provided"}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* Vehicle Details */}
            <div className="pt-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">
                Vehicle Information
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Vehicle Type
                  </label>
                  <select
                    disabled={isSuspended}
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-emerald-500 focus:outline-none transition disabled:opacity-60"
                  >
                    <option value="Bike">Motorcycle / Bike</option>
                    <option value="Scooter">Scooter / Moped</option>
                    <option value="Electric Vehicle">Electric Vehicle (EV)</option>
                    <option value="Bicycle">Bicycle</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Vehicle Plate Number
                  </label>
                  <input
                    type="text"
                    disabled={isSuspended}
                    placeholder="e.g. DL 01 AB 1234"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 focus:outline-none transition uppercase disabled:opacity-60"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Driving Licence Number
                </label>
                <div className="relative">
                  <FileText size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    disabled={isSuspended}
                    placeholder="e.g. DL-1420110012345"
                    value={drivingLicenceNumber}
                    onChange={(e) => setDrivingLicenceNumber(e.target.value.toUpperCase())}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 focus:outline-none transition uppercase disabled:opacity-60"
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            {!isSuspended && (
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black shadow-md flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Save size={14} />
                    <span>Save Compliance Details</span>
                  </>
                )}
              </button>
            )}
          </form>
        </div>
      </main>
    </div>
  );
};

export default DeliveryProfile;
