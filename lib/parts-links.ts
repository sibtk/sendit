/**
 * Generate shop links for parts in the repair table.
 *
 * Three tiers:
 * - eBay: Used + aftermarket + OEM (affiliate later)
 * - PartsGeek: Aftermarket catalog (affiliate later via CJ)
 * - OEM: Direct link to manufacturer's parts site (no affiliate — dealer deal later)
 */

// ── OEM parts sites by make ────────────────────────────────────
// Static links to the make's parts catalog page. No search query needed —
// just gets the user to the right brand. Future: deep-link with part numbers.
const OEM_SITES: Record<string, { name: string; url: string }> = {
  "TOYOTA":         { name: "Toyota Parts", url: "https://parts.toyota.com" },
  "LEXUS":          { name: "Lexus Parts", url: "https://parts.lexus.com" },
  "HONDA":          { name: "Honda Parts", url: "https://parts.honda.com" },
  "ACURA":          { name: "Acura Parts", url: "https://parts.acura.com" },
  "FORD":           { name: "Ford Parts", url: "https://parts.ford.com" },
  "LINCOLN":        { name: "Lincoln Parts", url: "https://parts.lincoln.com" },
  "CHEVROLET":      { name: "GM Parts", url: "https://www.gmparts.com" },
  "GMC":            { name: "GM Parts", url: "https://www.gmparts.com" },
  "CADILLAC":       { name: "GM Parts", url: "https://www.gmparts.com" },
  "BUICK":          { name: "GM Parts", url: "https://www.gmparts.com" },
  "DODGE":          { name: "Mopar Parts", url: "https://www.mopar.com/en-us/parts.html" },
  "CHRYSLER":       { name: "Mopar Parts", url: "https://www.mopar.com/en-us/parts.html" },
  "JEEP":           { name: "Mopar Parts", url: "https://www.mopar.com/en-us/parts.html" },
  "RAM":            { name: "Mopar Parts", url: "https://www.mopar.com/en-us/parts.html" },
  "BMW":            { name: "BMW Parts", url: "https://www.bmwusa.com/explore/bmw-value/bmw-parts.html" },
  "MERCEDES-BENZ":  { name: "MB Parts", url: "https://www.mbusa.com/en/owners/parts" },
  "AUDI":           { name: "Audi Parts", url: "https://parts.audiusa.com" },
  "VOLKSWAGEN":     { name: "VW Parts", url: "https://parts.vw.com" },
  "PORSCHE":        { name: "Porsche Parts", url: "https://parts.porsche.com" },
  "NISSAN":         { name: "Nissan Parts", url: "https://parts.nissanusa.com" },
  "INFINITI":       { name: "Infiniti Parts", url: "https://parts.infinitiusa.com" },
  "HYUNDAI":        { name: "Hyundai Parts", url: "https://www.hyundaipartsdeal.com" },
  "KIA":            { name: "Kia Parts", url: "https://www.kiapartsdeal.com" },
  "GENESIS":        { name: "Genesis Parts", url: "https://www.genesispartsdeal.com" },
  "SUBARU":         { name: "Subaru Parts", url: "https://parts.subaru.com" },
  "MAZDA":          { name: "Mazda Parts", url: "https://www.mazdapartsdeal.com" },
  "VOLVO":          { name: "Volvo Parts", url: "https://www.volvopartsdeal.com" },
  "LAND ROVER":     { name: "LR Parts", url: "https://parts.landroverusa.com" },
  "JAGUAR":         { name: "Jaguar Parts", url: "https://parts.jaguarusa.com" },
  "MASERATI":       { name: "Maserati Parts", url: "https://www.maserati.com/us/en/shopping-tools/parts-accessories" },
  "ALFA ROMEO":     { name: "Mopar Parts", url: "https://www.mopar.com/en-us/parts.html" },
  "MINI":           { name: "MINI Parts", url: "https://www.miniusa.com/owners/parts-and-accessories.html" },
  "MITSUBISHI":     { name: "Mitsubishi Parts", url: "https://parts.mitsubishicars.com" },
  "TESLA":          { name: "Tesla Parts", url: "https://shop.tesla.com" },
};

// ── PartsGeek URL structure ────────────────────────────────────
// PartsGeek uses: /mmparts/{part_slug}/{make}/{model}.html for browsing
// and /catalog/{year}/{make}/{model}/{category}/{part}.html for year-specific
// Safest is their search: /catalog/search/?query={encoded}
// Make names are lowercase, model names lowercase

// ── eBay search ────────────────────────────────────────────────
// eBay Motors Parts: category 6028
// Search: /sch/i.html?_nkw={query}&_sacat=6028
// Affiliate params added when campaign ID is set

export interface PartShopLinks {
  ebay: string;
  partsGeek: string;
  oem: { name: string; url: string } | null;
}

/**
 * Build a clean search query for a specific part.
 * "Front bumper cover" + 2020 Toyota Supra → "2020 Toyota Supra front bumper cover"
 */
function buildPartQuery(year: number, make: string, model: string, partName: string): string {
  // Clean up common part name patterns for better search results
  const cleanPart = partName
    .replace(/\s*\(.*?\)\s*/g, "") // remove parentheticals like "(driver side)"
    .replace(/\s+/g, " ")
    .trim();

  return `${year} ${make} ${model} ${cleanPart}`;
}

// PartsGeek part name → { category, slug } mapping
// URL: /catalog/{year}/{make}/{model}/{category}/{slug}.html
// Body parts use "body_mechanical_-ar-_trim" as category
// PartsGeek categories (from their filter). URL uses underscores + "-ar-" for "&"
// Body Mechanical & Trim → body_mechanical_-ar-_trim
// Cooling System → cooling_system
// Engine Electrical → engine_electrical
// Engine Mechanical → engine_mechanical
// Driveshaft & Axle → driveshaft_-ar-_axle
// Climate Control → climate_control
const BODY = "body_mechanical_-ar-_trim";
const PG_PARTS: Record<string, { cat: string; slug: string }> = {
  // Body / Mechanical / Trim
  "bumper": { cat: BODY, slug: "bumper_cover" },
  "bumper cover": { cat: BODY, slug: "bumper_cover" },
  "front bumper": { cat: BODY, slug: "bumper_cover" },
  "rear bumper": { cat: BODY, slug: "bumper_cover" },
  "fender": { cat: BODY, slug: "fender" },
  "hood": { cat: BODY, slug: "hood_panel_assembly" },
  "grille": { cat: BODY, slug: "grille_assembly" },
  "grill": { cat: BODY, slug: "grille_assembly" },
  "quarter panel": { cat: BODY, slug: "quarter_panel" },
  "rocker panel": { cat: BODY, slug: "rocker_panel" },
  "door": { cat: BODY, slug: "door_shell" },
  "door handle": { cat: BODY, slug: "exterior_door_handle" },
  "mirror": { cat: BODY, slug: "mirror" },
  "side mirror": { cat: BODY, slug: "mirror" },
  "trunk lid": { cat: BODY, slug: "trunk_lid" },
  "liftgate": { cat: BODY, slug: "liftgate" },
  "tailgate": { cat: BODY, slug: "tailgate" },
  "fender liner": { cat: BODY, slug: "fender_liner" },
  "splash guard": { cat: BODY, slug: "splash_guard" },
  "valance": { cat: BODY, slug: "bumper_valance" },
  "bumper reinforcement": { cat: BODY, slug: "bumper_reinforcement" },
  "bumper bracket": { cat: BODY, slug: "bumper_bracket" },
  "radiator support": { cat: BODY, slug: "radiator_support" },
  "engine cover": { cat: BODY, slug: "engine_cover" },
  // Body Electrical (headlights, tail lights, fog lights, mirrors w/ electronics)
  "headlight": { cat: "body_electrical", slug: "headlight_assembly" },
  "headlamp": { cat: "body_electrical", slug: "headlight_assembly" },
  "tail light": { cat: "body_electrical", slug: "tail_light_assembly" },
  "taillight": { cat: "body_electrical", slug: "tail_light_assembly" },
  "fog light": { cat: "body_electrical", slug: "fog_light" },
  "turn signal": { cat: "body_electrical", slug: "turn_signal_light" },
  "marker light": { cat: "body_electrical", slug: "side_marker_light" },
  "parking light": { cat: "body_electrical", slug: "parking_light" },
  // Cooling
  "radiator": { cat: "cooling_system", slug: "radiator" },
  "condenser": { cat: "cooling_system", slug: "ac_condenser" },
  "a/c condenser": { cat: "cooling_system", slug: "ac_condenser" },
  "water pump": { cat: "cooling_system", slug: "water_pump" },
  "thermostat": { cat: "cooling_system", slug: "thermostat" },
  // Brake
  "brake": { cat: "brake", slug: "brake_pad_set" },
  "brake pad": { cat: "brake", slug: "brake_pad_set" },
  "rotor": { cat: "brake", slug: "brake_disc" },
  "brake rotor": { cat: "brake", slug: "brake_disc" },
  "caliper": { cat: "brake", slug: "brake_caliper" },
  // Suspension
  "control arm": { cat: "suspension", slug: "control_arm" },
  "strut": { cat: "suspension", slug: "strut_assembly" },
  "shock": { cat: "suspension", slug: "shock_absorber" },
  "suspension": { cat: "suspension", slug: "strut_assembly" },
  "ball joint": { cat: "suspension", slug: "ball_joint" },
  "tie rod": { cat: "suspension", slug: "tie_rod_end" },
  "cv axle": { cat: "driveshaft_-ar-_axle", slug: "cv_axle_assembly" },
  "axle": { cat: "driveshaft_-ar-_axle", slug: "cv_axle_assembly" },
  "hub": { cat: "suspension", slug: "wheel_bearing_and_hub" },
  "bearing": { cat: "suspension", slug: "wheel_bearing_and_hub" },
  // Engine Electrical
  "alternator": { cat: "engine_electrical", slug: "alternator" },
  "starter": { cat: "engine_electrical", slug: "starter_motor" },
  "ignition coil": { cat: "engine_electrical", slug: "ignition_coil" },
  // Engine Mechanical
  "belt": { cat: "drive_belts", slug: "serpentine_belt" },
  "serpentine belt": { cat: "drive_belts", slug: "serpentine_belt" },
  "timing belt": { cat: "engine_mechanical", slug: "timing_belt" },
  "timing chain": { cat: "engine_mechanical", slug: "timing_chain" },
  "engine mount": { cat: "engine_mechanical", slug: "engine_mount" },
  "motor mount": { cat: "engine_mechanical", slug: "engine_mount" },
  "valve cover": { cat: "engine_mechanical", slug: "valve_cover_gasket" },
  // Exhaust
  "catalytic converter": { cat: "exhaust", slug: "catalytic_converter" },
  "muffler": { cat: "exhaust", slug: "muffler" },
  "exhaust": { cat: "exhaust", slug: "exhaust_pipe" },
  // Steering
  "power steering": { cat: "steering", slug: "power_steering_pump" },
  "steering rack": { cat: "steering", slug: "rack_and_pinion" },
  // Climate Control
  "a/c compressor": { cat: "climate_control", slug: "ac_compressor" },
  "ac compressor": { cat: "climate_control", slug: "ac_compressor" },
  "blower motor": { cat: "climate_control", slug: "blower_motor" },
  // Fuel
  "fuel pump": { cat: "fuel_delivery", slug: "fuel_pump" },
  "fuel injector": { cat: "fuel_injection", slug: "fuel_injector" },
  // Transmission
  "transmission": { cat: "transmission", slug: "automatic_transmission" },
  // Air Intake
  "air filter": { cat: "air_intake", slug: "air_filter" },
  "intake manifold": { cat: "air_intake", slug: "intake_manifold" },
  // Body Electrical — airbags, wiring, sensors
  "air bag": { cat: "body_electrical", slug: "air_bag" },
  "airbag": { cat: "body_electrical", slug: "air_bag" },
  "seat belt": { cat: "body_electrical", slug: "seat_belt" },
  // Interior
  "steering wheel": { cat: "steering", slug: "steering_wheel" },
  "dashboard": { cat: "body_mechanical_-ar-_trim", slug: "dashboard" },
  // Glass — fall back to YMM (PartsGeek glass category varies)
  "windshield": { cat: BODY, slug: "windshield_glass" },
  "window": { cat: BODY, slug: "door_glass" },
  // Wheels/Accessories
  "wheel": { cat: "accessories", slug: "wheel" },
  "rim": { cat: "accessories", slug: "wheel" },
};

function getPartsGeekPart(partName: string): { cat: string; slug: string } | null {
  const lower = partName.toLowerCase();
  // Try exact match first
  if (PG_PARTS[lower]) return PG_PARTS[lower];
  // Try partial match — find the longest key that matches
  let bestMatch = "";
  let bestResult: { cat: string; slug: string } | null = null;
  for (const [key, val] of Object.entries(PG_PARTS)) {
    if (lower.includes(key) && key.length > bestMatch.length) {
      bestMatch = key;
      bestResult = val;
    }
  }
  return bestResult;
}

function formatPgMakeModel(make: string, model: string): { pgMake: string; pgModel: string } {
  // PartsGeek uses lowercase, base model only (no trim), underscores for spaces
  const pgMake = make.toLowerCase().replace(/\s+/g, "_").replace(/-/g, "_");

  // Strip trim and prefixes — "GR SUPRA 3.0 PREMIUM" → "supra", "COROLLA LE" → "corolla"
  let base = model.toLowerCase()
    .replace(/^gr\s+/, "")           // "GR Supra" → "supra"
    .split(/\s+/)[0];               // Take first word only (base model, no trim)

  // Handle multi-word base models
  const multiWord: Record<string, string> = {
    "grand": "grand_cherokee",
    "range": "range_rover",
    "model": model.toLowerCase().replace(/\s+/g, "_"), // Tesla "Model 3" → "model_3"
    "land": "land_cruiser",
    "gr86": "gr86",
  };
  if (multiWord[base]) base = multiWord[base];

  const pgModel = base.replace(/\s+/g, "_").replace(/-/g, "_");
  return { pgMake, pgModel };
}

export function getPartLinks(
  year: number,
  make: string,
  model: string,
  partName: string
): PartShopLinks {
  const query = buildPartQuery(year, make, model, partName);

  // eBay — search within Parts & Accessories category
  const ebayUrl = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(query)}&_sacat=6028`;

  // PartsGeek — deep link to part category if we can map it, else YMM page
  const pgPart = getPartsGeekPart(partName);
  const { pgMake, pgModel } = formatPgMakeModel(make, model);
  const partsGeekUrl = pgPart
    ? `https://www.partsgeek.com/catalog/${year}/${pgMake}/${pgModel}/${pgPart.cat}/${pgPart.slug}.html`
    : `https://www.partsgeek.com/ymm/${year}/${pgMake}/${pgModel}.html`;

  // OEM — static brand link
  const makeUp = make.toUpperCase();
  const oemEntry = OEM_SITES[makeUp];
  const oem = oemEntry ? { name: oemEntry.name, url: oemEntry.url } : null;

  return { ebay: ebayUrl, partsGeek: partsGeekUrl, oem };
}
