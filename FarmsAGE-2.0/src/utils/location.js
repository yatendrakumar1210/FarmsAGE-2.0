export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const toRadian = (degree) => (degree * Math.PI) / 180;
  
  const R = 6371; // Earth radius in km
  const dLat = toRadian(lat2 - lat1);
  const dLon = toRadian(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadian(lat1)) * Math.cos(toRadian(lat2)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  
  return distance;
};


