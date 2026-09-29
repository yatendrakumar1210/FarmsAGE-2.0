import { API_BASE_URL, getAuthHeaders } from "../config/api";

export const saveAddress = async (payload) => {
  const res = await fetch(`${API_BASE_URL}/api/address/save-address`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return await res.json();
};
