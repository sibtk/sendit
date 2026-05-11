export interface UserSettings {
  // Location
  zip: string;
  city: string;
  state: string;

  // Repair
  repairProfile: "own_shop" | "diy" | "budget_shop" | "quality_shop" | "premium_shop" | "custom";
  customLaborRate: number | null; // $/hr if custom
  partsPreference: "used" | "aftermarket" | "oem";

  // Selling
  sellChannel: "private" | "dealer_wholesale" | "both";
  // private = higher price, 14-30 days
  // dealer_wholesale = lower price, 1-5 days
  // both = show both scenarios

  // Business
  hasDeaelerLicense: boolean;
  iaaVolumeDiscount: boolean; // high-volume = 6% instead of 7.5%
  canDoRebuiltInspection: boolean;

  // Limits
  maxInvestment: number | null; // max all-in budget per car
  minProfit: number | null; // minimum profit threshold to show BUY

  // Display
  defaultToSlider: boolean; // auto-open bid simulator
}

const STORAGE_KEY = "sendit_settings";

export const DEFAULT_SETTINGS: UserSettings = {
  zip: "77001",
  city: "Houston",
  state: "TX",
  repairProfile: "budget_shop",
  customLaborRate: null,
  partsPreference: "aftermarket",
  sellChannel: "private",
  hasDeaelerLicense: false,
  iaaVolumeDiscount: false,
  canDoRebuiltInspection: false,
  maxInvestment: null,
  minProfit: null,
  defaultToSlider: true,
};

export function loadSettings(): UserSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Partial<UserSettings>) {
  const current = loadSettings();
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...settings }));
}
