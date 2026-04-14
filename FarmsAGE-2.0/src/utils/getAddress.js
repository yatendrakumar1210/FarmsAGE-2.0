const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

export const getAddressFromCoords = async (lat, lng) => {
  try {
    if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY === "YOUR_GOOGLE_MAPS_API_KEY_HERE") {
      console.warn("Google Maps API Key is missing. Falling back to OpenStreetMap.");
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
    }

    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`
    );
    const data = await res.json();

    if (data.status === "OK" && data.results.length > 0) {
      const result = data.results[0];
      const addressComponents = result.address_components;

      let city = "";
      let pincode = "";
      let street = "";

      addressComponents.forEach((component) => {
        if (component.types.includes("locality")) {
          city = component.long_name;
        }
        if (component.types.includes("postal_code")) {
          pincode = component.long_name;
        }
        if (component.types.includes("route")) {
          street = component.long_name;
        }
      });

      return {
        fullAddress: result.formatted_address,
        city,
        pincode,
        street
      };
    } else {
      console.error("Google Geocoding failed:", data.status);
      return null;
    }
  } catch (error) {
    console.error("Geocoding failed", error);
    return null;
  }
};


