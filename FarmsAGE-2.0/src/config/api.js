import apiClient, { API_BASE_URL } from "../api/client";

export { API_BASE_URL, apiClient };

export const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token && token !== "null" && token !== "undefined" ? { Authorization: `Bearer ${token}` } : {}),
  };
};
