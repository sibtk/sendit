/**
 * Vehicle generation lookup table.
 *
 * Maps make/model to generation year ranges so comps only pull from
 * the same platform — a 2016 ND Miata doesn't get compared to a 2015 NC.
 *
 * Only covers common flip cars. For anything not listed, falls back to ±3 years.
 */

interface Generation {
  gen: string;       // e.g. "ND", "S550", "G20"
  years: [number, number]; // inclusive [start, end]
}

// Format: "MAKE|MODEL_PREFIX" → generations sorted by year
// Focused on high-volume auction cars where generation boundaries create real value differences
const GENERATIONS: Record<string, Generation[]> = {

  // ══════════════════════════════════════════════════════════════
  // TOYOTA — highest auction volume
  // ══════════════════════════════════════════════════════════════
  "TOYOTA|CAMRY": [
    { gen: "XV40", years: [2007, 2011] },
    { gen: "XV50", years: [2012, 2017] },
    { gen: "XV70", years: [2018, 2024] },
    { gen: "XV80", years: [2025, 2026] },
  ],
  "TOYOTA|COROLLA": [
    { gen: "E140", years: [2009, 2013] },
    { gen: "E170", years: [2014, 2019] },
    { gen: "E210", years: [2020, 2026] },
  ],
  "TOYOTA|RAV4": [
    { gen: "XA30", years: [2006, 2012] },
    { gen: "XA40", years: [2013, 2018] },
    { gen: "XA50", years: [2019, 2026] },
  ],
  "TOYOTA|HIGHLANDER": [
    { gen: "XU40", years: [2008, 2013] },
    { gen: "XU50", years: [2014, 2019] },
    { gen: "XU70", years: [2020, 2026] },
  ],
  "TOYOTA|4RUNNER": [
    { gen: "N280", years: [2010, 2024] },
    { gen: "N300", years: [2025, 2026] },
  ],
  "TOYOTA|TACOMA": [
    { gen: "N200", years: [2005, 2015] },
    { gen: "N300", years: [2016, 2023] },
    { gen: "N400", years: [2024, 2026] },
  ],
  "TOYOTA|TUNDRA": [
    { gen: "XK50", years: [2007, 2021] },
    { gen: "XK70", years: [2022, 2026] },
  ],
  "TOYOTA|PRIUS": [
    { gen: "XW30", years: [2010, 2015] },
    { gen: "XW50", years: [2016, 2022] },
    { gen: "XW60", years: [2023, 2026] },
  ],
  "TOYOTA|SIENNA": [
    { gen: "XL30", years: [2011, 2020] },
    { gen: "XL40", years: [2021, 2026] },
  ],
  "TOYOTA|SEQUOIA": [
    { gen: "XK60", years: [2008, 2022] },
    { gen: "XK70", years: [2023, 2026] },
  ],
  "TOYOTA|VENZA": [
    { gen: "GV10", years: [2009, 2015] },
    { gen: "XU80", years: [2021, 2026] },
  ],
  "TOYOTA|C-HR": [
    { gen: "AX10", years: [2018, 2022] },
    { gen: "AX50", years: [2024, 2026] },
  ],
  "TOYOTA|SUPRA": [
    { gen: "A80", years: [1993, 2002] },
    { gen: "A90", years: [2020, 2026] },
  ],
  "TOYOTA|GR SUPRA": [
    { gen: "A90", years: [2020, 2026] },
  ],
  "TOYOTA|GR86": [
    { gen: "ZN8", years: [2022, 2026] },
  ],
  "TOYOTA|86": [
    { gen: "ZN6", years: [2013, 2020] },
  ],
  "TOYOTA|GR COROLLA": [
    { gen: "E210", years: [2023, 2026] },
  ],
  "TOYOTA|LAND CRUISER": [
    { gen: "J200", years: [2008, 2021] },
    { gen: "J300", years: [2024, 2026] },
  ],
  "TOYOTA|COROLLA CROSS": [
    { gen: "XG10", years: [2022, 2026] },
  ],

  // ══════════════════════════════════════════════════════════════
  // HONDA — second highest auction volume
  // ══════════════════════════════════════════════════════════════
  "HONDA|CIVIC": [
    { gen: "8th", years: [2006, 2011] },
    { gen: "9th", years: [2012, 2015] },
    { gen: "10th", years: [2016, 2021] },
    { gen: "11th", years: [2022, 2026] },
  ],
  "HONDA|ACCORD": [
    { gen: "8th", years: [2008, 2012] },
    { gen: "9th", years: [2013, 2017] },
    { gen: "10th", years: [2018, 2022] },
    { gen: "11th", years: [2023, 2026] },
  ],
  "HONDA|CR-V": [
    { gen: "3rd", years: [2007, 2011] },
    { gen: "4th", years: [2012, 2016] },
    { gen: "5th", years: [2017, 2022] },
    { gen: "6th", years: [2023, 2026] },
  ],
  "HONDA|HR-V": [
    { gen: "1st", years: [2016, 2022] },
    { gen: "2nd", years: [2023, 2026] },
  ],
  "HONDA|PILOT": [
    { gen: "2nd", years: [2009, 2015] },
    { gen: "3rd", years: [2016, 2022] },
    { gen: "4th", years: [2023, 2026] },
  ],
  "HONDA|ODYSSEY": [
    { gen: "4th", years: [2011, 2017] },
    { gen: "5th", years: [2018, 2026] },
  ],
  "HONDA|FIT": [
    { gen: "2nd", years: [2009, 2013] },
    { gen: "3rd", years: [2015, 2020] },
  ],
  "HONDA|PASSPORT": [
    { gen: "3rd", years: [2019, 2026] },
  ],
  "HONDA|RIDGELINE": [
    { gen: "1st", years: [2006, 2014] },
    { gen: "2nd", years: [2017, 2026] },
  ],

  // ══════════════════════════════════════════════════════════════
  // FORD
  // ══════════════════════════════════════════════════════════════
  "FORD|MUSTANG": [
    { gen: "SN95", years: [1994, 2004] },
    { gen: "S197", years: [2005, 2014] },
    { gen: "S550", years: [2015, 2023] },
    { gen: "S650", years: [2024, 2026] },
  ],
  "FORD|F-150": [
    { gen: "11th", years: [2004, 2008] },
    { gen: "12th", years: [2009, 2014] },
    { gen: "13th", years: [2015, 2020] },
    { gen: "14th", years: [2021, 2026] },
  ],
  "FORD|F150": [
    { gen: "11th", years: [2004, 2008] },
    { gen: "12th", years: [2009, 2014] },
    { gen: "13th", years: [2015, 2020] },
    { gen: "14th", years: [2021, 2026] },
  ],
  "FORD|F-250": [
    { gen: "3rd", years: [2011, 2016] },
    { gen: "4th", years: [2017, 2026] },
  ],
  "FORD|F250": [
    { gen: "3rd", years: [2011, 2016] },
    { gen: "4th", years: [2017, 2026] },
  ],
  "FORD|EXPLORER": [
    { gen: "5th", years: [2011, 2019] },
    { gen: "6th", years: [2020, 2026] },
  ],
  "FORD|ESCAPE": [
    { gen: "3rd", years: [2013, 2019] },
    { gen: "4th", years: [2020, 2026] },
  ],
  "FORD|EDGE": [
    { gen: "1st", years: [2007, 2014] },
    { gen: "2nd", years: [2015, 2024] },
  ],
  "FORD|EXPEDITION": [
    { gen: "3rd", years: [2007, 2017] },
    { gen: "4th", years: [2018, 2026] },
  ],
  "FORD|RANGER": [
    { gen: "T6", years: [2019, 2023] },
    { gen: "T6.2", years: [2024, 2026] },
  ],
  "FORD|BRONCO": [
    { gen: "6th", years: [2021, 2026] },
  ],
  "FORD|FUSION": [
    { gen: "1st", years: [2006, 2012] },
    { gen: "2nd", years: [2013, 2020] },
  ],
  "FORD|FOCUS": [
    { gen: "3rd", years: [2012, 2018] },
  ],
  "FORD|MAVERICK": [
    { gen: "1st", years: [2022, 2026] },
  ],

  // ══════════════════════════════════════════════════════════════
  // CHEVROLET
  // ══════════════════════════════════════════════════════════════
  "CHEVROLET|CAMARO": [
    { gen: "4th", years: [1993, 2002] },
    { gen: "5th", years: [2010, 2015] },
    { gen: "6th", years: [2016, 2024] },
  ],
  "CHEVROLET|CORVETTE": [
    { gen: "C5", years: [1997, 2004] },
    { gen: "C6", years: [2005, 2013] },
    { gen: "C7", years: [2014, 2019] },
    { gen: "C8", years: [2020, 2026] },
  ],
  "CHEVROLET|SILVERADO": [
    { gen: "K2XX", years: [2014, 2018] },
    { gen: "T1XX", years: [2019, 2026] },
  ],
  "CHEVROLET|TAHOE": [
    { gen: "GMT900", years: [2007, 2014] },
    { gen: "K2XX", years: [2015, 2020] },
    { gen: "T1XX", years: [2021, 2026] },
  ],
  "CHEVROLET|SUBURBAN": [
    { gen: "GMT900", years: [2007, 2014] },
    { gen: "K2XX", years: [2015, 2020] },
    { gen: "T1XX", years: [2021, 2026] },
  ],
  "CHEVROLET|EQUINOX": [
    { gen: "2nd", years: [2010, 2017] },
    { gen: "3rd", years: [2018, 2024] },
    { gen: "4th", years: [2025, 2026] },
  ],
  "CHEVROLET|TRAVERSE": [
    { gen: "1st", years: [2009, 2017] },
    { gen: "2nd", years: [2018, 2026] },
  ],
  "CHEVROLET|MALIBU": [
    { gen: "8th", years: [2008, 2012] },
    { gen: "9th", years: [2013, 2015] },
    { gen: "10th", years: [2016, 2024] },
  ],
  "CHEVROLET|COLORADO": [
    { gen: "2nd", years: [2015, 2022] },
    { gen: "3rd", years: [2023, 2026] },
  ],
  "CHEVROLET|BLAZER": [
    { gen: "New", years: [2019, 2026] },
  ],
  "CHEVROLET|TRAX": [
    { gen: "1st", years: [2015, 2022] },
    { gen: "2nd", years: [2024, 2026] },
  ],
  "CHEVROLET|IMPALA": [
    { gen: "9th", years: [2006, 2013] },
    { gen: "10th", years: [2014, 2020] },
  ],

  // ══════════════════════════════════════════════════════════════
  // DODGE / CHRYSLER / RAM
  // ══════════════════════════════════════════════════════════════
  "DODGE|CHARGER": [
    { gen: "LX", years: [2006, 2010] },
    { gen: "LD", years: [2011, 2023] },
    { gen: "New", years: [2024, 2026] },
  ],
  "DODGE|CHALLENGER": [
    { gen: "LC", years: [2008, 2023] },
  ],
  "DODGE|DURANGO": [
    { gen: "WD", years: [2011, 2026] },
  ],
  "DODGE|JOURNEY": [
    { gen: "JC", years: [2009, 2020] },
  ],
  "DODGE|GRAND CARAVAN": [
    { gen: "RT", years: [2008, 2020] },
  ],
  "CHRYSLER|300": [
    { gen: "LX", years: [2005, 2010] },
    { gen: "LD", years: [2011, 2023] },
  ],
  "CHRYSLER|PACIFICA": [
    { gen: "RU", years: [2017, 2026] },
  ],
  "RAM|1500": [
    { gen: "DS", years: [2009, 2018] },
    { gen: "DT", years: [2019, 2026] },
  ],
  "RAM|2500": [
    { gen: "DJ", years: [2010, 2018] },
    { gen: "D2", years: [2019, 2026] },
  ],

  // ══════════════════════════════════════════════════════════════
  // NISSAN
  // ══════════════════════════════════════════════════════════════
  "NISSAN|ALTIMA": [
    { gen: "L32", years: [2007, 2012] },
    { gen: "L33", years: [2013, 2018] },
    { gen: "L34", years: [2019, 2026] },
  ],
  "NISSAN|SENTRA": [
    { gen: "B17", years: [2013, 2019] },
    { gen: "B18", years: [2020, 2026] },
  ],
  "NISSAN|MAXIMA": [
    { gen: "A35", years: [2009, 2014] },
    { gen: "A36", years: [2016, 2023] },
  ],
  "NISSAN|ROGUE": [
    { gen: "T32", years: [2014, 2020] },
    { gen: "T33", years: [2021, 2026] },
  ],
  "NISSAN|PATHFINDER": [
    { gen: "R52", years: [2013, 2020] },
    { gen: "R53", years: [2022, 2026] },
  ],
  "NISSAN|MURANO": [
    { gen: "Z51", years: [2009, 2014] },
    { gen: "Z52", years: [2015, 2026] },
  ],
  "NISSAN|FRONTIER": [
    { gen: "D40", years: [2005, 2021] },
    { gen: "D41", years: [2022, 2026] },
  ],
  "NISSAN|TITAN": [
    { gen: "A60", years: [2004, 2015] },
    { gen: "A61", years: [2016, 2026] },
  ],
  "NISSAN|370Z": [
    { gen: "Z34", years: [2009, 2020] },
  ],
  "NISSAN|350Z": [
    { gen: "Z33", years: [2003, 2009] },
  ],
  "NISSAN|Z": [
    { gen: "RZ34", years: [2023, 2026] },
  ],
  "NISSAN|GT-R": [
    { gen: "R35", years: [2009, 2026] },
  ],
  "NISSAN|KICKS": [
    { gen: "P15", years: [2018, 2026] },
  ],
  "NISSAN|VERSA": [
    { gen: "N17", years: [2012, 2019] },
    { gen: "N18", years: [2020, 2026] },
  ],
  "NISSAN|ARMADA": [
    { gen: "Y62", years: [2017, 2026] },
  ],

  // ══════════════════════════════════════════════════════════════
  // HYUNDAI / KIA / GENESIS
  // ══════════════════════════════════════════════════════════════
  "HYUNDAI|SONATA": [
    { gen: "YF", years: [2011, 2014] },
    { gen: "LF", years: [2015, 2019] },
    { gen: "DN8", years: [2020, 2026] },
  ],
  "HYUNDAI|ELANTRA": [
    { gen: "MD", years: [2011, 2016] },
    { gen: "AD", years: [2017, 2020] },
    { gen: "CN7", years: [2021, 2026] },
  ],
  "HYUNDAI|TUCSON": [
    { gen: "LM", years: [2010, 2015] },
    { gen: "TL", years: [2016, 2021] },
    { gen: "NX4", years: [2022, 2026] },
  ],
  "HYUNDAI|SANTA FE": [
    { gen: "DM", years: [2013, 2018] },
    { gen: "TM", years: [2019, 2023] },
    { gen: "MX5", years: [2024, 2026] },
  ],
  "HYUNDAI|KONA": [
    { gen: "OS", years: [2018, 2023] },
    { gen: "SX2", years: [2024, 2026] },
  ],
  "HYUNDAI|PALISADE": [
    { gen: "LX2", years: [2020, 2026] },
  ],
  "HYUNDAI|VELOSTER": [
    { gen: "FS", years: [2012, 2017] },
    { gen: "JS", years: [2019, 2022] },
  ],
  "HYUNDAI|ACCENT": [
    { gen: "RB", years: [2012, 2017] },
    { gen: "HC", years: [2018, 2022] },
  ],
  "HYUNDAI|SANTA CRUZ": [
    { gen: "NX4", years: [2022, 2026] },
  ],
  "KIA|OPTIMA": [
    { gen: "TF", years: [2011, 2015] },
    { gen: "JF", years: [2016, 2020] },
  ],
  "KIA|K5": [
    { gen: "DL3", years: [2021, 2026] },
  ],
  "KIA|SORENTO": [
    { gen: "XM", years: [2011, 2015] },
    { gen: "UM", years: [2016, 2020] },
    { gen: "MQ4", years: [2021, 2026] },
  ],
  "KIA|SPORTAGE": [
    { gen: "SL", years: [2011, 2016] },
    { gen: "QL", years: [2017, 2022] },
    { gen: "NQ5", years: [2023, 2026] },
  ],
  "KIA|FORTE": [
    { gen: "YD", years: [2014, 2018] },
    { gen: "BD", years: [2019, 2026] },
  ],
  "KIA|SOUL": [
    { gen: "AM", years: [2010, 2013] },
    { gen: "PS", years: [2014, 2019] },
    { gen: "SK3", years: [2020, 2026] },
  ],
  "KIA|TELLURIDE": [
    { gen: "ON", years: [2020, 2026] },
  ],
  "KIA|STINGER": [
    { gen: "CK", years: [2018, 2023] },
  ],
  "KIA|SELTOS": [
    { gen: "SP2", years: [2021, 2026] },
  ],
  "KIA|EV6": [
    { gen: "CV", years: [2022, 2026] },
  ],
  "GENESIS|G70": [
    { gen: "IK", years: [2019, 2026] },
  ],
  "GENESIS|G80": [
    { gen: "DH", years: [2017, 2020] },
    { gen: "RG3", years: [2021, 2026] },
  ],
  "GENESIS|G90": [
    { gen: "HI", years: [2017, 2022] },
    { gen: "RS4", years: [2023, 2026] },
  ],
  "GENESIS|GV70": [
    { gen: "JK1", years: [2022, 2026] },
  ],
  "GENESIS|GV80": [
    { gen: "JX1", years: [2021, 2026] },
  ],

  // ══════════════════════════════════════════════════════════════
  // BMW
  // ══════════════════════════════════════════════════════════════
  "BMW|M2": [
    { gen: "F87", years: [2016, 2021] },
    { gen: "G87", years: [2023, 2026] },
  ],
  "BMW|M3": [
    { gen: "E90", years: [2008, 2013] },
    { gen: "F80", years: [2014, 2018] },
    { gen: "G80", years: [2021, 2026] },
  ],
  "BMW|M4": [
    { gen: "F82", years: [2014, 2020] },
    { gen: "G82", years: [2021, 2026] },
  ],
  "BMW|M5": [
    { gen: "F10", years: [2012, 2016] },
    { gen: "F90", years: [2018, 2024] },
    { gen: "G90", years: [2025, 2026] },
  ],
  "BMW|228": [
    { gen: "F22", years: [2014, 2021] },
    { gen: "F44", years: [2020, 2026] }, // Gran Coupe
  ],
  "BMW|230": [
    { gen: "F22", years: [2017, 2021] },
    { gen: "G42", years: [2022, 2026] },
  ],
  "BMW|M240": [
    { gen: "F22", years: [2017, 2021] },
    { gen: "G42", years: [2022, 2026] },
  ],
  "BMW|320": [
    { gen: "E90", years: [2006, 2011] },
    { gen: "F30", years: [2012, 2018] },
    { gen: "G20", years: [2019, 2026] },
  ],
  "BMW|328": [
    { gen: "E90", years: [2007, 2011] },
    { gen: "F30", years: [2012, 2016] },
  ],
  "BMW|330": [
    { gen: "E90", years: [2006, 2011] },
    { gen: "F30", years: [2012, 2018] },
    { gen: "G20", years: [2019, 2026] },
  ],
  "BMW|335": [
    { gen: "E90", years: [2007, 2011] },
    { gen: "F30", years: [2012, 2015] },
  ],
  "BMW|340": [
    { gen: "F30", years: [2016, 2018] },
    { gen: "G20", years: [2019, 2026] },
  ],
  "BMW|430": [
    { gen: "F32", years: [2014, 2020] },
    { gen: "G22", years: [2021, 2026] },
  ],
  "BMW|435": [
    { gen: "F32", years: [2014, 2016] },
  ],
  "BMW|440": [
    { gen: "F32", years: [2017, 2020] },
    { gen: "G22", years: [2021, 2026] },
  ],
  "BMW|528": [
    { gen: "F10", years: [2011, 2016] },
  ],
  "BMW|530": [
    { gen: "F10", years: [2011, 2016] },
    { gen: "G30", years: [2017, 2026] },
  ],
  "BMW|535": [
    { gen: "F10", years: [2011, 2016] },
  ],
  "BMW|540": [
    { gen: "G30", years: [2017, 2026] },
  ],
  "BMW|640": [
    { gen: "F06", years: [2013, 2018] },
    { gen: "G32", years: [2018, 2026] },
  ],
  "BMW|740": [
    { gen: "F01", years: [2009, 2015] },
    { gen: "G11", years: [2016, 2022] },
    { gen: "G70", years: [2023, 2026] },
  ],
  "BMW|750": [
    { gen: "F01", years: [2009, 2015] },
    { gen: "G11", years: [2016, 2022] },
    { gen: "G70", years: [2023, 2026] },
  ],
  "BMW|X1": [
    { gen: "E84", years: [2013, 2015] },
    { gen: "F48", years: [2016, 2022] },
    { gen: "U11", years: [2023, 2026] },
  ],
  "BMW|X2": [
    { gen: "F39", years: [2018, 2023] },
    { gen: "U10", years: [2024, 2026] },
  ],
  "BMW|X3": [
    { gen: "F25", years: [2011, 2017] },
    { gen: "G01", years: [2018, 2024] },
    { gen: "G45", years: [2025, 2026] },
  ],
  "BMW|X4": [
    { gen: "F26", years: [2015, 2018] },
    { gen: "G02", years: [2019, 2026] },
  ],
  "BMW|X5": [
    { gen: "E70", years: [2007, 2013] },
    { gen: "F15", years: [2014, 2018] },
    { gen: "G05", years: [2019, 2026] },
  ],
  "BMW|X6": [
    { gen: "E71", years: [2008, 2014] },
    { gen: "F16", years: [2015, 2019] },
    { gen: "G06", years: [2020, 2026] },
  ],
  "BMW|X7": [
    { gen: "G07", years: [2019, 2026] },
  ],
  "BMW|Z4": [
    { gen: "E89", years: [2009, 2016] },
    { gen: "G29", years: [2019, 2026] },
  ],
  "BMW|I3": [
    { gen: "I01", years: [2014, 2021] },
  ],
  "BMW|I4": [
    { gen: "G26", years: [2022, 2026] },
  ],
  "BMW|IX": [
    { gen: "I20", years: [2022, 2026] },
  ],

  // ══════════════════════════════════════════════════════════════
  // MERCEDES-BENZ
  // ══════════════════════════════════════════════════════════════
  "MERCEDES-BENZ|A": [
    { gen: "W177", years: [2019, 2026] },
  ],
  "MERCEDES-BENZ|C": [
    { gen: "W204", years: [2008, 2014] },
    { gen: "W205", years: [2015, 2021] },
    { gen: "W206", years: [2022, 2026] },
  ],
  "MERCEDES-BENZ|CLA": [
    { gen: "C117", years: [2014, 2019] },
    { gen: "C118", years: [2020, 2026] },
  ],
  "MERCEDES-BENZ|CLS": [
    { gen: "W218", years: [2012, 2018] },
    { gen: "C257", years: [2019, 2026] },
  ],
  "MERCEDES-BENZ|E": [
    { gen: "W212", years: [2010, 2016] },
    { gen: "W213", years: [2017, 2023] },
    { gen: "W214", years: [2024, 2026] },
  ],
  "MERCEDES-BENZ|G": [
    { gen: "W463", years: [2019, 2026] }, // only modern
  ],
  "MERCEDES-BENZ|GLA": [
    { gen: "X156", years: [2015, 2020] },
    { gen: "H247", years: [2021, 2026] },
  ],
  "MERCEDES-BENZ|GLB": [
    { gen: "X247", years: [2020, 2026] },
  ],
  "MERCEDES-BENZ|GLC": [
    { gen: "X253", years: [2016, 2022] },
    { gen: "X254", years: [2023, 2026] },
  ],
  "MERCEDES-BENZ|GLE": [
    { gen: "W166", years: [2016, 2019] },
    { gen: "W167", years: [2020, 2026] },
  ],
  "MERCEDES-BENZ|GLS": [
    { gen: "X166", years: [2017, 2019] },
    { gen: "X167", years: [2020, 2026] },
  ],
  "MERCEDES-BENZ|S": [
    { gen: "W221", years: [2006, 2013] },
    { gen: "W222", years: [2014, 2020] },
    { gen: "W223", years: [2021, 2026] },
  ],
  "MERCEDES-BENZ|SL": [
    { gen: "R231", years: [2013, 2020] },
    { gen: "R232", years: [2022, 2026] },
  ],
  "MERCEDES-BENZ|AMG GT": [
    { gen: "C190", years: [2015, 2021] },
    { gen: "C192", years: [2024, 2026] },
  ],
  "MERCEDES-BENZ|AMG": [
    { gen: "C190", years: [2015, 2021] },
    { gen: "C192", years: [2024, 2026] },
  ],

  // ══════════════════════════════════════════════════════════════
  // AUDI
  // ══════════════════════════════════════════════════════════════
  "AUDI|A3": [
    { gen: "8V", years: [2015, 2020] },
    { gen: "8Y", years: [2022, 2026] },
  ],
  "AUDI|A4": [
    { gen: "B8", years: [2009, 2016] },
    { gen: "B9", years: [2017, 2026] },
  ],
  "AUDI|A5": [
    { gen: "B8", years: [2008, 2016] },
    { gen: "B9", years: [2017, 2026] },
  ],
  "AUDI|A6": [
    { gen: "C7", years: [2012, 2018] },
    { gen: "C8", years: [2019, 2026] },
  ],
  "AUDI|A7": [
    { gen: "4G8", years: [2012, 2018] },
    { gen: "4K8", years: [2019, 2026] },
  ],
  "AUDI|A8": [
    { gen: "D4", years: [2011, 2017] },
    { gen: "D5", years: [2018, 2026] },
  ],
  "AUDI|Q3": [
    { gen: "8U", years: [2015, 2018] },
    { gen: "F3", years: [2019, 2026] },
  ],
  "AUDI|Q5": [
    { gen: "8R", years: [2009, 2017] },
    { gen: "FY", years: [2018, 2026] },
  ],
  "AUDI|Q7": [
    { gen: "4L", years: [2007, 2015] },
    { gen: "4M", years: [2016, 2026] },
  ],
  "AUDI|Q8": [
    { gen: "4M", years: [2019, 2026] },
  ],
  "AUDI|R8": [
    { gen: "Typ42", years: [2008, 2015] },
    { gen: "Typ4S", years: [2016, 2024] },
  ],
  "AUDI|RS3": [
    { gen: "8V", years: [2017, 2020] },
    { gen: "8Y", years: [2022, 2026] },
  ],
  "AUDI|RS5": [
    { gen: "B8", years: [2013, 2015] },
    { gen: "B9", years: [2018, 2026] },
  ],
  "AUDI|S3": [
    { gen: "8V", years: [2015, 2020] },
    { gen: "8Y", years: [2022, 2026] },
  ],
  "AUDI|S4": [
    { gen: "B8", years: [2010, 2016] },
    { gen: "B9", years: [2018, 2026] },
  ],
  "AUDI|S5": [
    { gen: "B8", years: [2008, 2016] },
    { gen: "B9", years: [2018, 2026] },
  ],
  "AUDI|TT": [
    { gen: "8J", years: [2007, 2014] },
    { gen: "8S", years: [2015, 2024] },
  ],

  // ══════════════════════════════════════════════════════════════
  // VOLKSWAGEN
  // ══════════════════════════════════════════════════════════════
  "VOLKSWAGEN|GTI": [
    { gen: "Mk6", years: [2010, 2014] },
    { gen: "Mk7", years: [2015, 2021] },
    { gen: "Mk8", years: [2022, 2026] },
  ],
  "VOLKSWAGEN|GOLF": [
    { gen: "Mk6", years: [2010, 2014] },
    { gen: "Mk7", years: [2015, 2021] },
    { gen: "Mk8", years: [2022, 2026] },
  ],
  "VOLKSWAGEN|GOLF R": [
    { gen: "Mk7", years: [2015, 2021] },
    { gen: "Mk8", years: [2022, 2026] },
  ],
  "VOLKSWAGEN|JETTA": [
    { gen: "Mk6", years: [2011, 2018] },
    { gen: "Mk7", years: [2019, 2026] },
  ],
  "VOLKSWAGEN|PASSAT": [
    { gen: "NMS", years: [2012, 2019] },
    { gen: "NMS2", years: [2020, 2022] },
  ],
  "VOLKSWAGEN|TIGUAN": [
    { gen: "5N", years: [2009, 2017] },
    { gen: "AD1", years: [2018, 2026] },
  ],
  "VOLKSWAGEN|ATLAS": [
    { gen: "CA1", years: [2018, 2026] },
  ],
  "VOLKSWAGEN|BEETLE": [
    { gen: "A5", years: [2012, 2019] },
  ],
  "VOLKSWAGEN|CC": [
    { gen: "3CC", years: [2009, 2017] },
  ],

  // ══════════════════════════════════════════════════════════════
  // SUBARU
  // ══════════════════════════════════════════════════════════════
  "SUBARU|WRX": [
    { gen: "VA", years: [2015, 2021] },
    { gen: "VB", years: [2022, 2026] },
  ],
  "SUBARU|BRZ": [
    { gen: "ZC6", years: [2013, 2020] },
    { gen: "ZD8", years: [2022, 2026] },
  ],
  "SUBARU|OUTBACK": [
    { gen: "BS", years: [2015, 2019] },
    { gen: "BT", years: [2020, 2026] },
  ],
  "SUBARU|FORESTER": [
    { gen: "SJ", years: [2014, 2018] },
    { gen: "SK", years: [2019, 2026] },
  ],
  "SUBARU|CROSSTREK": [
    { gen: "GT", years: [2018, 2023] },
    { gen: "GU", years: [2024, 2026] },
  ],
  "SUBARU|IMPREZA": [
    { gen: "GJ", years: [2012, 2016] },
    { gen: "GT", years: [2017, 2023] },
    { gen: "GU", years: [2024, 2026] },
  ],
  "SUBARU|LEGACY": [
    { gen: "BN", years: [2015, 2019] },
    { gen: "BW", years: [2020, 2026] },
  ],
  "SUBARU|ASCENT": [
    { gen: "1st", years: [2019, 2026] },
  ],

  // ══════════════════════════════════════════════════════════════
  // MAZDA
  // ══════════════════════════════════════════════════════════════
  "MAZDA|MX-5": [
    { gen: "NA", years: [1989, 1997] },
    { gen: "NB", years: [1998, 2005] },
    { gen: "NC", years: [2006, 2015] },
    { gen: "ND", years: [2016, 2026] },
  ],
  "MAZDA|MIATA": [
    { gen: "NA", years: [1989, 1997] },
    { gen: "NB", years: [1998, 2005] },
    { gen: "NC", years: [2006, 2015] },
    { gen: "ND", years: [2016, 2026] },
  ],
  "MAZDA|3": [
    { gen: "BK", years: [2004, 2009] },
    { gen: "BL", years: [2010, 2013] },
    { gen: "BM", years: [2014, 2018] },
    { gen: "BP", years: [2019, 2026] },
  ],
  "MAZDA|MAZDA3": [
    { gen: "BK", years: [2004, 2009] },
    { gen: "BL", years: [2010, 2013] },
    { gen: "BM", years: [2014, 2018] },
    { gen: "BP", years: [2019, 2026] },
  ],
  "MAZDA|6": [
    { gen: "GG", years: [2003, 2008] },
    { gen: "GH", years: [2009, 2013] },
    { gen: "GJ", years: [2014, 2021] },
  ],
  "MAZDA|CX-3": [
    { gen: "DK", years: [2016, 2021] },
  ],
  "MAZDA|CX-5": [
    { gen: "KE", years: [2013, 2016] },
    { gen: "KF", years: [2017, 2026] },
  ],
  "MAZDA|CX-30": [
    { gen: "DM", years: [2020, 2026] },
  ],
  "MAZDA|CX-50": [
    { gen: "1st", years: [2023, 2026] },
  ],
  "MAZDA|CX-9": [
    { gen: "TC", years: [2016, 2023] },
  ],
  "MAZDA|CX-90": [
    { gen: "1st", years: [2024, 2026] },
  ],

  // ══════════════════════════════════════════════════════════════
  // LEXUS
  // ══════════════════════════════════════════════════════════════
  "LEXUS|IS": [
    { gen: "XE20", years: [2006, 2013] },
    { gen: "XE30", years: [2014, 2026] },
  ],
  "LEXUS|ES": [
    { gen: "XV40", years: [2007, 2012] },
    { gen: "XV60", years: [2013, 2018] },
    { gen: "XV70", years: [2019, 2026] },
  ],
  "LEXUS|GS": [
    { gen: "S190", years: [2006, 2012] },
    { gen: "L10", years: [2013, 2020] },
  ],
  "LEXUS|LS": [
    { gen: "XF40", years: [2007, 2017] },
    { gen: "XF50", years: [2018, 2026] },
  ],
  "LEXUS|RC": [
    { gen: "XC10", years: [2015, 2026] },
  ],
  "LEXUS|RC F": [
    { gen: "XC10", years: [2015, 2026] },
  ],
  "LEXUS|LC": [
    { gen: "URZ100", years: [2018, 2026] },
  ],
  "LEXUS|RX": [
    { gen: "AL10", years: [2010, 2015] },
    { gen: "AL20", years: [2016, 2022] },
    { gen: "AL30", years: [2023, 2026] },
  ],
  "LEXUS|NX": [
    { gen: "AZ10", years: [2015, 2021] },
    { gen: "AZ20", years: [2022, 2026] },
  ],
  "LEXUS|GX": [
    { gen: "J150", years: [2010, 2023] },
    { gen: "J160", years: [2024, 2026] },
  ],
  "LEXUS|LX": [
    { gen: "J200", years: [2008, 2021] },
    { gen: "J300", years: [2022, 2026] },
  ],
  "LEXUS|UX": [
    { gen: "MA10", years: [2019, 2026] },
  ],

  // ══════════════════════════════════════════════════════════════
  // ACURA
  // ══════════════════════════════════════════════════════════════
  "ACURA|TLX": [
    { gen: "1st", years: [2015, 2020] },
    { gen: "2nd", years: [2021, 2026] },
  ],
  "ACURA|ILX": [
    { gen: "1st", years: [2013, 2022] },
  ],
  "ACURA|INTEGRA": [
    { gen: "New", years: [2023, 2026] },
  ],
  "ACURA|MDX": [
    { gen: "3rd", years: [2014, 2020] },
    { gen: "4th", years: [2022, 2026] },
  ],
  "ACURA|RDX": [
    { gen: "2nd", years: [2013, 2018] },
    { gen: "3rd", years: [2019, 2026] },
  ],

  // ══════════════════════════════════════════════════════════════
  // PORSCHE
  // ══════════════════════════════════════════════════════════════
  "PORSCHE|911": [
    { gen: "997", years: [2005, 2012] },
    { gen: "991", years: [2012, 2019] },
    { gen: "992", years: [2020, 2026] },
  ],
  "PORSCHE|CAYMAN": [
    { gen: "987", years: [2006, 2012] },
    { gen: "981", years: [2013, 2016] },
    { gen: "718", years: [2017, 2026] },
  ],
  "PORSCHE|718": [
    { gen: "718", years: [2017, 2026] },
  ],
  "PORSCHE|BOXSTER": [
    { gen: "987", years: [2005, 2012] },
    { gen: "981", years: [2013, 2016] },
    { gen: "718", years: [2017, 2026] },
  ],
  "PORSCHE|MACAN": [
    { gen: "95B", years: [2015, 2024] },
    { gen: "EV", years: [2025, 2026] },
  ],
  "PORSCHE|CAYENNE": [
    { gen: "E2", years: [2011, 2018] },
    { gen: "E3", years: [2019, 2026] },
  ],
  "PORSCHE|PANAMERA": [
    { gen: "970", years: [2010, 2016] },
    { gen: "971", years: [2017, 2026] },
  ],
  "PORSCHE|TAYCAN": [
    { gen: "Y1A", years: [2020, 2026] },
  ],

  // ══════════════════════════════════════════════════════════════
  // JEEP
  // ══════════════════════════════════════════════════════════════
  "JEEP|WRANGLER": [
    { gen: "JK", years: [2007, 2018] },
    { gen: "JL", years: [2018, 2026] },
  ],
  "JEEP|GRAND CHEROKEE": [
    { gen: "WK2", years: [2011, 2021] },
    { gen: "WL", years: [2022, 2026] },
  ],
  "JEEP|CHEROKEE": [
    { gen: "KL", years: [2014, 2023] },
  ],
  "JEEP|COMPASS": [
    { gen: "MP", years: [2017, 2026] },
  ],
  "JEEP|RENEGADE": [
    { gen: "BU", years: [2015, 2026] },
  ],
  "JEEP|GLADIATOR": [
    { gen: "JT", years: [2020, 2026] },
  ],
  "JEEP|WAGONEER": [
    { gen: "WS", years: [2022, 2026] },
  ],
  "JEEP|GRAND WAGONEER": [
    { gen: "WS", years: [2022, 2026] },
  ],

  // ══════════════════════════════════════════════════════════════
  // TESLA
  // ══════════════════════════════════════════════════════════════
  "TESLA|MODEL 3": [
    { gen: "1st", years: [2017, 2023] },
    { gen: "Highland", years: [2024, 2026] },
  ],
  "TESLA|MODEL Y": [
    { gen: "1st", years: [2020, 2024] },
    { gen: "Juniper", years: [2025, 2026] },
  ],
  "TESLA|MODEL S": [
    { gen: "1st", years: [2012, 2020] },
    { gen: "Refresh", years: [2021, 2026] },
  ],
  "TESLA|MODEL X": [
    { gen: "1st", years: [2016, 2020] },
    { gen: "Refresh", years: [2021, 2026] },
  ],
  "TESLA|CYBERTRUCK": [
    { gen: "1st", years: [2024, 2026] },
  ],

  // ══════════════════════════════════════════════════════════════
  // INFINITI
  // ══════════════════════════════════════════════════════════════
  "INFINITI|G35": [
    { gen: "V35", years: [2003, 2007] },
    { gen: "V36", years: [2007, 2008] },
  ],
  "INFINITI|G37": [
    { gen: "V36", years: [2008, 2013] },
  ],
  "INFINITI|Q50": [
    { gen: "V37", years: [2014, 2026] },
  ],
  "INFINITI|Q60": [
    { gen: "CV37", years: [2017, 2022] },
  ],
  "INFINITI|QX50": [
    { gen: "J50", years: [2014, 2018] },
    { gen: "QX50", years: [2019, 2026] },
  ],
  "INFINITI|QX60": [
    { gen: "L50", years: [2014, 2020] },
    { gen: "L51", years: [2022, 2026] },
  ],
  "INFINITI|QX80": [
    { gen: "Z62", years: [2011, 2026] },
  ],

  // ══════════════════════════════════════════════════════════════
  // VOLVO
  // ══════════════════════════════════════════════════════════════
  "VOLVO|S60": [
    { gen: "2nd", years: [2011, 2018] },
    { gen: "3rd", years: [2019, 2026] },
  ],
  "VOLVO|S90": [
    { gen: "2nd", years: [2017, 2026] },
  ],
  "VOLVO|XC40": [
    { gen: "1st", years: [2019, 2026] },
  ],
  "VOLVO|XC60": [
    { gen: "1st", years: [2010, 2017] },
    { gen: "2nd", years: [2018, 2026] },
  ],
  "VOLVO|XC90": [
    { gen: "1st", years: [2003, 2014] },
    { gen: "2nd", years: [2016, 2026] },
  ],
  "VOLVO|V60": [
    { gen: "1st", years: [2015, 2018] },
    { gen: "2nd", years: [2019, 2026] },
  ],

  // ══════════════════════════════════════════════════════════════
  // LAND ROVER / JAGUAR
  // ══════════════════════════════════════════════════════════════
  "LAND ROVER|RANGE ROVER": [
    { gen: "L405", years: [2013, 2021] },
    { gen: "L460", years: [2022, 2026] },
  ],
  "LAND ROVER|RANGE ROVER SPORT": [
    { gen: "L494", years: [2014, 2022] },
    { gen: "L461", years: [2023, 2026] },
  ],
  "LAND ROVER|RANGE ROVER EVOQUE": [
    { gen: "L538", years: [2012, 2019] },
    { gen: "L551", years: [2020, 2026] },
  ],
  "LAND ROVER|DISCOVERY": [
    { gen: "L462", years: [2017, 2026] },
  ],
  "LAND ROVER|DISCOVERY SPORT": [
    { gen: "L550", years: [2015, 2026] },
  ],
  "LAND ROVER|DEFENDER": [
    { gen: "L663", years: [2020, 2026] },
  ],
  "JAGUAR|F-TYPE": [
    { gen: "X152", years: [2014, 2026] },
  ],
  "JAGUAR|F-PACE": [
    { gen: "X761", years: [2017, 2026] },
  ],
  "JAGUAR|E-PACE": [
    { gen: "X540", years: [2018, 2026] },
  ],
  "JAGUAR|XE": [
    { gen: "X760", years: [2017, 2020] },
  ],
  "JAGUAR|XF": [
    { gen: "X250", years: [2009, 2015] },
    { gen: "X260", years: [2016, 2026] },
  ],

  // ══════════════════════════════════════════════════════════════
  // CADILLAC
  // ══════════════════════════════════════════════════════════════
  "CADILLAC|ESCALADE": [
    { gen: "GMT900", years: [2007, 2014] },
    { gen: "K2XX", years: [2015, 2020] },
    { gen: "T1XX", years: [2021, 2026] },
  ],
  "CADILLAC|CTS": [
    { gen: "2nd", years: [2008, 2013] },
    { gen: "3rd", years: [2014, 2019] },
  ],
  "CADILLAC|ATS": [
    { gen: "1st", years: [2013, 2019] },
  ],
  "CADILLAC|CT4": [
    { gen: "1st", years: [2020, 2026] },
  ],
  "CADILLAC|CT5": [
    { gen: "1st", years: [2020, 2026] },
  ],
  "CADILLAC|XT4": [
    { gen: "1st", years: [2019, 2026] },
  ],
  "CADILLAC|XT5": [
    { gen: "1st", years: [2017, 2026] },
  ],
  "CADILLAC|XT6": [
    { gen: "1st", years: [2020, 2026] },
  ],

  // ══════════════════════════════════════════════════════════════
  // LINCOLN
  // ══════════════════════════════════════════════════════════════
  "LINCOLN|NAVIGATOR": [
    { gen: "3rd", years: [2007, 2017] },
    { gen: "4th", years: [2018, 2026] },
  ],
  "LINCOLN|AVIATOR": [
    { gen: "2nd", years: [2020, 2026] },
  ],
  "LINCOLN|CORSAIR": [
    { gen: "1st", years: [2020, 2026] },
  ],
  "LINCOLN|NAUTILUS": [
    { gen: "1st", years: [2019, 2026] },
  ],

  // ══════════════════════════════════════════════════════════════
  // GMC
  // ══════════════════════════════════════════════════════════════
  "GMC|SIERRA": [
    { gen: "K2XX", years: [2014, 2018] },
    { gen: "T1XX", years: [2019, 2026] },
  ],
  "GMC|YUKON": [
    { gen: "GMT900", years: [2007, 2014] },
    { gen: "K2XX", years: [2015, 2020] },
    { gen: "T1XX", years: [2021, 2026] },
  ],
  "GMC|ACADIA": [
    { gen: "1st", years: [2007, 2016] },
    { gen: "2nd", years: [2017, 2026] },
  ],
  "GMC|TERRAIN": [
    { gen: "1st", years: [2010, 2017] },
    { gen: "2nd", years: [2018, 2026] },
  ],
  "GMC|CANYON": [
    { gen: "2nd", years: [2015, 2022] },
    { gen: "3rd", years: [2023, 2026] },
  ],

  // ══════════════════════════════════════════════════════════════
  // MITSUBISHI / MINI / FIAT
  // ══════════════════════════════════════════════════════════════
  "MITSUBISHI|OUTLANDER": [
    { gen: "3rd", years: [2014, 2021] },
    { gen: "4th", years: [2022, 2026] },
  ],
  "MITSUBISHI|ECLIPSE CROSS": [
    { gen: "1st", years: [2018, 2026] },
  ],
  "MITSUBISHI|LANCER": [
    { gen: "8th", years: [2008, 2017] },
  ],
  "MINI|COOPER": [
    { gen: "R56", years: [2007, 2013] },
    { gen: "F56", years: [2014, 2023] },
    { gen: "J01", years: [2024, 2026] },
  ],

  // ══════════════════════════════════════════════════════════════
  // EXOTICS — fewer comps but high value, generation matters a lot
  // ══════════════════════════════════════════════════════════════
  "LAMBORGHINI|HURACAN": [
    { gen: "LP610", years: [2015, 2019] },
    { gen: "EVO", years: [2020, 2024] },
  ],
  "LAMBORGHINI|URUS": [
    { gen: "1st", years: [2019, 2026] },
  ],
  "FERRARI|488": [
    { gen: "488", years: [2016, 2019] },
  ],
  "FERRARI|458": [
    { gen: "458", years: [2010, 2015] },
  ],
  "MASERATI|GHIBLI": [
    { gen: "M157", years: [2014, 2026] },
  ],
  "MASERATI|LEVANTE": [
    { gen: "M161", years: [2017, 2026] },
  ],
  "MASERATI|GRANTURISMO": [
    { gen: "M138", years: [2008, 2019] },
    { gen: "M165", years: [2024, 2026] },
  ],
};

/**
 * Get the comp year range for a vehicle based on its generation.
 * Returns [minYear, maxYear] for comps filtering.
 *
 * If the vehicle is in the generation table, returns that generation's exact year range.
 * If not, falls back to ±3 years from the target year.
 */
export function getCompYearRange(make: string, model: string, year: number): [number, number] {
  const makeUp = make.toUpperCase();
  const modelUp = model.toUpperCase();
  const baseModel = modelUp.split(/\s+/)[0];

  // Try exact make|fullModel
  let gens = GENERATIONS[`${makeUp}|${modelUp}`];

  // Try make|firstTwoWords
  if (!gens) {
    const twoWords = modelUp.split(/\s+/).slice(0, 2).join(" ");
    gens = GENERATIONS[`${makeUp}|${twoWords}`];
  }

  // Try make|baseModel
  if (!gens) {
    gens = GENERATIONS[`${makeUp}|${baseModel}`];
  }

  // Try partial match
  if (!gens) {
    for (const [key, val] of Object.entries(GENERATIONS)) {
      const [keyMake, keyModel] = key.split("|");
      if (keyMake === makeUp && modelUp.startsWith(keyModel)) {
        gens = val;
        break;
      }
    }
  }

  if (!gens) {
    // No generation data — fall back to ±3 years
    return [year - 3, year + 3];
  }

  // Find which generation this year belongs to
  for (const g of gens) {
    if (year >= g.years[0] && year <= g.years[1]) {
      // Use generation boundaries but cap to ±2 years from actual vehicle year
      // This prevents a 2025 IS from pulling 2014 comps even though same gen
      const genMin = g.years[0];
      const genMax = g.years[1];
      const cappedMin = Math.max(genMin, year - 2);
      const cappedMax = Math.min(genMax, year + 2);
      return [cappedMin, cappedMax];
    }
  }

  // Year doesn't match any known generation — fall back to ±3
  return [year - 3, year + 3];
}

/**
 * Get the generation name for display purposes.
 */
export function getGenerationName(make: string, model: string, year: number): string | null {
  const makeUp = make.toUpperCase();
  const modelUp = model.toUpperCase();
  const baseModel = modelUp.split(/\s+/)[0];

  let gens = GENERATIONS[`${makeUp}|${modelUp}`]
    || GENERATIONS[`${makeUp}|${modelUp.split(/\s+/).slice(0, 2).join(" ")}`]
    || GENERATIONS[`${makeUp}|${baseModel}`];

  if (!gens) return null;

  for (const g of gens) {
    if (year >= g.years[0] && year <= g.years[1]) {
      return g.gen;
    }
  }

  return null;
}
