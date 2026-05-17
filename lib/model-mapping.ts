/**
 * Map IAA/Copart model names to search-friendly names for AutoTempest and BidFax.
 *
 * BidFax slugs: VERIFIED by scraping bidfax.info dropdown (May 2026).
 * AutoTempest names: VERIFIED against their API (May 2026).
 *
 * Source of truth: scripts/bidfax-slugs.json
 */

interface ModelMapping {
  autotempest: string;
  bidfax: string;
}

// Format: "MAKE|IAA_MODEL_PREFIX" → { autotempest, bidfax }
// BidFax make slugs that differ from obvious: "mclaren-automotive", "land-rover", "alfa-romeo", "aston-martin"
const MODEL_MAP: Record<string, ModelMapping> = {

  // ── BMW ──────────────────────────────────────────────────────
  // AutoTempest: exact model numbers (M2, M3, 340i, etc.)
  // BidFax: exact model numbers lowercase (m2, m3, 340i, 330, 530, etc.)
  "BMW|M2": { autotempest: "M2", bidfax: "m2" },
  "BMW|M3": { autotempest: "M3", bidfax: "m3" },
  "BMW|M4": { autotempest: "M4", bidfax: "m4" },
  "BMW|M5": { autotempest: "M5", bidfax: "m5" },
  "BMW|M340": { autotempest: "M340i", bidfax: "m340i" },
  "BMW|M440": { autotempest: "M440i", bidfax: "m440i" },
  "BMW|M550": { autotempest: "M550i", bidfax: "m550i" },
  "BMW|M850": { autotempest: "M8", bidfax: "m850i" },
  "BMW|M6": { autotempest: "M6", bidfax: "m6" },
  "BMW|M8": { autotempest: "M8", bidfax: "m8" },
  "BMW|M235": { autotempest: "M240", bidfax: "m235i" },
  "BMW|M240": { autotempest: "M240", bidfax: "m240i" },
  "BMW|M760": { autotempest: "760i", bidfax: "m760" },
  "BMW|128": { autotempest: "128i", bidfax: "128i" },
  "BMW|135": { autotempest: "135i", bidfax: "135" },
  "BMW|228": { autotempest: "M240", bidfax: "228" },
  "BMW|230": { autotempest: "M240", bidfax: "230i" },
  "BMW|320": { autotempest: "320i", bidfax: "320i" },
  "BMW|325": { autotempest: "325i", bidfax: "325i" },
  "BMW|328": { autotempest: "328i", bidfax: "328i" },
  "BMW|330": { autotempest: "330i", bidfax: "330i" },
  "BMW|335": { autotempest: "335i", bidfax: "335" },
  "BMW|340": { autotempest: "340i", bidfax: "340i" },
  "BMW|428": { autotempest: "428i", bidfax: "428i" },
  "BMW|430": { autotempest: "430i", bidfax: "430i" },
  "BMW|435": { autotempest: "435i", bidfax: "435i" },
  "BMW|440": { autotempest: "440i", bidfax: "440i" },
  "BMW|525": { autotempest: "525i", bidfax: "525i" },
  "BMW|528": { autotempest: "528i", bidfax: "528i" },
  "BMW|530": { autotempest: "530i", bidfax: "530" },
  "BMW|535": { autotempest: "535i", bidfax: "535" },
  "BMW|540": { autotempest: "540i", bidfax: "540" },
  "BMW|550": { autotempest: "550i", bidfax: "550" },
  "BMW|640": { autotempest: "640i", bidfax: "640" },
  "BMW|650": { autotempest: "650i", bidfax: "650" },
  "BMW|740": { autotempest: "740i", bidfax: "740" },
  "BMW|745": { autotempest: "745i", bidfax: "745" },
  "BMW|750": { autotempest: "750i", bidfax: "750" },
  "BMW|760": { autotempest: "760i", bidfax: "760" },
  "BMW|840": { autotempest: "840i", bidfax: "840" },
  "BMW|850": { autotempest: "850i", bidfax: "850" },
  "BMW|I3": { autotempest: "i3", bidfax: "i3" },
  "BMW|I4": { autotempest: "i4", bidfax: "i4" },
  "BMW|I5": { autotempest: "i5", bidfax: "i5" },
  "BMW|I7": { autotempest: "i7", bidfax: "i7" },
  "BMW|I8": { autotempest: "i8", bidfax: "i8" },
  "BMW|IX": { autotempest: "iX", bidfax: "ix" },
  "BMW|X1": { autotempest: "X1", bidfax: "x1" },
  "BMW|X2": { autotempest: "X2", bidfax: "x2" },
  "BMW|X3": { autotempest: "X3", bidfax: "x3" },
  "BMW|X4": { autotempest: "X4", bidfax: "x4" },
  "BMW|X5": { autotempest: "X5", bidfax: "x5" },
  "BMW|X6": { autotempest: "X6", bidfax: "x6" },
  "BMW|X7": { autotempest: "X7", bidfax: "x7" },
  "BMW|XM": { autotempest: "XM", bidfax: "xm" },
  "BMW|Z3": { autotempest: "Z3", bidfax: "z3" },
  "BMW|Z4": { autotempest: "Z4", bidfax: "z4" },
  "BMW|ALPINA": { autotempest: "ALPINA", bidfax: "alpina-b7" },

  // ── Toyota ───────────────────────────────────────────────────
  "TOYOTA|GR SUPRA": { autotempest: "Supra", bidfax: "supra" },
  "TOYOTA|SUPRA": { autotempest: "Supra", bidfax: "supra" },
  "TOYOTA|GR86": { autotempest: "GR86", bidfax: "gr86" },
  "TOYOTA|GR 86": { autotempest: "GR86", bidfax: "gr86" },
  "TOYOTA|GR COROLLA": { autotempest: "GRCorolla", bidfax: "gr-corolla" },
  "TOYOTA|86": { autotempest: "86", bidfax: "86" },
  "TOYOTA|4RUNNER": { autotempest: "4Runner", bidfax: "4runner" },
  "TOYOTA|CAMRY": { autotempest: "Camry", bidfax: "camry" },
  "TOYOTA|COROLLA": { autotempest: "Corolla", bidfax: "corolla" },
  "TOYOTA|COROLLA CROSS": { autotempest: "CorollaCross", bidfax: "corolla-cross" },
  "TOYOTA|RAV4": { autotempest: "RAV4", bidfax: "rav4" },
  "TOYOTA|TACOMA": { autotempest: "Tacoma", bidfax: "tacoma" },
  "TOYOTA|TUNDRA": { autotempest: "Tundra", bidfax: "tundra" },
  "TOYOTA|HIGHLANDER": { autotempest: "Highlander", bidfax: "highlander" },
  "TOYOTA|SEQUOIA": { autotempest: "Sequoia", bidfax: "sequoia" },
  "TOYOTA|SIENNA": { autotempest: "Sienna", bidfax: "sienna" },
  "TOYOTA|PRIUS": { autotempest: "Prius", bidfax: "prius" },
  "TOYOTA|VENZA": { autotempest: "Venza", bidfax: "venza" },
  "TOYOTA|AVALON": { autotempest: "Avalon", bidfax: "avalon" },
  "TOYOTA|LAND CRUISER": { autotempest: "LandCruiser", bidfax: "land-cruiser" },
  "TOYOTA|C-HR": { autotempest: "CHR", bidfax: "c-hr" },
  "TOYOTA|CROWN": { autotempest: "Crown", bidfax: "crown" },
  "TOYOTA|BZ4X": { autotempest: "bZ4X", bidfax: "bz4x" },
  "TOYOTA|FJ CRUISER": { autotempest: "FJCruiser", bidfax: "fj-cruiser" },
  "TOYOTA|MR2": { autotempest: "MR2", bidfax: "mr2" },
  "TOYOTA|CELICA": { autotempest: "Celica", bidfax: "celica" },

  // ── Honda ────────────────────────────────────────────────────
  "HONDA|ACCORD": { autotempest: "Accord", bidfax: "accord" },
  "HONDA|CIVIC": { autotempest: "Civic", bidfax: "civic" },
  "HONDA|CR-V": { autotempest: "CRV", bidfax: "cr-v" },
  "HONDA|CRV": { autotempest: "CRV", bidfax: "cr-v" },
  "HONDA|HR-V": { autotempest: "HRV", bidfax: "hr-v" },
  "HONDA|PILOT": { autotempest: "Pilot", bidfax: "pilot" },
  "HONDA|ODYSSEY": { autotempest: "Odyssey", bidfax: "odyssey" },
  "HONDA|PASSPORT": { autotempest: "Passport", bidfax: "passport" },
  "HONDA|RIDGELINE": { autotempest: "Ridgeline", bidfax: "ridgeline" },
  "HONDA|FIT": { autotempest: "Fit", bidfax: "fit" },
  "HONDA|INSIGHT": { autotempest: "Insight", bidfax: "insight" },
  "HONDA|ELEMENT": { autotempest: "Element", bidfax: "element" },
  "HONDA|PRELUDE": { autotempest: "Prelude", bidfax: "prelude" },
  "HONDA|PROLOGUE": { autotempest: "Prologue", bidfax: "prologue" },

  // ── Dodge ────────────────────────────────────────────────────
  "DODGE|CHARGER SRT": { autotempest: "Charger", bidfax: "charger" },
  "DODGE|CHARGER": { autotempest: "Charger", bidfax: "charger" },
  "DODGE|CHALLENGER SRT": { autotempest: "Challenger", bidfax: "challenger" },
  "DODGE|CHALLENGER": { autotempest: "Challenger", bidfax: "challenger" },
  "DODGE|DURANGO": { autotempest: "Durango", bidfax: "durango" },
  "DODGE|VIPER": { autotempest: "Viper", bidfax: "viper" },
  "DODGE|DART": { autotempest: "Dart", bidfax: "dart" },
  "DODGE|JOURNEY": { autotempest: "Journey", bidfax: "journey" },
  "DODGE|HORNET": { autotempest: "Hornet", bidfax: "hornet" },
  "DODGE|GRAND CARAVAN": { autotempest: "GrandCaravan", bidfax: "grand-caravan" },

  // ── Ford ─────────────────────────────────────────────────────
  "FORD|MUSTANG": { autotempest: "Mustang", bidfax: "mustang" },
  "FORD|MUSTANG MACH-E": { autotempest: "MustangMachE", bidfax: "mustang-mach-e" },
  "FORD|MUSTANG MACH": { autotempest: "MustangMachE", bidfax: "mustang-mach-e" },
  "FORD|F-150": { autotempest: "F150", bidfax: "f150" },
  "FORD|F150": { autotempest: "F150", bidfax: "f150" },
  "FORD|F-150 LIGHTNING": { autotempest: "F150Lightning", bidfax: "f-150-lightning" },
  "FORD|F-250": { autotempest: "F250", bidfax: "f250" },
  "FORD|F250": { autotempest: "F250", bidfax: "f250" },
  "FORD|F-350": { autotempest: "F350", bidfax: "f350" },
  "FORD|F350": { autotempest: "F350", bidfax: "f350" },
  "FORD|BRONCO": { autotempest: "Bronco", bidfax: "bronco" },
  "FORD|EXPLORER": { autotempest: "Explorer", bidfax: "explorer" },
  "FORD|ESCAPE": { autotempest: "Escape", bidfax: "escape" },
  "FORD|EDGE": { autotempest: "Edge", bidfax: "edge" },
  "FORD|EXPEDITION": { autotempest: "Expedition", bidfax: "expedition" },
  "FORD|RANGER": { autotempest: "Ranger", bidfax: "ranger" },
  "FORD|MAVERICK": { autotempest: "Maverick", bidfax: "maverick" },
  "FORD|FUSION": { autotempest: "Fusion", bidfax: "fusion" },
  "FORD|FOCUS": { autotempest: "Focus", bidfax: "focus" },
  "FORD|TAURUS": { autotempest: "Taurus", bidfax: "taurus" },
  "FORD|ECOSPORT": { autotempest: "EcoSport", bidfax: "ecosport" },
  "FORD|FLEX": { autotempest: "Flex", bidfax: "flex" },
  "FORD|TRANSIT": { autotempest: "Transit", bidfax: "transit" },

  // ── Chevrolet ────────────────────────────────────────────────
  "CHEVROLET|CAMARO": { autotempest: "Camaro", bidfax: "camaro" },
  "CHEVROLET|CORVETTE": { autotempest: "Corvette", bidfax: "corvette" },
  "CHEVROLET|SILVERADO": { autotempest: "Silverado1500", bidfax: "silverado" },
  "CHEVROLET|TAHOE": { autotempest: "Tahoe", bidfax: "tahoe" },
  "CHEVROLET|SUBURBAN": { autotempest: "Suburban", bidfax: "suburban2" },
  "CHEVROLET|EQUINOX": { autotempest: "Equinox", bidfax: "equinox" },
  "CHEVROLET|TRAVERSE": { autotempest: "Traverse", bidfax: "traverse" },
  "CHEVROLET|MALIBU": { autotempest: "Malibu", bidfax: "malibu" },
  "CHEVROLET|TRAILBLAZER": { autotempest: "Trailblazer", bidfax: "trailblazer" },
  "CHEVROLET|BLAZER": { autotempest: "Blazer", bidfax: "blazer" },
  "CHEVROLET|COLORADO": { autotempest: "Colorado", bidfax: "colorado" },
  "CHEVROLET|IMPALA": { autotempest: "Impala", bidfax: "impala" },
  "CHEVROLET|CRUZE": { autotempest: "Cruze", bidfax: "cruze" },
  "CHEVROLET|TRAX": { autotempest: "Trax", bidfax: "trax" },
  "CHEVROLET|BOLT": { autotempest: "BoltEV", bidfax: "bolt-ev" },
  "CHEVROLET|SPARK": { autotempest: "Spark", bidfax: "spark" },
  "CHEVROLET|SONIC": { autotempest: "Sonic", bidfax: "sonic" },
  "CHEVROLET|SS": { autotempest: "SS", bidfax: "ss" },
  "CHEVROLET|VOLT": { autotempest: "Volt", bidfax: "volt" },

  // ── Lexus ────────────────────────────────────────────────────
  "LEXUS|IS": { autotempest: "IS", bidfax: "is" },
  "LEXUS|ES": { autotempest: "ES", bidfax: "es" },
  "LEXUS|GS": { autotempest: "GS", bidfax: "gs" },
  "LEXUS|LS": { autotempest: "LS", bidfax: "lsle" },
  "LEXUS|LC": { autotempest: "LC", bidfax: "lc" },
  "LEXUS|RC F": { autotempest: "RCF", bidfax: "rc-f" },
  "LEXUS|RC": { autotempest: "RC", bidfax: "rc" },
  "LEXUS|RX": { autotempest: "RX", bidfax: "rx" },
  "LEXUS|GX": { autotempest: "GX", bidfax: "gx" },
  "LEXUS|NX": { autotempest: "NX", bidfax: "nxle" },
  "LEXUS|LX": { autotempest: "LX", bidfax: "lx" },
  "LEXUS|UX": { autotempest: "UX", bidfax: "ux-250h" },
  "LEXUS|TX": { autotempest: "TX", bidfax: "tx" },
  "LEXUS|RZ": { autotempest: "RZ", bidfax: "rz" },

  // ── Porsche ──────────────────────────────────────────────────
  "PORSCHE|CAYMAN": { autotempest: "Cayman", bidfax: "cayman" },
  "PORSCHE|718": { autotempest: "Cayman", bidfax: "cayman" },
  "PORSCHE|BOXSTER": { autotempest: "Boxster", bidfax: "boxster" },
  "PORSCHE|911": { autotempest: "911", bidfax: "911" },
  "PORSCHE|MACAN": { autotempest: "Macan", bidfax: "macan" },
  "PORSCHE|CAYENNE": { autotempest: "Cayenne", bidfax: "cayenne" },
  "PORSCHE|PANAMERA": { autotempest: "Panamera", bidfax: "panamera" },
  "PORSCHE|TAYCAN": { autotempest: "Taycan", bidfax: "taycan" },

  // ── Mercedes-Benz ────────────────────────────────────────────
  // AutoTempest: NOTHING works for Mercedes :(
  // BidFax: uses "{letter}-class" format
  "MERCEDES-BENZ|A": { autotempest: "", bidfax: "a-class" },
  "MERCEDES-BENZ|C": { autotempest: "", bidfax: "c-class" },
  "MERCEDES-BENZ|CLA": { autotempest: "", bidfax: "cla-class" },
  "MERCEDES-BENZ|CLE": { autotempest: "", bidfax: "cle-class" },
  "MERCEDES-BENZ|CLK": { autotempest: "", bidfax: "clk-class" },
  "MERCEDES-BENZ|CLS": { autotempest: "", bidfax: "cls-class" },
  "MERCEDES-BENZ|E": { autotempest: "", bidfax: "e-class" },
  "MERCEDES-BENZ|G": { autotempest: "", bidfax: "g-class" },
  "MERCEDES-BENZ|GL": { autotempest: "", bidfax: "gl-class" },
  "MERCEDES-BENZ|GLA": { autotempest: "", bidfax: "gla-class" },
  "MERCEDES-BENZ|GLB": { autotempest: "", bidfax: "glb-250" },
  "MERCEDES-BENZ|GLC": { autotempest: "", bidfax: "glc" },
  "MERCEDES-BENZ|GLE": { autotempest: "", bidfax: "gle" },
  "MERCEDES-BENZ|GLE COUPE": { autotempest: "", bidfax: "gle-coupe" },
  "MERCEDES-BENZ|GLK": { autotempest: "", bidfax: "glk-class" },
  "MERCEDES-BENZ|GLS": { autotempest: "", bidfax: "gls" },
  "MERCEDES-BENZ|M": { autotempest: "", bidfax: "m-class" },
  "MERCEDES-BENZ|R": { autotempest: "", bidfax: "r-class" },
  "MERCEDES-BENZ|S": { autotempest: "", bidfax: "s-class" },
  "MERCEDES-BENZ|SL": { autotempest: "", bidfax: "sl-class" },
  "MERCEDES-BENZ|SLC": { autotempest: "", bidfax: "slc" },
  "MERCEDES-BENZ|SLK": { autotempest: "", bidfax: "slk" },
  "MERCEDES-BENZ|AMG GT": { autotempest: "", bidfax: "amg-gt" },
  "MERCEDES-BENZ|AMG": { autotempest: "", bidfax: "amg-gt" },
  "MERCEDES-BENZ|EQB": { autotempest: "", bidfax: "eqb" },
  "MERCEDES-BENZ|EQE": { autotempest: "", bidfax: "eqe" },
  "MERCEDES-BENZ|EQS": { autotempest: "", bidfax: "eqs" },
  "MERCEDES-BENZ|METRIS": { autotempest: "", bidfax: "metris" },
  "MERCEDES-BENZ|SPRINTER": { autotempest: "", bidfax: "sprinter" },

  // ── Audi ─────────────────────────────────────────────────────
  "AUDI|A3": { autotempest: "A3", bidfax: "a3" },
  "AUDI|A4": { autotempest: "A4", bidfax: "a4" },
  "AUDI|A4 ALLROAD": { autotempest: "A4allroad", bidfax: "a4-allroad" },
  "AUDI|A5": { autotempest: "A5", bidfax: "a5" },
  "AUDI|A6": { autotempest: "A6", bidfax: "a6" },
  "AUDI|A7": { autotempest: "A7", bidfax: "a7" },
  "AUDI|A8": { autotempest: "A8", bidfax: "a8" },
  "AUDI|E-TRON": { autotempest: "etron", bidfax: "e-tron" },
  "AUDI|Q3": { autotempest: "Q3", bidfax: "q3" },
  "AUDI|Q5": { autotempest: "Q5", bidfax: "q5" },
  "AUDI|Q7": { autotempest: "Q7", bidfax: "q7" },
  "AUDI|Q8": { autotempest: "Q8", bidfax: "q8" },
  "AUDI|R8": { autotempest: "R8", bidfax: "r8" },
  "AUDI|RS3": { autotempest: "RS3", bidfax: "rs3" },
  "AUDI|RS4": { autotempest: "RS4", bidfax: "rs4" },
  "AUDI|RS5": { autotempest: "RS5", bidfax: "rs5" },
  "AUDI|RS6": { autotempest: "RS6", bidfax: "rs6" },
  "AUDI|RS7": { autotempest: "RS7", bidfax: "rs7" },
  "AUDI|S3": { autotempest: "S3", bidfax: "s3" },
  "AUDI|S4": { autotempest: "S4", bidfax: "s4" },
  "AUDI|S5": { autotempest: "S5", bidfax: "s5" },
  "AUDI|S6": { autotempest: "S6", bidfax: "s6" },
  "AUDI|S7": { autotempest: "S7", bidfax: "s7" },
  "AUDI|S8": { autotempest: "S8", bidfax: "s8" },
  "AUDI|SQ5": { autotempest: "SQ5", bidfax: "sq5" },
  "AUDI|SQ7": { autotempest: "SQ7", bidfax: "sq7" },
  "AUDI|SQ8": { autotempest: "SQ8", bidfax: "sq8" },
  "AUDI|TT": { autotempest: "TT", bidfax: "tt" },
  "AUDI|TTS": { autotempest: "TTS", bidfax: "tts" },
  "AUDI|TTRS": { autotempest: "TTRS", bidfax: "tts" }, // no TTRS on BidFax, TTS closest

  // ── Jeep ─────────────────────────────────────────────────────
  "JEEP|WRANGLER": { autotempest: "Wrangler", bidfax: "wrangler" },
  "JEEP|WRANGLER UNLIMITED": { autotempest: "WranglerUnlimited", bidfax: "wrangler-unlimited" },
  "JEEP|GRAND CHEROKEE": { autotempest: "GrandCherokee", bidfax: "grand-cherokee" },
  "JEEP|GRAND": { autotempest: "GrandCherokee", bidfax: "grand-cherokee" },
  "JEEP|CHEROKEE": { autotempest: "Cherokee", bidfax: "cherokee" },
  "JEEP|GLADIATOR": { autotempest: "Gladiator", bidfax: "gladiator" },
  "JEEP|COMPASS": { autotempest: "Compass", bidfax: "compass" },
  "JEEP|RENEGADE": { autotempest: "Renegade", bidfax: "renegade" },
  "JEEP|GRAND WAGONEER": { autotempest: "GrandWagoneer", bidfax: "grand-wagoneer" },
  "JEEP|WAGONEER": { autotempest: "Wagoneer", bidfax: "wagoneer" },

  // ── Tesla ────────────────────────────────────────────────────
  "TESLA|MODEL Y": { autotempest: "ModelY", bidfax: "model-y" },
  "TESLA|MODEL 3": { autotempest: "Model3", bidfax: "model-3" },
  "TESLA|MODEL S": { autotempest: "ModelS", bidfax: "model-s" },
  "TESLA|MODEL X": { autotempest: "ModelX", bidfax: "model-x" },
  "TESLA|CYBERTRUCK": { autotempest: "Cybertruck", bidfax: "cybertruck" },

  // ── Nissan ───────────────────────────────────────────────────
  "NISSAN|370Z": { autotempest: "370Z", bidfax: "370z" },
  "NISSAN|350Z": { autotempest: "350Z", bidfax: "350z" },
  "NISSAN|Z": { autotempest: "Z", bidfax: "370z" }, // no standalone "z" on BidFax
  "NISSAN|GT-R": { autotempest: "GTR", bidfax: "gt-r" },
  "NISSAN|GTR": { autotempest: "GTR", bidfax: "gtr" },
  "NISSAN|ALTIMA": { autotempest: "Altima", bidfax: "altima" },
  "NISSAN|MAXIMA": { autotempest: "Maxima", bidfax: "maxima" },
  "NISSAN|SENTRA": { autotempest: "Sentra", bidfax: "sentra" },
  "NISSAN|ROGUE": { autotempest: "Rogue", bidfax: "rogue" },
  "NISSAN|PATHFINDER": { autotempest: "Pathfinder", bidfax: "pathfinder" },
  "NISSAN|MURANO": { autotempest: "Murano", bidfax: "murano" },
  "NISSAN|FRONTIER": { autotempest: "Frontier", bidfax: "frontier" },
  "NISSAN|TITAN": { autotempest: "Titan", bidfax: "titan" },
  "NISSAN|ARMADA": { autotempest: "Armada", bidfax: "armada" },
  "NISSAN|KICKS": { autotempest: "Kicks", bidfax: "kicks" },
  "NISSAN|LEAF": { autotempest: "Leaf", bidfax: "leaf" },
  "NISSAN|ARIYA": { autotempest: "Ariya", bidfax: "ariya" },
  "NISSAN|JUKE": { autotempest: "Juke", bidfax: "juke" },
  "NISSAN|VERSA": { autotempest: "Versa", bidfax: "versa" },

  // ── Hyundai ──────────────────────────────────────────────────
  "HYUNDAI|SONATA": { autotempest: "Sonata", bidfax: "sonata" },
  "HYUNDAI|ELANTRA": { autotempest: "Elantra", bidfax: "elantra" },
  "HYUNDAI|TUCSON": { autotempest: "Tucson", bidfax: "tucson" },
  "HYUNDAI|SANTA FE": { autotempest: "SantaFe", bidfax: "santa-fe" },
  "HYUNDAI|PALISADE": { autotempest: "Palisade", bidfax: "palisade" },
  "HYUNDAI|KONA": { autotempest: "Kona", bidfax: "kona" },
  "HYUNDAI|IONIQ": { autotempest: "Ioniq", bidfax: "ioniq" },
  "HYUNDAI|VELOSTER": { autotempest: "Veloster", bidfax: "veloster" },
  "HYUNDAI|GENESIS COUPE": { autotempest: "GenesisCoupe", bidfax: "genesis-coupe" },
  "HYUNDAI|ACCENT": { autotempest: "Accent", bidfax: "accent" },
  "HYUNDAI|VENUE": { autotempest: "Venue", bidfax: "venue" },
  "HYUNDAI|SANTA CRUZ": { autotempest: "SantaCruz", bidfax: "santa-cruz" },

  // ── Kia ──────────────────────────────────────────────────────
  "KIA|STINGER": { autotempest: "Stinger", bidfax: "stinger" },
  "KIA|TELLURIDE": { autotempest: "Telluride", bidfax: "telluride" },
  "KIA|SORENTO": { autotempest: "Sorento", bidfax: "sorento" },
  "KIA|SPORTAGE": { autotempest: "Sportage", bidfax: "sportage" },
  "KIA|FORTE": { autotempest: "Forte", bidfax: "forte" },
  "KIA|K5": { autotempest: "K5", bidfax: "k5" },
  "KIA|OPTIMA": { autotempest: "Optima", bidfax: "optima" },
  "KIA|SOUL": { autotempest: "Soul", bidfax: "soul" },
  "KIA|EV6": { autotempest: "EV6", bidfax: "ev6" },
  "KIA|EV9": { autotempest: "EV9", bidfax: "ev9" },
  "KIA|SELTOS": { autotempest: "Seltos", bidfax: "seltos" },
  "KIA|CARNIVAL": { autotempest: "Carnival", bidfax: "carnival" },
  "KIA|NIRO": { autotempest: "Niro", bidfax: "niro" },
  "KIA|RIO": { autotempest: "Rio", bidfax: "rio" },

  // ── Genesis ──────────────────────────────────────────────────
  "GENESIS|G70": { autotempest: "G70", bidfax: "g70" },
  "GENESIS|G80": { autotempest: "G80", bidfax: "g80" },
  "GENESIS|G90": { autotempest: "G90", bidfax: "g90" },
  "GENESIS|GV70": { autotempest: "GV70", bidfax: "gv70" },
  "GENESIS|GV80": { autotempest: "GV80", bidfax: "gv80" },
  "GENESIS|GV60": { autotempest: "GV60", bidfax: "gv60" },

  // ── Infiniti ─────────────────────────────────────────────────
  "INFINITI|Q50": { autotempest: "Q50", bidfax: "q50" },
  "INFINITI|Q60": { autotempest: "Q60", bidfax: "q60" },
  "INFINITI|Q70": { autotempest: "Q70", bidfax: "q70" },
  "INFINITI|QX50": { autotempest: "QX50", bidfax: "qx50" },
  "INFINITI|QX55": { autotempest: "QX55", bidfax: "qx55" },
  "INFINITI|QX60": { autotempest: "QX60", bidfax: "qx60" },
  "INFINITI|QX80": { autotempest: "QX80", bidfax: "qx80" },
  "INFINITI|G35": { autotempest: "G35", bidfax: "g35" },
  "INFINITI|G37": { autotempest: "G37", bidfax: "g37" },
  "INFINITI|FX35": { autotempest: "FX35", bidfax: "fx35" },
  "INFINITI|FX37": { autotempest: "FX37", bidfax: "fx37" },

  // ── Acura ────────────────────────────────────────────────────
  "ACURA|TLX": { autotempest: "TLX", bidfax: "tlx" },
  "ACURA|ILX": { autotempest: "ILX", bidfax: "ilx" },
  "ACURA|MDX": { autotempest: "MDX", bidfax: "mdx" },
  "ACURA|RDX": { autotempest: "RDX", bidfax: "rdx" },
  "ACURA|NSX": { autotempest: "NSX", bidfax: "nsx" },
  "ACURA|INTEGRA": { autotempest: "Integra", bidfax: "integra" },
  "ACURA|TSX": { autotempest: "TSX", bidfax: "tsx" },
  "ACURA|TL": { autotempest: "TL", bidfax: "tl" },
  "ACURA|RSX": { autotempest: "RSX", bidfax: "rsx" },
  "ACURA|ZDX": { autotempest: "ZDX", bidfax: "zdx" },
  "ACURA|RLX": { autotempest: "RLX", bidfax: "rlx" },

  // ── Subaru ───────────────────────────────────────────────────
  "SUBARU|WRX": { autotempest: "WRX", bidfax: "wrx" },
  "SUBARU|BRZ": { autotempest: "BRZ", bidfax: "brz" },
  "SUBARU|OUTBACK": { autotempest: "Outback", bidfax: "outback" },
  "SUBARU|FORESTER": { autotempest: "Forester", bidfax: "forester" },
  "SUBARU|CROSSTREK": { autotempest: "Crosstrek", bidfax: "crosstrek" },
  "SUBARU|IMPREZA": { autotempest: "Impreza", bidfax: "impreza" },
  "SUBARU|LEGACY": { autotempest: "Legacy", bidfax: "legacy" },
  "SUBARU|ASCENT": { autotempest: "Ascent", bidfax: "ascent" },

  // ── Volkswagen ───────────────────────────────────────────────
  "VOLKSWAGEN|GTI": { autotempest: "GTI", bidfax: "gti" },
  "VOLKSWAGEN|GOLF": { autotempest: "Golf", bidfax: "golf" },
  "VOLKSWAGEN|GOLF R": { autotempest: "GolfR", bidfax: "golf-r" },
  "VOLKSWAGEN|JETTA": { autotempest: "Jetta", bidfax: "jetta" },
  "VOLKSWAGEN|PASSAT": { autotempest: "Passat", bidfax: "passat" },
  "VOLKSWAGEN|TIGUAN": { autotempest: "Tiguan", bidfax: "tiguan" },
  "VOLKSWAGEN|ATLAS": { autotempest: "Atlas", bidfax: "atlas" },
  "VOLKSWAGEN|ARTEON": { autotempest: "Arteon", bidfax: "arteon" },
  "VOLKSWAGEN|BEETLE": { autotempest: "Beetle", bidfax: "beetle" },
  "VOLKSWAGEN|CC": { autotempest: "CC", bidfax: "cc" },
  "VOLKSWAGEN|ID.4": { autotempest: "ID4", bidfax: "id4" },
  "VOLKSWAGEN|ID4": { autotempest: "ID4", bidfax: "id4" },
  "VOLKSWAGEN|TAOS": { autotempest: "Taos", bidfax: "taos" },
  "VOLKSWAGEN|TOUAREG": { autotempest: "Touareg", bidfax: "touareg" },
  "VOLKSWAGEN|EOS": { autotempest: "Eos", bidfax: "eos" },

  // ── Volvo ────────────────────────────────────────────────────
  "VOLVO|S60": { autotempest: "S60", bidfax: "s60" },
  "VOLVO|S90": { autotempest: "S90", bidfax: "s90" },
  "VOLVO|V60": { autotempest: "V60", bidfax: "v60" },
  "VOLVO|V90": { autotempest: "V90", bidfax: "v90" },
  "VOLVO|XC40": { autotempest: "XC40", bidfax: "xc40" },
  "VOLVO|XC60": { autotempest: "XC60", bidfax: "xc60" },
  "VOLVO|XC90": { autotempest: "XC90", bidfax: "xc90" },
  "VOLVO|C40": { autotempest: "C40", bidfax: "c40" },
  "VOLVO|EX30": { autotempest: "EX30", bidfax: "ex30" },

  // ── Land Rover ───────────────────────────────────────────────
  "LAND ROVER|RANGE ROVER": { autotempest: "RangeRover", bidfax: "range-rover" },
  "LAND ROVER|RANGE ROVER SPORT": { autotempest: "RangeRoverSport", bidfax: "range-rover-sport" },
  "LAND ROVER|RANGE ROVER EVOQUE": { autotempest: "RangeRoverEvoque", bidfax: "range-rover-evoque" },
  "LAND ROVER|DEFENDER": { autotempest: "Defender", bidfax: "defender" },
  "LAND ROVER|DISCOVERY": { autotempest: "Discovery", bidfax: "discovery" },
  "LAND ROVER|DISCOVERY SPORT": { autotempest: "DiscoverySport", bidfax: "discovery-sport" },

  // ── Jaguar ───────────────────────────────────────────────────
  "JAGUAR|F-TYPE": { autotempest: "FTYPE", bidfax: "f-type" },
  "JAGUAR|F-PACE": { autotempest: "FPACE", bidfax: "f-pace" },
  "JAGUAR|E-PACE": { autotempest: "EPACE", bidfax: "e-pace" },
  "JAGUAR|I-PACE": { autotempest: "IPACE", bidfax: "i-pace" },
  "JAGUAR|XE": { autotempest: "XE", bidfax: "xe" },
  "JAGUAR|XF": { autotempest: "XF", bidfax: "xf" },
  "JAGUAR|XJ": { autotempest: "XJ", bidfax: "xj" },
  "JAGUAR|XK": { autotempest: "XK", bidfax: "xk" },

  // ── Maserati ─────────────────────────────────────────────────
  "MASERATI|GHIBLI": { autotempest: "Ghibli", bidfax: "ghibli" },
  "MASERATI|LEVANTE": { autotempest: "Levante", bidfax: "levante" },
  "MASERATI|QUATTROPORTE": { autotempest: "Quattroporte", bidfax: "quattroporte" },
  "MASERATI|GRANTURISMO": { autotempest: "GranTurismo", bidfax: "granturismo" },
  "MASERATI|GRECALE": { autotempest: "Grecale", bidfax: "grecale" },
  "MASERATI|MC20": { autotempest: "MC20", bidfax: "mc20" },

  // ── Alfa Romeo ───────────────────────────────────────────────
  "ALFA ROMEO|GIULIA": { autotempest: "Giulia", bidfax: "giulia" },
  "ALFA ROMEO|STELVIO": { autotempest: "Stelvio", bidfax: "stelvio" },
  "ALFA ROMEO|4C": { autotempest: "4C", bidfax: "4c" },
  "ALFA ROMEO|TONALE": { autotempest: "Tonale", bidfax: "tonale" },

  // ── McLaren ──────────────────────────────────────────────────
  // BidFax make slug is "mclaren-automotive" (not "mclaren")
  "MCLAREN|720S": { autotempest: "720S", bidfax: "720s" },
  "MCLAREN|570S": { autotempest: "570S", bidfax: "570s" },
  "MCLAREN|570GT": { autotempest: "570GT", bidfax: "570gt" },
  "MCLAREN|675LT": { autotempest: "675LT", bidfax: "675lt" },
  "MCLAREN|650S": { autotempest: "650S", bidfax: "650s" },
  "MCLAREN|ARTURA": { autotempest: "Artura", bidfax: "artura" },
  "MCLAREN|MP4-12C": { autotempest: "MP412C", bidfax: "mp4-12c" },

  // ── Lamborghini ──────────────────────────────────────────────
  "LAMBORGHINI|HURACAN": { autotempest: "Huracan", bidfax: "huracan" },
  "LAMBORGHINI|URUS": { autotempest: "Urus", bidfax: "urus" },
  "LAMBORGHINI|AVENTADOR": { autotempest: "Aventador", bidfax: "aventador" },
  "LAMBORGHINI|GALLARDO": { autotempest: "Gallardo", bidfax: "gallardo" },
  "LAMBORGHINI|REVUELTO": { autotempest: "Revuelto", bidfax: "revuelto" },

  // ── Ferrari ──────────────────────────────────────────────────
  "FERRARI|488": { autotempest: "488", bidfax: "488" },
  "FERRARI|458": { autotempest: "458", bidfax: "458-italia" },
  "FERRARI|F430": { autotempest: "F430", bidfax: "f430" },
  "FERRARI|CALIFORNIA": { autotempest: "California", bidfax: "california" },
  "FERRARI|ROMA": { autotempest: "Roma", bidfax: "roma" },
  "FERRARI|FF": { autotempest: "FF", bidfax: "ff" },

  // ── Bentley ──────────────────────────────────────────────────
  "BENTLEY|BENTAYGA": { autotempest: "Bentayga", bidfax: "bentayga" },
  "BENTLEY|CONTINENTAL": { autotempest: "Continental", bidfax: "continentall" },
  "BENTLEY|FLYING SPUR": { autotempest: "FlyingSpur", bidfax: "flying" },
  "BENTLEY|MULSANNE": { autotempest: "Mulsanne", bidfax: "mulsanne" },

  // ── Rolls-Royce ──────────────────────────────────────────────
  "ROLLS-ROYCE|CULLINAN": { autotempest: "Cullinan", bidfax: "cullinan" },
  "ROLLS-ROYCE|GHOST": { autotempest: "Ghost", bidfax: "ghost" },
  "ROLLS-ROYCE|WRAITH": { autotempest: "Wraith", bidfax: "wraith" },
  "ROLLS-ROYCE|DAWN": { autotempest: "Dawn", bidfax: "dawn" },
  "ROLLS-ROYCE|PHANTOM": { autotempest: "Phantom", bidfax: "phantom" },
  "ROLLS-ROYCE|SPECTRE": { autotempest: "Spectre", bidfax: "spectre" },

  // ── Aston Martin ─────────────────────────────────────────────
  "ASTON MARTIN|VANTAGE": { autotempest: "Vantage", bidfax: "vantage" },
  "ASTON MARTIN|DB11": { autotempest: "DB11", bidfax: "db11" },
  "ASTON MARTIN|DB9": { autotempest: "DB9", bidfax: "db9" },
  "ASTON MARTIN|DBX": { autotempest: "DBX", bidfax: "dbx" },
  "ASTON MARTIN|VANQUISH": { autotempest: "Vanquish", bidfax: "vanquish" },
  "ASTON MARTIN|RAPIDE": { autotempest: "Rapide", bidfax: "rapide" },

  // ── Lotus ────────────────────────────────────────────────────
  "LOTUS|EMIRA": { autotempest: "Emira", bidfax: "emira" },
  "LOTUS|EVORA": { autotempest: "Evora", bidfax: "evora" },
  "LOTUS|ELISE": { autotempest: "Elise", bidfax: "elise" },

  // ── Mazda ────────────────────────────────────────────────────
  "MAZDA|MX-5": { autotempest: "MX5Miata", bidfax: "mx-5-miata" },
  "MAZDA|MIATA": { autotempest: "MX5Miata", bidfax: "mx-5-miata" },
  "MAZDA|3": { autotempest: "Mazda3", bidfax: "3" },
  "MAZDA|MAZDA3": { autotempest: "Mazda3", bidfax: "3" },
  "MAZDA|6": { autotempest: "Mazda6", bidfax: "6" },
  "MAZDA|MAZDA6": { autotempest: "Mazda6", bidfax: "6" },
  "MAZDA|CX-5": { autotempest: "CX5", bidfax: "cx-5" },
  "MAZDA|CX-30": { autotempest: "CX30", bidfax: "cx-30" },
  "MAZDA|CX-50": { autotempest: "CX50", bidfax: "cx-50" },
  "MAZDA|CX-9": { autotempest: "CX9", bidfax: "cx-9" },
  "MAZDA|CX-90": { autotempest: "CX90", bidfax: "cx-90" },
  "MAZDA|RX-7": { autotempest: "RX7", bidfax: "rx7" },
  "MAZDA|RX-8": { autotempest: "RX8", bidfax: "rx8" },

  // ── Cadillac ─────────────────────────────────────────────────
  "CADILLAC|ESCALADE": { autotempest: "Escalade", bidfax: "escalade" },
  "CADILLAC|CT4": { autotempest: "CT4", bidfax: "ct4" },
  "CADILLAC|CT5": { autotempest: "CT5", bidfax: "ct5" },
  "CADILLAC|CT6": { autotempest: "CT6", bidfax: "ct6" },
  "CADILLAC|CTS": { autotempest: "CTS", bidfax: "cts" },
  "CADILLAC|CTS-V": { autotempest: "CTSV", bidfax: "cts-v" },
  "CADILLAC|ATS": { autotempest: "ATS", bidfax: "ats" },
  "CADILLAC|ATS-V": { autotempest: "ATSV", bidfax: "ats-v" },
  "CADILLAC|XT4": { autotempest: "XT4", bidfax: "xt4" },
  "CADILLAC|XT5": { autotempest: "XT5", bidfax: "xt5" },
  "CADILLAC|XT6": { autotempest: "XT6", bidfax: "xt6" },
  "CADILLAC|LYRIQ": { autotempest: "Lyriq", bidfax: "lyriq" },
  "CADILLAC|XTS": { autotempest: "XTS", bidfax: "xts" },

  // ── Lincoln ──────────────────────────────────────────────────
  "LINCOLN|NAVIGATOR": { autotempest: "Navigator", bidfax: "navigator" },
  "LINCOLN|AVIATOR": { autotempest: "Aviator", bidfax: "aviator" },
  "LINCOLN|CORSAIR": { autotempest: "Corsair", bidfax: "corsair" },
  "LINCOLN|NAUTILUS": { autotempest: "Nautilus", bidfax: "nautilus" },
  "LINCOLN|MKZ": { autotempest: "MKZ", bidfax: "mkz" },
  "LINCOLN|MKC": { autotempest: "MKC", bidfax: "mkc" },
  "LINCOLN|CONTINENTAL": { autotempest: "Continental", bidfax: "continental" },

  // ── Chrysler ─────────────────────────────────────────────────
  "CHRYSLER|300": { autotempest: "300", bidfax: "chr300" },
  "CHRYSLER|PACIFICA": { autotempest: "Pacifica", bidfax: "pacifica" },

  // ── GMC ──────────────────────────────────────────────────────
  "GMC|SIERRA": { autotempest: "Sierra1500", bidfax: "sierra" },
  "GMC|YUKON": { autotempest: "Yukon", bidfax: "yukon" },
  "GMC|ACADIA": { autotempest: "Acadia", bidfax: "acadia" },
  "GMC|TERRAIN": { autotempest: "Terrain", bidfax: "terrain" },
  "GMC|CANYON": { autotempest: "Canyon", bidfax: "canyon" },
  "GMC|HUMMER EV": { autotempest: "HummerEV", bidfax: "hummer-ev" },

  // ── RAM ──────────────────────────────────────────────────────
  "RAM|1500": { autotempest: "1500", bidfax: "1500r" },
  "RAM|2500": { autotempest: "2500", bidfax: "2500r" },
  "RAM|PROMASTER": { autotempest: "ProMaster", bidfax: "promaster" },

  // ── Rivian ───────────────────────────────────────────────────
  "RIVIAN|R1T": { autotempest: "R1T", bidfax: "r1t" },
  "RIVIAN|R1S": { autotempest: "R1S", bidfax: "r1s" },

  // ── Polestar ─────────────────────────────────────────────────
  "POLESTAR|2": { autotempest: "Polestar2", bidfax: "2" },

  // ── Pontiac (used market) ────────────────────────────────────
  "PONTIAC|GTO": { autotempest: "GTO", bidfax: "gto" },
  "PONTIAC|FIREBIRD": { autotempest: "Firebird", bidfax: "firebird" },
  "PONTIAC|G8": { autotempest: "G8", bidfax: "g8" },
  "PONTIAC|SOLSTICE": { autotempest: "Solstice", bidfax: "solstice" },

  // ── Hummer ───────────────────────────────────────────────────
  "HUMMER|H2": { autotempest: "H2", bidfax: "h2" },
  "HUMMER|H3": { autotempest: "H3", bidfax: "h3" },

  // ── Mitsubishi ───────────────────────────────────────────────
  "MITSUBISHI|ECLIPSE": { autotempest: "EclipseCross", bidfax: "eclipse" },
  "MITSUBISHI|OUTLANDER": { autotempest: "Outlander", bidfax: "outlander" },
  "MITSUBISHI|LANCER": { autotempest: "Lancer", bidfax: "lancer" },

  // ── Mini ─────────────────────────────────────────────────────
  "MINI|COOPER": { autotempest: "Cooper", bidfax: "cooper" },

  // ── Fiat ─────────────────────────────────────────────────────
  "FIAT|500": { autotempest: "500", bidfax: "fi500" },
  "FIAT|124 SPIDER": { autotempest: "124Spider", bidfax: "124-spider" },
};

/**
 * BidFax make slugs that differ from the obvious lowercase-hyphenated name.
 * Used by the BidFax scraper to build the correct URL.
 */
export const BIDFAX_MAKE_SLUGS: Record<string, string> = {
  "MCLAREN": "mclaren-automotive",
  "ALFA ROMEO": "alfa-romeo",
  "ASTON MARTIN": "aston-martin",
  "LAND ROVER": "land-rover",
  "ROLLS-ROYCE": "rolls-royce",
  "MERCEDES-BENZ": "mercedes-benz",
};

export function getBidfaxMakeSlug(make: string): string {
  return BIDFAX_MAKE_SLUGS[make.toUpperCase()] || make.toLowerCase().replace(/\s+/g, "-");
}

export function getModelNames(make: string, model: string): { autotempest: string; bidfax: string } {
  const makeUp = make.toUpperCase();
  const modelUp = model.toUpperCase();
  const baseModel = modelUp.split(/\s+/)[0];

  // Try exact make|fullModel
  const fullKey = `${makeUp}|${modelUp}`;
  if (MODEL_MAP[fullKey]) return MODEL_MAP[fullKey];

  // Try make|firstTwoWords (for "GR SUPRA", "MODEL Y", "GRAND CHEROKEE", etc.)
  const twoWords = modelUp.split(/\s+/).slice(0, 2).join(" ");
  const twoKey = `${makeUp}|${twoWords}`;
  if (MODEL_MAP[twoKey]) return MODEL_MAP[twoKey];

  // Try make|baseModel
  const baseKey = `${makeUp}|${baseModel}`;
  if (MODEL_MAP[baseKey]) return MODEL_MAP[baseKey];

  // Try partial — prefer the longest matching key (so M340 beats M3)
  let bestMatch: ModelMapping | null = null;
  let bestLen = 0;
  for (const [key, val] of Object.entries(MODEL_MAP)) {
    const [keyMake, keyModel] = key.split("|");
    if (keyMake === makeUp && modelUp.startsWith(keyModel) && keyModel.length > bestLen) {
      bestMatch = val;
      bestLen = keyModel.length;
    }
  }
  if (bestMatch) return bestMatch;

  // Fallback: best guess
  return {
    autotempest: baseModel.charAt(0) + baseModel.slice(1).toLowerCase(),
    bidfax: baseModel.toLowerCase().replace(/\s+/g, "-"),
  };
}
