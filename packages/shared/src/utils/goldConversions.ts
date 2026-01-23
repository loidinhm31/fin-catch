export type GoldUnit = "gram" | "mace" | "tael" | "ounce" | "kg";

export const getGoldUnitByIdAndSource = (
  goldPriceId: string,
  source: string,
): GoldUnit => {
  if (source === "sjc") {
    // SJC gold bars (1L, 10L, 1KG) - priced per tael (lượng)
    if (goldPriceId === "1" || goldPriceId === "2") {
      return "tael";
    }
    // SJC jewelry/rings (99.99%) - priced per mace (chỉ)
    if (goldPriceId === "49") {
      return "mace";
    }
    // Default for other SJC types
    return "mace";
  }

  // Default to mace for Vietnamese gold
  return "mace";
};

export const getGramsPerUnit = (unit: string): number => {
  switch (unit) {
    case "gram":
      return 1;
    case "mace":
      return 3.75; // 1 mace (chỉ) = 3.75 grams
    case "tael":
      return 37.5; // 1 tael (lượng) = 10 mace = 37.5 grams
    case "ounce":
      return 31.1035; // 1 troy ounce = 31.1035 grams
    case "kg":
      return 1000;
    default:
      return 1;
  }
};

export const convertToGrams = (quantity: number, unit: string): number => {
  return quantity * getGramsPerUnit(unit);
};

export const getUnitLabel = (unit: string): string => {
  switch (unit) {
    case "gram":
      return "Gram (g)";
    case "mace":
      return "Mace/Chỉ (3.75g)";
    case "tael":
      return "Tael/Lượng (37.5g)";
    case "ounce":
      return "Troy Ounce (31.1g)";
    case "kg":
      return "Kilogram (kg)";
    default:
      return unit;
  }
};
