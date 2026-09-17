export const WEIGHT_OPTIONS = ["1 kg", "500 g", "250 g", "12 pcs", "6 pcs", "1 Piece", "2 Pieces", "1 Pack", "2 Packs", "1 Box", "2 Boxes"];

export const getWeightMultiplier = (weightStr) => {
  if (!weightStr) return 1;
  const normalized = String(weightStr).trim().toLowerCase();
  
  if (normalized.includes("250")) return 0.25;
  if (normalized.includes("500")) return 0.5;
  if (normalized.includes("6 pc") || normalized.includes("6pc") || normalized.includes("6 pcs")) return 0.5;
  if (normalized.includes("12 pc") || normalized.includes("12pc") || normalized.includes("12 pcs")) return 1;
  if (normalized.includes("2 piece") || normalized.includes("2 pieces") || normalized.includes("2pc")) return 2;
  if (normalized.includes("1 piece") || normalized.includes("1piece") || normalized.includes("1 pc")) return 1;
  if (normalized.includes("2 pack") || normalized.includes("2 packs")) return 2;
  if (normalized.includes("1 pack") || normalized.includes("1pack") || normalized.includes("pack")) return 1;
  if (normalized.includes("2 box") || normalized.includes("2 boxes")) return 2;
  if (normalized.includes("1 box") || normalized.includes("1box") || normalized.includes("box")) return 1;
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
