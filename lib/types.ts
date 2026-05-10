// ============================================
// Platform & Listing Types
// ============================================

export type Platform = "copart" | "iaa";

export type RepairProfile =
  | "own_shop"
  | "diy"
  | "budget_shop"
  | "quality_shop"
  | "premium_shop";

export const REPAIR_PROFILES: Record<
  RepairProfile,
  { label: string; laborRate: number; partsType: string }
> = {
  own_shop: { label: "I own the shop", laborRate: 0, partsType: "wholesale" },
  diy: { label: "DIY / doing it myself", laborRate: 0, partsType: "retail" },
  budget_shop: {
    label: "Budget body shop",
    laborRate: 50,
    partsType: "aftermarket",
  },
  quality_shop: {
    label: "Quality 3rd party shop",
    laborRate: 85,
    partsType: "OEM",
  },
  premium_shop: {
    label: "Premium / dealer shop",
    laborRate: 135,
    partsType: "OEM",
  },
};

export interface ListingData {
  platform: Platform;
  lotNumber: string;
  url: string;
  vin: string | null;
  vinMasked: boolean;
  year: number;
  make: string;
  model: string;
  trim: string | null;
  bodyStyle: string | null;
  engine: string | null;
  transmission: string | null;
  drivetrain: string | null;
  fuelType: string | null;
  cylinders: number | null;
  hp: number | null;
  exteriorColor: string | null;
  interiorColor: string | null;
  mileage: number | null;
  mileageStatus: string | null; // "Actual", "Exempt", "Not Actual"
  primaryDamage: string | null;
  secondaryDamage: string | null;
  lossType: string | null;
  titleStatus: string | null; // "CLEAR", "SALVAGE", etc.
  titleBrand: string | null; // "CLEAR - INSURANCE SALVAGE", etc.
  startCode: string | null; // "Starts", "Run & Drive", "Stationary"
  keyPresent: boolean | null;
  airbags: string | null; // "Intact", "Deployed", etc.
  sellingBranch: string | null;
  branchCity: string | null;
  branchState: string | null;
  branchCoordinates: { lat: number; lng: number } | null;
  currentBid: number | null;
  buyItNow: number | null;
  acv: number | null; // Actual Cash Value (IAA)
  estimatedRepairCost: number | null; // Insurance estimate (IAA)
  auctionDate: string | null;
  imageUrls: string[];
}

// ============================================
// VIN Decode Types
// ============================================

export interface VinDecode {
  vin: string;
  year: number;
  make: string;
  model: string;
  trim: string | null;
  bodyClass: string | null;
  engine: string | null;
  engineCylinders: number | null;
  displacementL: number | null;
  hp: number | null;
  transmission: string | null;
  transmissionSpeeds: number | null;
  drivetrain: string | null;
  fuelType: string | null;
  plantCity: string | null;
  plantCountry: string | null;
  doors: number | null;
  seats: number | null;
  abs: boolean;
  esc: boolean;
  tractionControl: boolean;
  airbagLocations: string[];
  errorCode: string | null;
}

export interface RecallInfo {
  campaignNumber: string;
  component: string;
  summary: string;
}

// ============================================
// Auction Fee Types
// ============================================

export interface AuctionFees {
  platform: Platform;
  bidAmount: number;
  buyerPremium: number;
  gateFee: number;
  internetBidFee: number;
  environmentalFee: number;
  titleFee: number;
  totalFees: number;
  totalWithBid: number;
}

// ============================================
// Shipping Types
// ============================================

export interface ShippingEstimate {
  from: string;
  to: string;
  distanceMiles: number;
  openTransport: { low: number; high: number };
  enclosedTransport: { low: number; high: number };
  estimatedDays: { low: number; high: number };
}

// ============================================
// Analysis Types (Claude response)
// ============================================

export type Verdict = "BUY" | "PASS" | "RISKY";
export type Severity = "minor" | "moderate" | "severe";
export type RiskLevel = "low" | "medium" | "high";
export type DemandLevel = "high" | "medium" | "low";

export interface AnalysisResult {
  vehicle: {
    year: number;
    make: string;
    model: string;
    trim: string | null;
    engine: string | null;
    hp: number | null;
    drivetrain: string | null;
  };
  damageAssessment: {
    severity: Severity;
    areas: string[];
    structuralRisk: RiskLevel;
    details: string;
  };
  repairEstimate: {
    profileUsed: RepairProfile;
    parts: {
      name: string;
      type: "OEM" | "aftermarket" | "used";
      costLow: number;
      costHigh: number;
    }[];
    laborRateHr: number;
    laborHours: number;
    laborTotal: { low: number; high: number };
    paint: { low: number; high: number };
    total: { low: number; high: number };
  };
  marketValue: {
    cleanRetail: { low: number; high: number };
    privateParty: { low: number; high: number };
    titleImpactPct: number;
    adjustedValue: { low: number; high: number };
    mileageNotes: string;
    demand: DemandLevel;
    daysToSell: string;
  };
  financials: {
    purchase: number;
    auctionFees: {
      amount: number;
      platform: Platform;
      feePct: number;
    };
    shipping: {
      estimate: number;
      distanceMi: number;
      from: string;
      to: string;
    };
    repairs: {
      low: number;
      high: number;
      profile: RepairProfile;
    };
    detailing: number;
    allIn: { low: number; high: number };
    salePrice: { low: number; high: number };
    profit: { low: number; high: number };
    scenarios: {
      bestCase: { allIn: number; sellAt: number; profit: number; roi: number; description: string };
      expected: { allIn: number; sellAt: number; profit: number; roi: number; description: string };
      worstCase: { allIn: number; sellAt: number; profit: number; roi: number; description: string };
    };
    marginPct: number;
    roiPct: number;
  };
  recalls: RecallInfo[];
  verdict: Verdict;
  verdictSummary: string;
  bidCeilings: {
    steal: number;
    good: number;
    fair: number;
    walk: number;
  };
  buyItNowVerdict: string | null;
  maxBidRecommendation: number;
  unknownRisks: string[];
  redFlags: string[];
  greenFlags: string[];
}

// ============================================
// Full Analysis (what we store)
// ============================================

export interface FullAnalysis {
  id: string;
  listing: ListingData;
  vinDecode: VinDecode | null;
  fees: AuctionFees;
  shipping: ShippingEstimate | null;
  analysis: AnalysisResult;
  repairProfile: RepairProfile;
  userLocation: string;
  createdAt: string;
}

// ============================================
// User Input Types
// ============================================

export interface AnalyzeRequest {
  url?: string;
  pastedText?: string;
  repairProfile: RepairProfile;
  currentBid?: number;
  maxBid?: number;
  shippingOverride?: number;
  userLocation: string;
  userZip: string;
  damageNotes?: string;
  additionalPhotoUrls?: string[];
}
