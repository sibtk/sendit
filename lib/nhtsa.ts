import { RecallInfo, VinDecode } from "./types";

const VPIC_BASE = "https://vpic.nhtsa.dot.gov/api/vehicles";
const RECALLS_BASE = "https://api.nhtsa.gov/recalls/recallsByVehicle";

interface VpicResult {
  Variable: string;
  Value: string | null;
  ValueId: string | null;
}

function getVal(results: VpicResult[], variable: string): string | null {
  const found = results.find((r) => r.Variable === variable);
  return found?.Value?.trim() || null;
}

function getNum(results: VpicResult[], variable: string): number | null {
  const val = getVal(results, variable);
  if (!val) return null;
  const num = parseFloat(val);
  return isNaN(num) ? null : num;
}

export async function decodeVin(vin: string): Promise<VinDecode> {
  const res = await fetch(
    `${VPIC_BASE}/decodevin/${encodeURIComponent(vin)}?format=json`
  );
  if (!res.ok) throw new Error(`NHTSA VIN decode failed: ${res.status}`);

  const data = await res.json();
  const results: VpicResult[] = data.Results || [];

  const airbagFields = [
    "Front Air Bag Locations",
    "Side Air Bag Locations",
    "Curtain Air Bag Locations",
    "Knee Air Bag Locations",
  ];
  const airbagLocations = airbagFields
    .map((f) => getVal(results, f))
    .filter((v): v is string => v !== null && v !== "");

  return {
    vin,
    year: getNum(results, "Model Year") || 0,
    make: getVal(results, "Make") || "",
    model: getVal(results, "Model") || "",
    trim: getVal(results, "Trim"),
    bodyClass: getVal(results, "Body Class"),
    engine:
      getVal(results, "Engine Model") ||
      [
        getVal(results, "Displacement (L)"),
        getVal(results, "Engine Number of Cylinders"),
        getVal(results, "Fuel Type - Primary"),
      ]
        .filter(Boolean)
        .join("L ") || null,
    engineCylinders: getNum(results, "Engine Number of Cylinders"),
    displacementL: getNum(results, "Displacement (L)"),
    hp: getNum(results, "Engine Brake (hp) From"),
    transmission: getVal(results, "Transmission Style"),
    transmissionSpeeds: getNum(results, "Transmission Speeds"),
    drivetrain: getVal(results, "Drive Type"),
    fuelType: getVal(results, "Fuel Type - Primary"),
    plantCity: getVal(results, "Plant City"),
    plantCountry: getVal(results, "Plant Country"),
    doors: getNum(results, "Doors"),
    seats: getNum(results, "Number of Seats"),
    abs: getVal(results, "Anti-lock Braking System (ABS)") === "Standard",
    esc:
      getVal(results, "Electronic Stability Control (ESC)") === "Standard",
    tractionControl: getVal(results, "Traction Control") === "Standard",
    airbagLocations,
    errorCode: getVal(results, "Error Code"),
  };
}

export async function getRecalls(
  make: string,
  model: string,
  modelYear: number
): Promise<RecallInfo[]> {
  const params = new URLSearchParams({
    make,
    model,
    modelYear: String(modelYear),
  });

  const res = await fetch(`${RECALLS_BASE}?${params}`);
  if (!res.ok) return [];

  const data = await res.json();
  const results = data.results || [];

  return results.map(
    (r: { NHTSACampaignNumber: string; Component: string; Summary: string }) => ({
      campaignNumber: r.NHTSACampaignNumber || "N/A",
      component: r.Component || "N/A",
      summary: r.Summary || "N/A",
    })
  );
}
