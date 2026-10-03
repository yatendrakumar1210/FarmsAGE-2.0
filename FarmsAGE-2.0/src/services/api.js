/**
 * Centralized API Configuration for FarmsAGE 2.0 Frontend
 *
 * Sources the API base URL from `import.meta.env.VITE_API_URL`.
 * In development mode, falls back to `http://localhost:3000` if not specified.
 * In production mode, requires `VITE_API_URL` to prevent unintentional routing.
 */

const PRODUCTION_FALLBACK_URL = "https://farmsage-2-0-2.onrender.com";

const resolveBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && typeof envUrl === "string" && envUrl.trim().length > 0) {
    return envUrl.trim().replace(/\/+$/, "");
  }

  if (import.meta.env.DEV) {
    return "http://localhost:3000";
  }

  return PRODUCTION_FALLBACK_URL;
};

export const API_BASE_URL = resolveBaseUrl();

/**
 * Returns authorization headers with Bearer token if available in localStorage
 */
export const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token && token !== "null" && token !== "undefined"
      ? { Authorization: `Bearer ${token}` }
      : {}),
  };
};

export default API_BASE_URL;
