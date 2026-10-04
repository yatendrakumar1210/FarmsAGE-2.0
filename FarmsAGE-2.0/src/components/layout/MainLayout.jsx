import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronUp, Zap } from "lucide-react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { API_BASE_URL as API } from "../../config/api";

const MainLayout = ({ children }) => {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [announcement, setAnnouncement] = useState(() => {
    return localStorage.getItem("farmsage_announcement") || "";
  });

  useEffect(() => {
    let isMounted = true;
    const fetchBroadcast = async () => {
      try {
        const res = await fetch(`${API}/api/admin/broadcast`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            const liveMsg = data.message || "";
            setAnnouncement(liveMsg);
            if (liveMsg) {
              localStorage.setItem("farmsage_announcement", liveMsg);
            } else {
              localStorage.removeItem("farmsage_announcement");
            }
          }
        }
      } catch (err) {
        // Silent fallback
      }
    };
    fetchBroadcast();

    // Handle "Scroll to Top" visibility
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);

    const handleStorage = () => {
      setAnnouncement(localStorage.getItem("farmsage_announcement") || "");
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      isMounted = false;
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* 1. Premium Announcement Bar */}
      {announcement && (
        <div className="bg-emerald-600 text-white py-2 px-3 sm:px-4 overflow-hidden relative">
          <div className="max-w-7xl mx-auto flex flex-wrap justify-center items-center gap-1 sm:gap-2 text-[9px] xs:text-[10px] sm:text-xs font-bold uppercase tracking-wide text-center">
            <Zap size={14} className="fill-current animate-pulse" />
            <span>{announcement}</span>
          </div>
        </div>
      )}
      {/* 2. Sticky Navbar Container */}
      <div className="z-[100]">
        <Navbar />
      </div>
      {/* 3. Smooth Page Content Transition */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 relative">
        <AnimatePresence mode="wait">
          <motion.div
            className="w-full"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
      {/* 4. Footer */}
      <Footer />
      {/* 5. Modern Floating Scroll to Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 20 }}
            onClick={scrollToTop}
            className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 md:bottom-8 md:right-8 z-[90] p-2.5 sm:p-3 bg-emerald-600 text-white rounded-xl sm:rounded-2xl shadow-xl hover:bg-emerald-700 hover:-translate-y-1 transition-all active:scale-95 group"
          >
            <ChevronUp size={24} className="group-hover:animate-bounce" />
          </motion.button>
        )}
      </AnimatePresence>
      {/* Scroll-to-top handled above */}
    </div>
  );
};

export default MainLayout;


