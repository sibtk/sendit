import { ShippingEstimate } from "./types";

/**
 * Calculate distance between two points using Haversine formula.
 * Returns distance in miles.
 */
function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Estimate shipping cost based on distance.
 * Rate brackets based on real carrier data:
 *   <200mi:    $250-400 (open) / $400-600 (enclosed)
 *   200-500mi: $400-700 (open) / $600-1000 (enclosed)
 *   500-1000mi: $700-1000 (open) / $1000-1500 (enclosed)
 *   1000+mi:   $1000-1500 (open) / $1500-2200 (enclosed)
 */
function estimateCost(distanceMiles: number): {
  open: { low: number; high: number };
  enclosed: { low: number; high: number };
  days: { low: number; high: number };
} {
  if (distanceMiles < 200) {
    return {
      open: { low: 250, high: 400 },
      enclosed: { low: 400, high: 600 },
      days: { low: 1, high: 3 },
    };
  }
  if (distanceMiles < 500) {
    return {
      open: { low: 400, high: 700 },
      enclosed: { low: 600, high: 1000 },
      days: { low: 2, high: 5 },
    };
  }
  if (distanceMiles < 1000) {
    return {
      open: { low: 700, high: 1000 },
      enclosed: { low: 1000, high: 1500 },
      days: { low: 4, high: 7 },
    };
  }
  // 1000+ miles
  return {
    open: { low: 1000, high: 1500 },
    enclosed: { low: 1500, high: 2200 },
    days: { low: 5, high: 10 },
  };
}

// Common US zip code to approximate lat/lng lookup
// This is a simplified version — in production you'd use a proper geocoding API
const ZIP_COORDS: Record<string, { lat: number; lng: number; city: string }> = {
  "77001": { lat: 29.7604, lng: -95.3698, city: "Houston, TX" },
  "77002": { lat: 29.7544, lng: -95.3625, city: "Houston, TX" },
  "77049": { lat: 29.8515, lng: -95.1594, city: "Houston, TX" },
  "75001": { lat: 32.9537, lng: -96.8389, city: "Dallas, TX" },
  "75201": { lat: 32.7872, lng: -96.7985, city: "Dallas, TX" },
  "73301": { lat: 30.2672, lng: -97.7431, city: "Austin, TX" },
  "78201": { lat: 29.4685, lng: -98.5254, city: "San Antonio, TX" },
  "10001": { lat: 40.7484, lng: -73.9967, city: "New York, NY" },
  "90001": { lat: 33.9425, lng: -118.2551, city: "Los Angeles, CA" },
  "60601": { lat: 41.8819, lng: -87.6278, city: "Chicago, IL" },
  "33101": { lat: 25.7617, lng: -80.1918, city: "Miami, FL" },
  "85001": { lat: 33.4484, lng: -112.074, city: "Phoenix, AZ" },
  "02101": { lat: 42.3601, lng: -71.0589, city: "Boston, MA" },
};

// US state geographic centroids (approximate center of each state)
const STATE_COORDS: Record<string, { lat: number; lng: number; name: string }> = {
  AL: { lat: 32.806671, lng: -86.79113, name: "Alabama" },
  AK: { lat: 63.588753, lng: -154.493062, name: "Alaska" },
  AZ: { lat: 34.048928, lng: -111.093731, name: "Arizona" },
  AR: { lat: 34.969704, lng: -92.373123, name: "Arkansas" },
  CA: { lat: 36.778261, lng: -119.417932, name: "California" },
  CO: { lat: 39.550051, lng: -105.782067, name: "Colorado" },
  CT: { lat: 41.603221, lng: -73.087749, name: "Connecticut" },
  DE: { lat: 38.910832, lng: -75.52767, name: "Delaware" },
  DC: { lat: 38.9072, lng: -77.0369, name: "District of Columbia" },
  FL: { lat: 27.664827, lng: -81.515754, name: "Florida" },
  GA: { lat: 32.157435, lng: -82.907123, name: "Georgia" },
  HI: { lat: 19.898682, lng: -155.665857, name: "Hawaii" },
  ID: { lat: 44.068202, lng: -114.742041, name: "Idaho" },
  IL: { lat: 40.633125, lng: -89.398528, name: "Illinois" },
  IN: { lat: 40.551217, lng: -85.602364, name: "Indiana" },
  IA: { lat: 41.878003, lng: -93.097702, name: "Iowa" },
  KS: { lat: 39.011902, lng: -98.484246, name: "Kansas" },
  KY: { lat: 37.839333, lng: -84.270018, name: "Kentucky" },
  LA: { lat: 31.244823, lng: -92.145024, name: "Louisiana" },
  ME: { lat: 45.253783, lng: -69.445469, name: "Maine" },
  MD: { lat: 39.045755, lng: -76.641271, name: "Maryland" },
  MA: { lat: 42.407211, lng: -71.382437, name: "Massachusetts" },
  MI: { lat: 44.314844, lng: -85.602364, name: "Michigan" },
  MN: { lat: 46.729553, lng: -94.6859, name: "Minnesota" },
  MS: { lat: 32.354668, lng: -89.398528, name: "Mississippi" },
  MO: { lat: 37.964253, lng: -91.831833, name: "Missouri" },
  MT: { lat: 46.879682, lng: -110.362566, name: "Montana" },
  NE: { lat: 41.492537, lng: -99.901813, name: "Nebraska" },
  NV: { lat: 38.80261, lng: -116.419389, name: "Nevada" },
  NH: { lat: 43.193852, lng: -71.572395, name: "New Hampshire" },
  NJ: { lat: 40.058324, lng: -74.405661, name: "New Jersey" },
  NM: { lat: 34.97273, lng: -105.032363, name: "New Mexico" },
  NY: { lat: 43.299428, lng: -74.217933, name: "New York" },
  NC: { lat: 35.759573, lng: -79.0193, name: "North Carolina" },
  ND: { lat: 47.551493, lng: -101.002012, name: "North Dakota" },
  OH: { lat: 40.417287, lng: -82.907123, name: "Ohio" },
  OK: { lat: 35.007752, lng: -97.092877, name: "Oklahoma" },
  OR: { lat: 43.804133, lng: -120.554201, name: "Oregon" },
  PA: { lat: 41.203322, lng: -77.194525, name: "Pennsylvania" },
  PR: { lat: 18.220833, lng: -66.590149, name: "Puerto Rico" },
  RI: { lat: 41.580095, lng: -71.477429, name: "Rhode Island" },
  SC: { lat: 33.836081, lng: -81.163725, name: "South Carolina" },
  SD: { lat: 43.969515, lng: -99.901813, name: "South Dakota" },
  TN: { lat: 35.517491, lng: -86.580447, name: "Tennessee" },
  TX: { lat: 31.968599, lng: -99.901813, name: "Texas" },
  UT: { lat: 39.32098, lng: -111.093731, name: "Utah" },
  VT: { lat: 44.558803, lng: -72.577841, name: "Vermont" },
  VA: { lat: 37.431573, lng: -78.656894, name: "Virginia" },
  WA: { lat: 47.751074, lng: -120.740139, name: "Washington" },
  WV: { lat: 38.597626, lng: -80.454903, name: "West Virginia" },
  WI: { lat: 43.78444, lng: -88.787868, name: "Wisconsin" },
  WY: { lat: 43.075968, lng: -107.290284, name: "Wyoming" },
};

// 3-digit zip code prefix (SCF) to US state mapping
// Covers all major prefix ranges so any US zip resolves to a state
const ZIP_PREFIX_TO_STATE: Record<string, string> = {
  // 0xx — Northeast
  "005": "NY", "006": "PR", "007": "PR", "008": "PR", "009": "PR",
  "010": "MA", "011": "MA", "012": "MA", "013": "MA", "014": "MA",
  "015": "MA", "016": "MA", "017": "MA", "018": "MA", "019": "MA",
  "020": "MA", "021": "MA", "022": "MA", "023": "MA", "024": "MA",
  "025": "MA", "026": "MA", "027": "MA",
  "028": "RI", "029": "RI",
  "030": "NH", "031": "NH", "032": "NH", "033": "NH", "034": "NH",
  "035": "NH", "036": "NH", "037": "NH", "038": "NH",
  "039": "ME", "040": "ME", "041": "ME", "042": "ME", "043": "ME",
  "044": "ME", "045": "ME", "046": "ME", "047": "ME", "048": "ME",
  "049": "ME",
  "050": "VT", "051": "VT", "052": "VT", "053": "VT", "054": "VT",
  "055": "VT", "056": "VT", "057": "VT", "058": "VT", "059": "VT",
  "060": "CT", "061": "CT", "062": "CT", "063": "CT", "064": "CT",
  "065": "CT", "066": "CT", "067": "CT", "068": "CT", "069": "CT",
  "070": "NJ", "071": "NJ", "072": "NJ", "073": "NJ", "074": "NJ",
  "075": "NJ", "076": "NJ", "077": "NJ", "078": "NJ", "079": "NJ",
  "080": "NJ", "081": "NJ", "082": "NJ", "083": "NJ", "084": "NJ",
  "085": "NJ", "086": "NJ", "087": "NJ", "088": "NJ", "089": "NJ",

  // 1xx — NY, PA, DE
  "100": "NY", "101": "NY", "102": "NY", "103": "NY", "104": "NY",
  "105": "NY", "106": "NY", "107": "NY", "108": "NY", "109": "NY",
  "110": "NY", "111": "NY", "112": "NY", "113": "NY", "114": "NY",
  "115": "NY", "116": "NY", "117": "NY", "118": "NY", "119": "NY",
  "120": "NY", "121": "NY", "122": "NY", "123": "NY", "124": "NY",
  "125": "NY", "126": "NY", "127": "NY", "128": "NY", "129": "NY",
  "130": "NY", "131": "NY", "132": "NY", "133": "NY", "134": "NY",
  "135": "NY", "136": "NY", "137": "NY", "138": "NY", "139": "NY",
  "140": "NY", "141": "NY", "142": "NY", "143": "NY", "144": "NY",
  "145": "NY", "146": "NY", "147": "NY", "148": "NY", "149": "NY",
  "150": "PA", "151": "PA", "152": "PA", "153": "PA", "154": "PA",
  "155": "PA", "156": "PA", "157": "PA", "158": "PA", "159": "PA",
  "160": "PA", "161": "PA", "162": "PA", "163": "PA", "164": "PA",
  "165": "PA", "166": "PA", "167": "PA", "168": "PA", "169": "PA",
  "170": "PA", "171": "PA", "172": "PA", "173": "PA", "174": "PA",
  "175": "PA", "176": "PA", "177": "PA", "178": "PA", "179": "PA",
  "180": "PA", "181": "PA", "182": "PA", "183": "PA", "184": "PA",
  "185": "PA", "186": "PA", "187": "PA", "188": "PA", "189": "PA",
  "190": "PA", "191": "PA", "192": "PA", "193": "PA", "194": "PA",
  "195": "PA", "196": "PA",
  "197": "DE", "198": "DE", "199": "DE",

  // 2xx — DC, MD, VA, WV, NC, SC
  "200": "DC", "201": "VA", "202": "DC", "203": "DC", "204": "DC", "205": "DC",
  "206": "MD", "207": "MD", "208": "MD", "209": "MD",
  "210": "MD", "211": "MD", "212": "MD", "213": "MD", "214": "MD",
  "215": "MD", "216": "MD", "217": "MD", "218": "MD", "219": "MD",
  "220": "VA", "221": "VA", "222": "VA", "223": "VA", "224": "VA",
  "225": "VA", "226": "VA", "227": "VA", "228": "VA", "229": "VA",
  "230": "VA", "231": "VA", "232": "VA", "233": "VA", "234": "VA",
  "235": "VA", "236": "VA", "237": "VA", "238": "VA", "239": "VA",
  "240": "VA", "241": "VA", "242": "VA", "243": "VA", "244": "VA",
  "245": "WV", "246": "WV", "247": "WV", "248": "WV", "249": "WV",
  "250": "WV", "251": "WV", "252": "WV", "253": "WV", "254": "WV",
  "255": "WV", "256": "WV", "257": "WV", "258": "WV", "259": "WV",
  "260": "WV", "261": "WV", "262": "WV", "263": "WV", "264": "WV",
  "265": "WV", "266": "WV", "267": "WV", "268": "WV",
  "270": "NC", "271": "NC", "272": "NC", "273": "NC", "274": "NC",
  "275": "NC", "276": "NC", "277": "NC", "278": "NC", "279": "NC",
  "280": "NC", "281": "NC", "282": "NC", "283": "NC", "284": "NC",
  "285": "NC", "286": "NC", "287": "NC", "288": "NC", "289": "NC",
  "290": "SC", "291": "SC", "292": "SC", "293": "SC", "294": "SC",
  "295": "SC", "296": "SC", "297": "SC", "298": "SC", "299": "SC",

  // 3xx — GA, FL, AL, TN, MS
  "300": "GA", "301": "GA", "302": "GA", "303": "GA", "304": "GA",
  "305": "GA", "306": "GA", "307": "GA", "308": "GA", "309": "GA",
  "310": "GA", "311": "GA", "312": "GA", "313": "GA", "314": "GA",
  "315": "GA", "316": "GA", "317": "GA", "318": "GA", "319": "GA",
  "320": "FL", "321": "FL", "322": "FL", "323": "FL", "324": "FL",
  "325": "FL", "326": "FL", "327": "FL", "328": "FL", "329": "FL",
  "330": "FL", "331": "FL", "332": "FL", "333": "FL", "334": "FL",
  "335": "FL", "336": "FL", "337": "FL", "338": "FL", "339": "FL",
  "340": "FL", "341": "FL", "342": "FL",
  "344": "FL", "346": "FL", "347": "FL", "349": "FL",
  "350": "AL", "351": "AL", "352": "AL", "353": "AL", "354": "AL",
  "355": "AL", "356": "AL", "357": "AL", "358": "AL", "359": "AL",
  "360": "AL", "361": "AL", "362": "AL", "363": "AL", "364": "AL",
  "365": "AL", "366": "AL", "367": "AL", "368": "AL", "369": "AL",
  "370": "TN", "371": "TN", "372": "TN", "373": "TN", "374": "TN",
  "375": "TN", "376": "TN", "377": "TN", "378": "TN", "379": "TN",
  "380": "TN", "381": "TN", "382": "TN", "383": "TN", "384": "TN",
  "385": "TN",
  "386": "MS", "387": "MS", "388": "MS", "389": "MS",
  "390": "MS", "391": "MS", "392": "MS", "393": "MS", "394": "MS",
  "395": "MS", "396": "MS", "397": "MS",

  // 4xx — KY, OH, IN, MI
  "400": "KY", "401": "KY", "402": "KY", "403": "KY", "404": "KY",
  "405": "KY", "406": "KY", "407": "KY", "408": "KY", "409": "KY",
  "410": "KY", "411": "KY", "412": "KY", "413": "KY", "414": "KY",
  "415": "KY", "416": "KY", "417": "KY", "418": "KY",
  "420": "KY", "421": "KY", "422": "KY", "423": "KY", "424": "KY",
  "425": "KY", "426": "KY", "427": "KY",
  "430": "OH", "431": "OH", "432": "OH", "433": "OH", "434": "OH",
  "435": "OH", "436": "OH", "437": "OH", "438": "OH", "439": "OH",
  "440": "OH", "441": "OH", "442": "OH", "443": "OH", "444": "OH",
  "445": "OH", "446": "OH", "447": "OH", "448": "OH", "449": "OH",
  "450": "OH", "451": "OH", "452": "OH", "453": "OH", "454": "OH",
  "455": "OH", "456": "OH", "457": "OH", "458": "OH",
  "460": "IN", "461": "IN", "462": "IN", "463": "IN", "464": "IN",
  "465": "IN", "466": "IN", "467": "IN", "468": "IN", "469": "IN",
  "470": "IN", "471": "IN", "472": "IN", "473": "IN", "474": "IN",
  "475": "IN", "476": "IN", "477": "IN", "478": "IN", "479": "IN",
  "480": "MI", "481": "MI", "482": "MI", "483": "MI", "484": "MI",
  "485": "MI", "486": "MI", "487": "MI", "488": "MI", "489": "MI",
  "490": "MI", "491": "MI", "492": "MI", "493": "MI", "494": "MI",
  "495": "MI", "496": "MI", "497": "MI", "498": "MI", "499": "MI",

  // 5xx — IA, MN, WI, SD, ND, MT, NE
  "500": "IA", "501": "IA", "502": "IA", "503": "IA", "504": "IA",
  "505": "IA", "506": "IA", "507": "IA", "508": "IA", "509": "IA",
  "510": "IA", "511": "IA", "512": "IA", "513": "IA", "514": "IA",
  "515": "IA", "516": "IA",
  "520": "IA", "521": "IA", "522": "IA", "523": "IA", "524": "IA",
  "525": "IA", "526": "IA", "527": "IA", "528": "IA",
  "530": "WI", "531": "WI", "532": "WI", "534": "WI", "535": "WI",
  "537": "WI", "538": "WI", "539": "WI",
  "540": "MN", "541": "MN",
  "543": "WI", "544": "WI", "545": "WI", "546": "WI", "547": "WI",
  "548": "WI", "549": "WI",
  "550": "MN", "551": "MN", "553": "MN", "554": "MN", "555": "MN",
  "556": "MN", "557": "MN", "558": "MN", "559": "MN",
  "560": "MN", "561": "MN", "562": "MN", "563": "MN", "564": "MN",
  "565": "MN", "566": "MN", "567": "MN",
  "570": "SD", "571": "SD", "572": "SD", "573": "SD", "574": "SD",
  "575": "SD", "576": "SD", "577": "SD",
  "580": "ND", "581": "ND", "582": "ND", "583": "ND", "584": "ND",
  "585": "ND", "586": "ND", "587": "ND", "588": "ND",
  "590": "MT", "591": "MT", "592": "MT", "593": "MT", "594": "MT",
  "595": "MT", "596": "MT", "597": "MT", "598": "MT", "599": "MT",

  // 6xx — IL, MO, KS, NE
  "600": "IL", "601": "IL", "602": "IL", "603": "IL", "604": "IL",
  "605": "IL", "606": "IL", "607": "IL", "608": "IL", "609": "IL",
  "610": "IL", "611": "IL", "612": "IL", "613": "IL", "614": "IL",
  "615": "IL", "616": "IL", "617": "IL", "618": "IL", "619": "IL",
  "620": "IL", "621": "IL", "622": "IL", "623": "IL", "624": "IL",
  "625": "IL", "626": "IL", "627": "IL", "628": "IL", "629": "IL",
  "630": "MO", "631": "MO", "633": "MO", "634": "MO", "635": "MO",
  "636": "MO", "637": "MO", "638": "MO", "639": "MO",
  "640": "MO", "641": "MO", "644": "MO", "645": "MO", "646": "MO",
  "647": "MO", "648": "MO", "649": "MO",
  "650": "MO", "651": "MO", "652": "MO", "653": "MO", "654": "MO",
  "655": "MO", "656": "MO", "657": "MO", "658": "MO", "659": "MO",
  "660": "KS", "661": "KS", "662": "KS", "664": "KS", "665": "KS",
  "666": "KS", "667": "KS", "668": "KS", "669": "KS",
  "670": "KS", "671": "KS", "672": "KS", "673": "KS", "674": "KS",
  "675": "KS", "676": "KS", "677": "KS", "678": "KS", "679": "KS",
  "680": "NE", "681": "NE", "683": "NE", "684": "NE", "685": "NE",
  "686": "NE", "687": "NE", "688": "NE", "689": "NE",
  "690": "NE", "691": "NE", "692": "NE", "693": "NE",

  // 7xx — TX, OK, AR, LA
  "700": "LA", "701": "LA", "703": "LA", "704": "LA", "705": "LA",
  "706": "LA", "707": "LA", "708": "LA", "710": "LA", "711": "LA",
  "712": "LA", "713": "LA", "714": "LA",
  "716": "AR", "717": "AR", "718": "AR", "719": "AR",
  "720": "AR", "721": "AR", "722": "AR", "723": "AR", "724": "AR",
  "725": "AR", "726": "AR", "727": "AR", "728": "AR", "729": "AR",
  "730": "OK", "731": "OK", "733": "OK", "734": "OK", "735": "OK",
  "736": "OK", "737": "OK", "738": "OK", "739": "OK",
  "740": "OK", "741": "OK", "743": "OK", "744": "OK", "745": "OK",
  "746": "OK", "747": "OK", "748": "OK", "749": "OK",
  "750": "TX", "751": "TX", "752": "TX", "753": "TX", "754": "TX",
  "755": "TX", "756": "TX", "757": "TX", "758": "TX", "759": "TX",
  "760": "TX", "761": "TX", "762": "TX", "763": "TX", "764": "TX",
  "765": "TX", "766": "TX", "767": "TX", "768": "TX", "769": "TX",
  "770": "TX", "771": "TX", "772": "TX", "773": "TX", "774": "TX",
  "775": "TX", "776": "TX", "777": "TX", "778": "TX", "779": "TX",
  "780": "TX", "781": "TX", "782": "TX", "783": "TX", "784": "TX",
  "785": "TX", "786": "TX", "787": "TX", "788": "TX", "789": "TX",
  "790": "TX", "791": "TX", "792": "TX", "793": "TX", "794": "TX",
  "795": "TX", "796": "TX", "797": "TX", "798": "TX", "799": "TX",

  // 8xx — CO, WY, ID, UT, AZ, NM, NV
  "800": "CO", "801": "CO", "802": "CO", "803": "CO", "804": "CO",
  "805": "CO", "806": "CO", "807": "CO", "808": "CO", "809": "CO",
  "810": "CO", "811": "CO", "812": "CO", "813": "CO", "814": "CO",
  "815": "CO", "816": "CO",
  "820": "WY", "821": "WY", "822": "WY", "823": "WY", "824": "WY",
  "825": "WY", "826": "WY", "827": "WY", "828": "WY", "829": "WY",
  "830": "WY", "831": "WY",
  "832": "ID", "833": "ID", "834": "ID", "835": "ID", "836": "ID",
  "837": "ID", "838": "ID",
  "840": "UT", "841": "UT", "842": "UT", "843": "UT", "844": "UT",
  "845": "UT", "846": "UT", "847": "UT",
  "850": "AZ", "851": "AZ", "852": "AZ", "853": "AZ", "855": "AZ",
  "856": "AZ", "857": "AZ",
  "859": "AZ", "860": "AZ",
  "863": "AZ", "864": "AZ", "865": "AZ",
  "870": "NM", "871": "NM", "872": "NM", "873": "NM", "874": "NM",
  "875": "NM", "877": "NM", "878": "NM", "879": "NM",
  "880": "NM", "881": "NM", "882": "NM", "883": "NM", "884": "NM",
  "889": "NV", "890": "NV", "891": "NV",
  "893": "NV", "894": "NV", "895": "NV", "896": "NV", "897": "NV",
  "898": "NV",

  // 9xx — CA, OR, WA, AK, HI
  "900": "CA", "901": "CA", "902": "CA", "903": "CA", "904": "CA",
  "905": "CA", "906": "CA", "907": "CA", "908": "CA", "909": "CA",
  "910": "CA", "911": "CA", "912": "CA", "913": "CA", "914": "CA",
  "915": "CA", "916": "CA", "917": "CA", "918": "CA", "919": "CA",
  "920": "CA", "921": "CA", "922": "CA", "923": "CA", "924": "CA",
  "925": "CA", "926": "CA", "927": "CA", "928": "CA",
  "930": "CA", "931": "CA", "932": "CA", "933": "CA", "934": "CA",
  "935": "CA", "936": "CA", "937": "CA", "938": "CA", "939": "CA",
  "940": "CA", "941": "CA", "942": "CA", "943": "CA", "944": "CA",
  "945": "CA", "946": "CA", "947": "CA", "948": "CA", "949": "CA",
  "950": "CA", "951": "CA", "952": "CA", "953": "CA", "954": "CA",
  "955": "CA", "956": "CA", "957": "CA", "958": "CA", "959": "CA",
  "960": "CA", "961": "CA",
  "967": "HI", "968": "HI",
  "970": "OR", "971": "OR", "972": "OR", "973": "OR", "974": "OR",
  "975": "OR", "976": "OR", "977": "OR", "978": "OR", "979": "OR",
  "980": "WA", "981": "WA", "982": "WA", "983": "WA", "984": "WA",
  "985": "WA", "986": "WA", "988": "WA", "989": "WA",
  "990": "WA", "991": "WA", "992": "WA", "993": "WA", "994": "WA",
  "995": "AK", "996": "AK", "997": "AK", "998": "AK", "999": "AK",
};

/**
 * Look up coordinates for a US zip code.
 * Falls back through: exact match → prefix match in known zips → SCF prefix → state centroid.
 * Always returns coordinates (never null) so shipping estimation never crashes.
 */
function getZipCoords(zip: string): { lat: number; lng: number; city: string } {
  // 1. Try exact match
  if (ZIP_COORDS[zip]) return ZIP_COORDS[zip];

  // 2. Try prefix match against known zip coords (first 3 digits)
  const prefix = zip.slice(0, 3);
  const match = Object.entries(ZIP_COORDS).find(([k]) => k.startsWith(prefix));
  if (match) return match[1];

  // 3. Try SCF prefix → state centroid lookup
  const state = ZIP_PREFIX_TO_STATE[prefix];
  if (state && STATE_COORDS[state]) {
    return {
      lat: STATE_COORDS[state].lat,
      lng: STATE_COORDS[state].lng,
      city: `${STATE_COORDS[state].name} (approx)`,
    };
  }

  // 4. Last resort: infer from first digit range
  const firstDigit = zip.charAt(0);
  const fallbackState: Record<string, string> = {
    "0": "MA", "1": "NY", "2": "VA", "3": "FL",
    "4": "OH", "5": "MN", "6": "IL", "7": "TX",
    "8": "CO", "9": "CA",
  };
  const fb = fallbackState[firstDigit];
  if (fb && STATE_COORDS[fb]) {
    return {
      lat: STATE_COORDS[fb].lat,
      lng: STATE_COORDS[fb].lng,
      city: `${STATE_COORDS[fb].name} (approx)`,
    };
  }

  // 5. Absolute fallback — geographic center of the contiguous US (Lebanon, KS)
  return { lat: 39.8283, lng: -98.5795, city: "US (center)" };
}

export function estimateShipping(
  fromCoords: { lat: number; lng: number } | null,
  fromLabel: string,
  toZip: string,
  toLabel: string
): ShippingEstimate | null {
  const toCoords = getZipCoords(toZip);
  if (!fromCoords) {
    return null;
  }

  const distance = haversineDistance(
    fromCoords.lat,
    fromCoords.lng,
    toCoords.lat,
    toCoords.lng
  );

  const costs = estimateCost(distance);

  return {
    from: fromLabel,
    to: toLabel || toCoords.city,
    distanceMiles: Math.round(distance),
    openTransport: costs.open,
    enclosedTransport: costs.enclosed,
    estimatedDays: costs.days,
  };
}

export function estimateShippingFromDistance(
  distanceMiles: number,
  fromLabel: string,
  toLabel: string
): ShippingEstimate {
  const costs = estimateCost(distanceMiles);
  return {
    from: fromLabel,
    to: toLabel,
    distanceMiles: Math.round(distanceMiles),
    openTransport: costs.open,
    enclosedTransport: costs.enclosed,
    estimatedDays: costs.days,
  };
}
