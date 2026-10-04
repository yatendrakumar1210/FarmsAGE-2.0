import React from "react";
import { motion } from "framer-motion";
import {
  Store,
  PlusCircle,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertTriangle,
  AlertCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const BecomeVendorCard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const role = user?.role?.toLowerCase();
  const shopStatus = user?.shopStatus || "pending";
  const isVendor = role === "vendor";
  const isAdmin = role === "admin";

  // Determine content configuration based on user authentication and vendor status
  let config = {
    badgeIcon: <Store size={13} className="text-amber-400" />,
    badgeText: "FarmsAGE Vendor Partner",
    badgeClass: "bg-amber-500/15 border-amber-500/30 text-amber-400",
    titlePrefix: "Become a Vendor — ",
    titleHighlight: "Signup & Add Your Products",
    titleHighlightColor: "text-emerald-400",
    description:
      "Sell fresh fruits, vegetables, and farm produce directly to local households in your area. Zero setup fees & instant payouts.",
    step1: { icon: <CheckCircle2 size={14} className="text-emerald-400" />, text: "1. Quick Signup" },
    step2: { icon: <PlusCircle size={14} className="text-amber-400" />, text: "2. Upload Products" },
    step3: { icon: <TrendingUp size={14} className="text-teal-400" />, text: "3. Receive Live Orders" },
    primaryBtn: {
      text: "Register as Vendor",
      onClick: () => navigate("/register"),
      show: true,
    },
    secondaryBtn: {
      text: "Vendor Portal",
      icon: <Store size={15} className="text-amber-400" />,
      onClick: () => navigate("/vendor"),
      show: true,
    },
  };

  if (isVendor) {
    if (shopStatus === "approved") {
      config = {
        badgeIcon: <ShieldCheck size={13} className="text-emerald-400" />,
        badgeText: "Verified Vendor Partner",
        badgeClass: "bg-emerald-500/15 border-emerald-500/30 text-emerald-400",
        titlePrefix: "Vendor Console — ",
        titleHighlight: "Manage Store & Live Orders",
        titleHighlightColor: "text-emerald-400",
        description:
          "Welcome back! Access your live store console to manage product catalogs, review customer orders, and track store operations.",
        step1: { icon: <CheckCircle2 size={14} className="text-emerald-400" />, text: "Store Active" },
        step2: { icon: <PlusCircle size={14} className="text-amber-400" />, text: "Catalog Management" },
        step3: { icon: <TrendingUp size={14} className="text-teal-400" />, text: "Live Orders" },
        primaryBtn: {
          text: "Vendor Dashboard",
          onClick: () => navigate("/vendor/dashboard"),
          show: true,
        },
        secondaryBtn: {
          text: "Store Profile",
          icon: <Store size={15} className="text-amber-400" />,
          onClick: () => navigate("/vendor/profile"),
          show: true,
        },
      };
    } else if (shopStatus === "rejected") {
      config = {
        badgeIcon: <AlertCircle size={13} className="text-rose-400" />,
        badgeText: "Application Update Needed",
        badgeClass: "bg-rose-500/15 border-rose-500/30 text-rose-400",
        titlePrefix: "Vendor Onboarding — ",
        titleHighlight: "Update Your Store Profile",
        titleHighlightColor: "text-rose-400",
        description:
          "Your vendor application was not approved. Review and update your store details so the administration team can reconsider your registration.",
        step1: { icon: <AlertCircle size={14} className="text-rose-400" />, text: "Review Feedback" },
        step2: { icon: <PlusCircle size={14} className="text-amber-400" />, text: "Update Details" },
        step3: { icon: <TrendingUp size={14} className="text-teal-400" />, text: "Resubmit for Review" },
        primaryBtn: {
          text: "Update Store Profile",
          onClick: () => navigate("/vendor/profile"),
          show: true,
        },
        secondaryBtn: {
          text: "",
          icon: null,
          onClick: null,
          show: false,
        },
      };
    } else if (shopStatus === "suspended") {
      config = {
        badgeIcon: <AlertTriangle size={13} className="text-orange-400" />,
        badgeText: "Store Account Suspended",
        badgeClass: "bg-orange-500/15 border-orange-500/30 text-orange-400",
        titlePrefix: "Vendor Store — ",
        titleHighlight: "Account Suspended",
        titleHighlightColor: "text-orange-400",
        description:
          "Your vendor store operations are temporarily paused by administration. Please view your store details or contact support for help.",
        step1: { icon: <AlertTriangle size={14} className="text-orange-400" />, text: "Account Inactive" },
        step2: { icon: <Clock size={14} className="text-amber-400" />, text: "Orders Paused" },
        step3: { icon: <ShieldCheck size={14} className="text-teal-400" />, text: "Contact Support" },
        primaryBtn: {
          text: "View Store Profile",
          onClick: () => navigate("/vendor/profile"),
          show: true,
        },
        secondaryBtn: {
          text: "",
          icon: null,
          onClick: null,
          show: false,
        },
      };
    } else {
      // Pending review
      config = {
        badgeIcon: <Clock size={13} className="text-amber-400 animate-pulse" />,
        badgeText: "Vendor Application Under Review",
        badgeClass: "bg-amber-500/15 border-amber-500/30 text-amber-400",
        titlePrefix: "Vendor Onboarding — ",
        titleHighlight: "Application Pending Review",
        titleHighlightColor: "text-amber-400",
        description:
          "Your vendor registration has been received and is currently under review by our team. You can view or update your store details anytime.",
        step1: { icon: <CheckCircle2 size={14} className="text-emerald-400" />, text: "Application Submitted" },
        step2: { icon: <Clock size={14} className="text-amber-400" />, text: "Admin Review Pending" },
        step3: { icon: <Sparkles size={14} className="text-teal-400" />, text: "Store Profile Setup" },
        primaryBtn: {
          text: "View Application & Profile",
          onClick: () => navigate("/vendor/profile"),
          show: true,
        },
        secondaryBtn: {
          text: "",
          icon: null,
          onClick: null,
          show: false,
        },
      };
    }
  } else if (isAdmin) {
    config = {
      badgeIcon: <ShieldCheck size={13} className="text-amber-400" />,
      badgeText: "FarmsAGE Administration",
      badgeClass: "bg-amber-500/15 border-amber-500/30 text-amber-400",
      titlePrefix: "Marketplace Admin — ",
      titleHighlight: "Console & Operations",
      titleHighlightColor: "text-emerald-400",
      description:
        "Manage vendor applications, catalog products, customer fulfillments, and overall marketplace configuration.",
      step1: { icon: <CheckCircle2 size={14} className="text-emerald-400" />, text: "Vendor Approvals" },
      step2: { icon: <PlusCircle size={14} className="text-amber-400" />, text: "Product Catalog" },
      step3: { icon: <TrendingUp size={14} className="text-teal-400" />, text: "Live Orders" },
      primaryBtn: {
        text: "Admin Dashboard",
        onClick: () => navigate("/admin/dashboard"),
        show: true,
      },
      secondaryBtn: {
        text: "Vendor Portal",
        icon: <Store size={15} className="text-amber-400" />,
        onClick: () => navigate("/vendor"),
        show: true,
      },
    };
  }

  return (
    <section className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8 font-sans">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden bg-slate-900 text-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-10 border border-slate-800 shadow-xl shadow-slate-950/20"
      >
        {/* Ambient Gradient Glows (Vendor Console Theme) */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Left Side Info */}
          <div className="flex-1 text-center md:text-left">
            <div className={`inline-flex items-center gap-1.5 border px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider mb-3 ${config.badgeClass}`}>
              {config.badgeIcon}
              <span>{config.badgeText}</span>
            </div>

            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight leading-tight mb-2 font-['Outfit']">
              {config.titlePrefix}
              <span className={config.titleHighlightColor}>{config.titleHighlight}</span>
            </h2>

            <p className="text-slate-400 text-xs sm:text-sm font-medium max-w-xl leading-relaxed mb-4">
              {config.description}
            </p>

            {/* Quick 3-Step / Feature Badges */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 sm:gap-4 text-xs font-bold text-slate-300">
              <span className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/60">
                {config.step1.icon} {config.step1.text}
              </span>
              <span className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/60">
                {config.step2.icon} {config.step2.text}
              </span>
              <span className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/60">
                {config.step3.icon} {config.step3.text}
              </span>
            </div>
          </div>

          {/* Right Side CTAs */}
          <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row items-stretch gap-3 shrink-0 w-full sm:w-auto">
            {config.primaryBtn.show && (
              <button
                onClick={config.primaryBtn.onClick}
                className="group flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black px-6 py-3 rounded-xl text-xs sm:text-sm shadow-lg shadow-emerald-900/30 transition-all duration-200 active:scale-95 cursor-pointer"
              >
                <span>{config.primaryBtn.text}</span>
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
            )}

            {config.secondaryBtn.show && (
              <button
                onClick={config.secondaryBtn.onClick}
                className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-bold px-5 py-3 rounded-xl text-xs sm:text-sm transition-all duration-200 cursor-pointer"
              >
                {config.secondaryBtn.icon}
                <span>{config.secondaryBtn.text}</span>
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </section>
  );
};
export default BecomeVendorCard;
