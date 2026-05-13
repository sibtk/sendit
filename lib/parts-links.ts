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
// Verified from scraping partsgeek.com/ymm/2024/toyota/corolla.html
const BODY = "body_mechanical_-ar-_trim";
const BELEC = "body_electrical";
const PG_PARTS: Record<string, { cat: string; slug: string }> = {
  // Body Mechanical & Trim — verified slugs
  "bumper": { cat: BODY, slug: "bumper_cover" },
  "bumper cover": { cat: BODY, slug: "bumper_cover" },
  "front bumper": { cat: BODY, slug: "bumper_cover" },
  "rear bumper": { cat: BODY, slug: "bumper_cover" },
  "fender": { cat: BODY, slug: "fender" },
  "inner fender": { cat: BODY, slug: "inner_fender" },
  "fender liner": { cat: BODY, slug: "fender_liner" },
  "fender splash shield": { cat: BODY, slug: "fender_splash_shield" },
  "hood": { cat: BODY, slug: "hood" },
  "hood panel": { cat: BODY, slug: "hood_panel_assembly" },
  "grille": { cat: BODY, slug: "grille_assembly" },
  "grill": { cat: BODY, slug: "grille_assembly" },
  "grille insert": { cat: BODY, slug: "grille_insert" },
  "door handle": { cat: BODY, slug: "door_handle" },
  "door": { cat: BODY, slug: "door_handle" }, // no door_shell on PG
  "door mirror": { cat: BODY, slug: "door_mirror_glass" },
  "mirror": { cat: BODY, slug: "mirror" },
  "side mirror": { cat: BODY, slug: "mirror" },
  "window regulator": { cat: BODY, slug: "window_regulator" },
  "window motor": { cat: BODY, slug: "window_motor" },
  "bumper reinforcement": { cat: BODY, slug: "bumper_reinforcement" },
  "bumper bracket": { cat: BODY, slug: "bumper_bracket" },
  "bumper absorber": { cat: BODY, slug: "bumper_absorber" },
  "bumper valance": { cat: BODY, slug: "bumper_valance" },
  "valance": { cat: BODY, slug: "bumper_valance" },
  "splash guard": { cat: BODY, slug: "mud_flap_kit" },
  "fog light bezel": { cat: BODY, slug: "fog_light_bezel" },
  "emblem": { cat: BODY, slug: "emblem" },
  "license plate bracket": { cat: BODY, slug: "license_plate_bracket" },
  "tow hook": { cat: BODY, slug: "tow_hook_cover" },

  // Body Electrical — headlights, tail lights, fog lights
  "headlight": { cat: BELEC, slug: "headlight_assembly" },
  "headlamp": { cat: BELEC, slug: "headlight_assembly" },
  "tail light": { cat: BELEC, slug: "tail_light_assembly" },
  "taillight": { cat: BELEC, slug: "tail_light_assembly" },
  "fog light": { cat: BELEC, slug: "fog_light" },
  "driving light": { cat: BELEC, slug: "driving_light" },
  "turn signal": { cat: BELEC, slug: "turn_signal_light_bulb" },
  "marker light": { cat: BELEC, slug: "side_marker_light_bulb" },
  "parking light": { cat: BELEC, slug: "parking_light" },
  "back up light": { cat: BELEC, slug: "back_up_light" },
  "wiper blade": { cat: BELEC, slug: "wiper_blade" },
  "washer pump": { cat: BELEC, slug: "washer_pump" },
  "horn": { cat: BELEC, slug: "horn" },
  "door lock": { cat: BELEC, slug: "door_lock_actuator" },
  "battery": { cat: BELEC, slug: "battery" },

  // Cooling System
  "radiator": { cat: "cooling_system", slug: "radiator" },
  "radiator support": { cat: "cooling_system", slug: "radiator_support" },
  "radiator fan": { cat: "cooling_system", slug: "radiator_fan_assembly" },
  "radiator hose": { cat: "cooling_system", slug: "radiator_hose" },
  "water pump": { cat: "cooling_system", slug: "water_pump" },
  "thermostat": { cat: "cooling_system", slug: "thermostat" },
  "coolant reservoir": { cat: "cooling_system", slug: "expansion_tank" },

  // Climate Control — A/C uses "-fs-" for "/" in URLs
  "condenser": { cat: "climate_control", slug: "a-fs-c_condenser" },
  "a/c condenser": { cat: "climate_control", slug: "a-fs-c_condenser" },
  "a/c compressor": { cat: "climate_control", slug: "a-fs-c_compressor" },
  "ac compressor": { cat: "climate_control", slug: "a-fs-c_compressor" },
  "blower motor": { cat: "climate_control", slug: "blower_motor" },
  "heater core": { cat: "climate_control", slug: "heater_core" },
  "evaporator": { cat: "climate_control", slug: "a-fs-c_evaporator" },

  // Brake
  "brake": { cat: "brake", slug: "brake_pad_set" },
  "brake pad": { cat: "brake", slug: "brake_pad_set" },
  "rotor": { cat: "brake", slug: "brake_rotor" },
  "brake rotor": { cat: "brake", slug: "brake_rotor" },
  "caliper": { cat: "brake", slug: "brake_caliper" },
  "brake caliper": { cat: "brake", slug: "brake_caliper" },
  "brake hose": { cat: "brake", slug: "brake_hose" },
  "brake master": { cat: "brake", slug: "brake_master_cylinder" },

  // Suspension
  "control arm": { cat: "suspension", slug: "control_arm" },
  "strut": { cat: "suspension", slug: "strut_assembly" },
  "shock": { cat: "suspension", slug: "shock_absorber" },
  "shock absorber": { cat: "suspension", slug: "shock_absorber" },
  "suspension": { cat: "suspension", slug: "strut_assembly" },
  "ball joint": { cat: "suspension", slug: "ball_joint" },
  "sway bar": { cat: "suspension", slug: "sway_bar_link" },
  "lateral arm": { cat: "suspension", slug: "lateral_arm" },
  "trailing arm": { cat: "suspension", slug: "trailing_arm" },

  // Steering
  "tie rod": { cat: "steering", slug: "tie_rod_end" },
  "power steering": { cat: "steering", slug: "power_steering_relay" },
  "steering rack": { cat: "steering", slug: "steering_rack_boot_kit" },

  // Driveshaft & Axle
  "cv axle": { cat: "driveshaft_-ar-_axle", slug: "axle_assembly" },
  "axle": { cat: "driveshaft_-ar-_axle", slug: "axle_assembly" },
  "hub": { cat: "driveshaft_-ar-_axle", slug: "wheel_hub_assembly" },
  "wheel bearing": { cat: "driveshaft_-ar-_axle", slug: "wheel_hub_assembly" },
  "bearing": { cat: "driveshaft_-ar-_axle", slug: "wheel_hub_assembly" },
  "wheel": { cat: "driveshaft_-ar-_axle", slug: "wheel" },
  "rim": { cat: "driveshaft_-ar-_axle", slug: "wheel" },
  "wheel cover": { cat: "driveshaft_-ar-_axle", slug: "wheel_cover" },

  // Engine Electrical
  "alternator": { cat: "engine_electrical", slug: "alternator" },
  "starter": { cat: "engine_electrical", slug: "starter" },
  "ignition coil": { cat: "engine_electrical", slug: "ignition_coil" },
  "spark plug": { cat: "engine_electrical", slug: "spark_plug" },

  // Engine Mechanical
  "engine mount": { cat: "engine_mechanical", slug: "engine_mount" },
  "motor mount": { cat: "engine_mechanical", slug: "engine_mount" },
  "valve cover": { cat: "engine_mechanical", slug: "valve_cover_gasket" },
  "timing chain": { cat: "engine_mechanical", slug: "timing_chain" },
  "oil pan": { cat: "engine_mechanical", slug: "oil_pan" },
  "oil filter": { cat: "engine_mechanical", slug: "oil_filter" },
  "oil pump": { cat: "engine_mechanical", slug: "oil_pump" },
  "lower engine cover": { cat: "engine_mechanical", slug: "lower_engine_cover" },
  "engine cover": { cat: "engine_mechanical", slug: "lower_engine_cover" },

  // Drive Belts
  "belt": { cat: "drive_belts", slug: "multi_rib_belt" },
  "serpentine belt": { cat: "drive_belts", slug: "multi_rib_belt" },

  // Exhaust
  "catalytic converter": { cat: "exhaust", slug: "catalytic_converter" },
  "muffler": { cat: "exhaust", slug: "muffler" },
  "exhaust": { cat: "exhaust", slug: "exhaust_pipe" },
  "exhaust pipe": { cat: "exhaust", slug: "exhaust_pipe" },

  // Fuel
  "fuel pump": { cat: "fuel_delivery", slug: "fuel_pump" },
  "fuel injector": { cat: "fuel_injection", slug: "fuel_injector" },
  "oxygen sensor": { cat: "fuel_injection", slug: "oxygen_sensor" },
  "throttle body": { cat: "fuel_injection", slug: "throttle_body" },

  // Air Intake
  "air filter": { cat: "air_intake", slug: "air_filter" },
  "cabin air filter": { cat: "air_intake", slug: "cabin_air_filter" },
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
  const ebayUrl = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(query)}&_sacat=6028&mkcid=1&mkrid=711-53200-19255-0&campid=5339152879&toolid=10001`;

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
