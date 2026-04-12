export const getAddressFromCoords = async (lat, lng) => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
    );
    const data = await res.json();
    return {
      fullAddress: data.display_name,
      city: data.address.city || data.address.town || data.address.village || "",
      pincode: data.address.postcode || "",
      street: data.address.road || data.address.suburb || ""
    };
  } catch (error) {
    console.error("Geocoding failed", error);
    return null;
  }
};


