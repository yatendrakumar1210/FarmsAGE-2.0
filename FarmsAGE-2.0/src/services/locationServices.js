export const saveAddress = async (payload) => {
  const token = localStorage.getItem("token");

  const res = await fetch("https://farmsage-2-0-2.onrender.com/api/address/save-address", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return await res.json();
};

