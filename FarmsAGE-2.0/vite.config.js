import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],

  build: {
    // ─── Raise warning threshold slightly ────────────────────────────────
    chunkSizeWarningLimit: 800,

    // ─── Minification ────────────────────────────────────────────────────
    minify: "esbuild",

    // ─── CSS code split — each async chunk gets its own CSS ──────────────
    cssCodeSplit: true,

    rollupOptions: {
      output: {
        manualChunks: {
          // Core React
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          // Lucide icons (500+ icon tree-shaken at build time)
          "ui-icons": ["lucide-react"],
          // Framer Motion (animation, large ~100KB)
          "animation": ["framer-motion"],
          // Leaflet map — only used in Checkout/LocationModal
          "map-vendor": ["leaflet", "react-leaflet"],
          // Google OAuth — only used on Login/Register pages
          "google-auth": ["@react-oauth/google"],
        },
      },
    },
  },

  server: {
    host: true,
  },
});
