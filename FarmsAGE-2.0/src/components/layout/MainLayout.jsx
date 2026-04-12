import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronUp, Zap } from "lucide-react";
import Navbar from "./Navbar";
import Footer from "./Footer";

const MainLayout = ({ children }) => {
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Handle "Scroll to Top" visibility
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* 1. Premium Announcement Bar */}
      <div className="bg-emerald-600 text-white py-2 px-3 sm:px-4 overflow-hidden relative">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-center items-center gap-1 sm:gap-2 text-[9px] xs:text-[10px] sm:text-xs font-bold uppercase tracking-wide text-center">
          <Zap size={14} className="fill-current animate-pulse" />
          <span>
            Flash Sale: Get 30% Off on Organic Fruits. Use Code:{" "}
            <span className="underline decoration-wavy underline-offset-4">
              FARM30
            </span>
          </span>
        </div>
      </div>
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
      {/* 6. Background Grain/Texture (Optional for "Organic" vibe) */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.02] z-0 bg-[url('https://www.transparenttextures.com/patterns/p6.png')]"></div>{" "}
    </div>
  );
};

export default MainLayout;
