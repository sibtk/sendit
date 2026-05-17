/**
 * Fetch retail/private party comps from AutoTempest's free API.
 * Aggregates from Cars.com, CarGurus, Craigslist, and more.
 * NO API KEY NEEDED. FREE. DIRECT JSON.
 */

export interface RetailComp {
  year: number;
  make: string;
  model: string;
  trim: string | null;
  price: number;
  mileage: number | null;
  sellerType: string | null; // "Owner" | "Dealer"
  source: string | null; // "Cars.com" | "CarGurus" | "craigslist"
  location: string | null;
  title: string | null; // "Clean" | "Salvage"
  image: string | null;
  url: string | null;
  daysListed: number | null;
}

export interface RetailCompSummary {
  comps: RetailComp[];
  count: number;
  priceRange: { low: number; high: number };
  median: number;
  avg: number;
}

// Cache by make/model — 7 days
const retailCache: Record<string, { comps: RetailComp[]; timestamp: number }> = {};
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000;

// Performance trims where comps MUST match — same list as auction comps
const TRIM_FILTER_RULES: Record<string, { match: string[]; exclude?: string[]; minPrice?: number }> = {
  "HELLCAT": { match: ["hellcat", "srt hellcat"], minPrice: 30000 },
  "HELLCAT RWD": { match: ["hellcat", "srt hellcat"], minPrice: 30000 },
  "HELLCAT WIDEBODY": { match: ["hellcat", "srt hellcat"], minPrice: 30000 },
  "HELLCAT REDEYE": { match: ["hellcat", "srt hellcat"], minPrice: 30000 },
  "SRT HELLCAT": { match: ["hellcat", "srt hellcat"], minPrice: 30000 },
  "SRT HELLCAT RWD": { match: ["hellcat", "srt hellcat"], minPrice: 30000 },
  "SRT HELLCAT WIDEBODY": { match: ["hellcat", "srt hellcat"], minPrice: 30000 },
  "SRT HELLCAT REDEYE": { match: ["hellcat", "srt hellcat"], minPrice: 30000 },
  "SCAT PACK": { match: ["scat pack", "scat"] },
  "SCAT PACK WIDEBODY": { match: ["scat pack", "scat"] },
  "SRT 392": { match: ["srt 392", "392"] },
  "SRT8": { match: ["srt8", "srt 8"] },
  "GT": { match: ["gt"], exclude: ["gte", "gti", "gt-line", "gt line"] },
  "SHELBY GT500": { match: ["shelby", "gt500"] },
  "SHELBY GT350": { match: ["shelby", "gt350"] },
  "GT500": { match: ["gt500", "shelby"] },
  "GT350": { match: ["gt350", "shelby"] },
  "TYPE R": { match: ["type r", "type-r"] },
  "NISMO": { match: ["nismo"] },
  "TRD PRO": { match: ["trd pro", "trd"] },
  "RAPTOR": { match: ["raptor"] },
  "ZL1": { match: ["zl1"] },
  "SS": { match: ["ss"], exclude: ["base"] },
  "Z06": { match: ["z06"] },
  "ZR1": { match: ["zr1"] },
  "TRACK PACK": { match: ["track pack"] },
};

export async function getRetailComps(
  year: number,
  make: string,
  model: string,
  zip: string = "77001",
  trim?: string | null
): Promise<RetailCompSummary | null> {
  const { getModelNames } = await import("./model-mapping");
  const names = getModelNames(make, model);
  const searchModel = names.autotempest;
  const cacheKey = `${make}|${searchModel}|${year}`.toUpperCase();

  const cached = retailCache[cacheKey];
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`AutoTempest: cache hit for ${cacheKey}`);
    return summarize(cached.comps);
  }

  try {
    // Use generation-aware year range if available, otherwise ±3 years
    const { getCompYearRange } = await import("./generations");
    const [genMin, genMax] = getCompYearRange(make, model, year);
    const minYear = Math.max(genMin, 2000);
    const maxYear = Math.min(genMax, new Date().getFullYear() + 1);

    // AutoTempest rejects hyphens in model names — strip them
    const cleanModel = searchModel.replace(/-/g, "");

    // Check if this is a performance trim that needs price filtering
    const trimUp = (trim || "").toUpperCase();
    const trimRule = TRIM_FILTER_RULES[trimUp];

    const params = new URLSearchParams({
      make: make,
      model: cleanModel,
      zip: zip,
      radius: "500",
      minyear: String(minYear),
      maxyear: String(maxYear),
      rpp: "20",
      sort: trimRule?.minPrice ? "price_desc" : "price_asc",
      sites: "cg|st|cs|cm|at|eb|ct",
      deduplicationSites: "cg|st|cs|cm|at|eb|ct",
    });
    if (trimRule?.minPrice) {
      params.set("minprice", String(trimRule.minPrice));
    }

    const url = `https://www.autotempest.com/api/search?${params}`;
    console.log(`AutoTempest: fetching ${make} ${searchModel} ${minYear}-${maxYear}`);

    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Accept": "application/json",
      },
    });

    if (!res.ok) {
      console.error(`AutoTempest: ${res.status}`);
      return null;
    }

    const data = await res.json();
    const results = data.results || [];
    console.log(`AutoTempest: ${results.length} results`);

    const comps: RetailComp[] = results
      .filter((r: Record<string, unknown>) => r.price && r.year)
      .map((r: Record<string, unknown>) => {
        // Parse price — comes as "$4,795" string
        const priceStr = String(r.price || "0").replace(/[$,]/g, "");
        const price = parseInt(priceStr) || 0;

        // Parse mileage — comes as "208,000" string
        const milesStr = String(r.mileage || "0").replace(/[,]/g, "");
        const mileage = parseInt(milesStr) || null;

        return {
          year: (r.year as number) || 0,
          make: (r.make as string) || make,
          model: (r.model as string) || model,
          trim: (r.trim as string) || null,
          price,
          mileage,
          sellerType: (r.sellerType as string) || null,
          source: (r.sourceName as string) || null,
          location: (r.location as string) || null,
          title: (r.vehicleTitle as string) || null,
          image: (r.img as string) || null,
          url: (r.url as string) || null,
          daysListed: null,
        };
      })
      .filter((c: RetailComp) => c.price > 500 && c.price < 500000);

    retailCache[cacheKey] = { comps, timestamp: Date.now() };

    // Filter by performance trim if applicable
    let finalComps = comps;
    if (trim) {
      const trimUp = trim.toUpperCase();
      const rule = TRIM_FILTER_RULES[trimUp];
      if (rule) {
        const trimFiltered = comps.filter((c) => {
          const compTrim = ((c.trim || "") + " " + (c.model || "")).toLowerCase();
          const hasMatch = rule.match.some(m => compTrim.includes(m));
          const hasExclude = rule.exclude?.some(e => compTrim.includes(e));
          return hasMatch && !hasExclude;
        });
        console.log(`AutoTempest: comp trims: ${comps.map(c => `"${c.trim || ""} | ${c.model || ""}"`).join(", ")}`);
        if (trimFiltered.length >= 2) {
          console.log(`AutoTempest: trim filter "${trim}" kept ${trimFiltered.length}/${comps.length} comps`);
          finalComps = trimFiltered;
        } else {
          console.log(`AutoTempest: trim filter "${trim}" too aggressive (${trimFiltered.length}/${comps.length}), keeping all`);
        }
      }
    }

    return summarize(finalComps);
  } catch (e) {
    console.error("AutoTempest error:", e);
    return null;
  }
}

function summarize(comps: RetailComp[]): RetailCompSummary | null {
  if (comps.length === 0) return null;

  const prices = comps.map((c) => c.price).sort((a, b) => a - b);
  return {
    comps,
    count: comps.length,
    priceRange: { low: prices[0], high: prices[prices.length - 1] },
    median: prices[Math.floor(prices.length / 2)],
    avg: Math.round(prices.reduce((s, p) => s + p, 0) / prices.length),
  };
}
