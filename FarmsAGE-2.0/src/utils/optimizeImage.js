/**
 * Transforms product image URLs to fetch optimized ~360px webp/avif formats.
 * Reduces raw large images (600px+) down to ~15-35KB per product.
 */
export const optimizeImageUrl = (url, width = 360) => {
  if (!url || typeof url !== "string") {
    return "https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=360&q=75&auto=format&fit=crop";
  }

  // Unsplash CDN Optimization
  if (url.includes("images.unsplash.com")) {
    const cleanUrl = url.split("?")[0];
    return `${cleanUrl}?w=${width}&q=75&auto=format&fit=crop`;
  }

  return url;
};
