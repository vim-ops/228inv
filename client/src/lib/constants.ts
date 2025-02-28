export const PRODUCT_CATEGORIES = {
  DEVICE: "device",
  STATION: "station",
  HEART_RATE: "heart_rate",
  VEST: "vest",
  PC: "pc",
} as const;

export type ProductCategory = typeof PRODUCT_CATEGORIES[keyof typeof PRODUCT_CATEGORIES];

export const INITIAL_PRODUCT_TYPES = {
  [PRODUCT_CATEGORIES.DEVICE]: ["FIFA", "WR"],
  [PRODUCT_CATEGORIES.STATION]: ["NK-915K-16", "NK-910-10"],
  [PRODUCT_CATEGORIES.HEART_RATE]: ["Polar Sense"],
  [PRODUCT_CATEGORIES.VEST]: [],
  [PRODUCT_CATEGORIES.PC]: [],
} as const;

export const VEST_TYPES = ["DSタイプ", "薄型タイプ", "厚型タイプ"] as const;
export const VEST_SIZES = ["SSS", "SS", "S", "M", "L", "XL", "2XL", "3XL"] as const;
export const VEST_LOGOS = ["あり", "なし"] as const;

export const PC_WARRANTY_PERIODS = [
  { label: "なし", value: 0 },
  { label: "1年", value: 12 },
  { label: "2年", value: 24 },
  { label: "3年", value: 36 },
] as const;

export const SCREEN_COLORS = {
  inbound: "bg-blue-50",
  inventory: "bg-green-50",
  outbound: "bg-red-50",
} as const;
