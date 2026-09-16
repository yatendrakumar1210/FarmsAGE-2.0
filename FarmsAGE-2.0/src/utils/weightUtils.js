export const WEIGHT_OPTIONS = ["1 kg", "500 g", "250 g", "1 pack", "1 Piece"];

export const getWeightMultiplier = (weightStr) => {
  if (!weightStr) return 1;
  const normalized = String(weightStr).trim().toLowerCase();
  
  if (normalized.includes("250")) return 0.25;
  if (normalized.includes("500")) return 0.5;
  if (normalized.includes("1 kg") || normalized.includes("1kg") || normalized === "kg") return 1;
  if (normalized.includes("2 kg") || normalized.includes("2kg")) return 2;
  
  return 1;
};

export const calculateNewUnitPrice = (item, newWeight) => {
  const oldMult = getWeightMultiplier(item.weight);
  const newMult = getWeightMultiplier(newWeight);

  // Determine base price per 1 kg
  let basePricePerKg = item.originalPricePerKg;
  if (!basePricePerKg || isNaN(basePricePerKg)) {
    basePricePerKg = item.price / (oldMult || 1);
  }

  // Calculate new unit price
  const newUnitPrice = Math.round(basePricePerKg * newMult);
  return {
    newUnitPrice,
    basePricePerKg,
  };
};
