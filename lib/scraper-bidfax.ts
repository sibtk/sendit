/**
 * Scrape sold auction data from BidFax via ScraperAPI.
 */

import { AuctionComp } from "./auction-comps";
import { createClient } from "@supabase/supabase-js";

const SCRAPER_API_KEY = process.env.SCRAPER_API_KEY || "";

// In-memory cache (fast, but dies on redeploy)
const compCache: Record<string, { comps: AuctionComp[]; timestamp: number }> = {};
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000;

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  return url && key ? createClient(url, key) : null;
}

async function getDbCache(make: string, model: string): Promise<AuctionComp[] | null> {
  const sb = getSupabase();
  if (!sb) return null;
  try {
    const { data } = await sb
      .from("cached_comps")
      .select("comps, created_at")
      .eq("make", make.toUpperCase())
      .eq("model", model.toUpperCase())
      .eq("comp_type", "auction")
      .maybeSingle();
    if (!data) return null;
    const age = Date.now() - new Date(data.created_at).getTime();
    if (age > CACHE_TTL) return null;
    return data.comps as AuctionComp[];
  } catch { return null; }
}

async function setDbCache(make: string, model: string, comps: AuctionComp[]) {
  const sb = getSupabase();
  if (!sb) return;
  try {
    await sb.from("cached_comps").upsert({
      make: make.toUpperCase(),
      model: model.toUpperCase(),
      comp_type: "auction",
      comps,
      created_at: new Date().toISOString(),
    }, { onConflict: "make,model,comp_type" });
  } catch (e) { console.error("DB cache write failed:", e); }
}

export async function searchBidFaxSold(
  make: string,
  model: string,
  targetYear?: number,
  trim?: string | null
): Promise<AuctionComp[]> {
  const { getModelNames } = await import("./model-mapping");
  const names = getModelNames(make, model);
  const cacheKey = `${make}|${names.bidfax}`.toUpperCase();

  // 1. Check in-memory cache (fastest)
  const memCached = compCache[cacheKey];
  if (memCached && Date.now() - memCached.timestamp < CACHE_TTL) {
    console.log(`BidFax: memory cache hit for ${cacheKey}`);
    return filterByYear(memCached.comps, make, model, targetYear, trim);
  }

  // 2. Check Supabase DB cache (survives redeploys)
  const dbCached = await getDbCache(make, names.bidfax);
  if (dbCached && dbCached.length > 0) {
    console.log(`BidFax: DB cache hit for ${cacheKey} (${dbCached.length} comps)`);
    compCache[cacheKey] = { comps: dbCached, timestamp: Date.now() };
    return filterByYear(dbCached, make, model, targetYear, trim);
  }

  // 3. Scrape from BidFax via ScraperAPI
  if (!SCRAPER_API_KEY) return [];

  try {
    const { getBidfaxMakeSlug } = await import("./model-mapping");
    const makeSlug = getBidfaxMakeSlug(make);
    const modelSlug = names.bidfax;
    const url = `https://en.bidfax.info/${makeSlug}/${modelSlug}/`;

    console.log(`BidFax: scraping ${url}`);

    const res = await fetch(
      `https://api.scraperapi.com?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(url)}`,
    );

    if (!res.ok) {
      console.error(`BidFax: ${res.status}`);
      return [];
    }

    const html = await res.text();
    console.log(`BidFax: ${html.length} bytes`);

    if (html.length < 2000) return [];

    const allComps = parseBidFaxListings(html, make, model);
    console.log(`BidFax: parsed ${allComps.length} comps`);

    // Cache in memory AND DB
    compCache[cacheKey] = { comps: allComps, timestamp: Date.now() };
    setDbCache(make, names.bidfax, allComps).catch(() => {});

    return filterByYear(allComps, make, model, targetYear, trim);
  } catch (e) {
    console.error("BidFax error:", e);
    return [];
  }
}

// Performance trims where comps MUST match the trim — otherwise a Hellcat pulls SXT comps
const TRIM_FILTER_RULES: Record<string, { match: string[]; exclude?: string[]; minPrice?: number }> = {
  "HELLCAT": { match: ["hellcat", "srt hellcat"], minPrice: 12000 },
  "HELLCAT RWD": { match: ["hellcat", "srt hellcat"], minPrice: 12000 },
  "HELLCAT WIDEBODY": { match: ["hellcat", "srt hellcat"], minPrice: 12000 },
  "HELLCAT REDEYE": { match: ["hellcat", "srt hellcat"], minPrice: 12000 },
  "SRT HELLCAT": { match: ["hellcat", "srt hellcat"], minPrice: 12000 },
  "SRT HELLCAT RWD": { match: ["hellcat", "srt hellcat"], minPrice: 12000 },
  "SRT HELLCAT WIDEBODY": { match: ["hellcat", "srt hellcat"], minPrice: 12000 },
  "SRT HELLCAT REDEYE": { match: ["hellcat", "srt hellcat"], minPrice: 12000 },
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

function filterByYear(comps: AuctionComp[], make: string, model: string, targetYear?: number, trim?: string | null): AuctionComp[] {
    let filtered = [...comps];
    if (targetYear) {
      // Use generation-aware year range if available, otherwise ±5 years
      const { getCompYearRange } = require("./generations");
      const [minYear, maxYear] = getCompYearRange(make, model, targetYear);
      filtered = filtered.filter((c) => c.year === 0 || (c.year >= minYear && c.year <= maxYear));
    }

    // Filter by performance trim if applicable
    if (trim) {
      const trimUp = trim.toUpperCase();
      const rule = TRIM_FILTER_RULES[trimUp];
      if (rule) {
        const before = filtered.length;
        // First try matching by trim name
        let trimFiltered = filtered.filter((c) => {
          const searchText = ((c.trim || "") + " " + (c.model || "")).toLowerCase();
          const hasMatch = rule.match.some(m => searchText.includes(m));
          const hasExclude = rule.exclude?.some(e => searchText.includes(e));
          return hasMatch && !hasExclude;
        });
        // If no trim matches, fall back to price filtering for performance trims
        // Hellcats never sell under $15K, Scat Packs under $8K, etc.
        if (trimFiltered.length < 2 && rule.minPrice) {
          trimFiltered = filtered.filter((c) => c.price >= rule.minPrice!);
          console.log(`BidFax: no trim matches, using price floor $${rule.minPrice} → ${trimFiltered.length}/${before} comps`);
        }
        console.log(`BidFax: comp trims: ${filtered.map(c => `${c.trim || "(none)"}=$${c.price}`).join(", ")}`);
        // Only apply trim filter if we still have comps
        if (trimFiltered.length >= 1) {
          filtered = trimFiltered;
          console.log(`BidFax: trim filter "${trim}" kept ${filtered.length}/${before} comps`);
        } else {
          console.log(`BidFax: trim filter "${trim}" too aggressive (${trimFiltered.length}/${before}), keeping all`);
        }
      }
    }

    filtered.sort((a, b) => {
      if (!a.saleDate || !b.saleDate) return 0;
      const [ad, am, ay] = a.saleDate.split(".");
      const [bd, bm, by] = b.saleDate.split(".");
      const dateA = new Date(`${ay}-${am}-${ad}`).getTime();
      const dateB = new Date(`${by}-${bm}-${bd}`).getTime();
      return dateB - dateA;
    });

    // Only keep last 6 months if we have plenty of data
    if (filtered.length > 5) {
      const sixMonthsAgo = Date.now() - 180 * 24 * 60 * 60 * 1000;
      const recent = filtered.filter((c) => {
        if (!c.saleDate) return true;
        const [d, m, y] = c.saleDate.split(".");
        return new Date(`${y}-${m}-${d}`).getTime() > sixMonthsAgo;
      });
      if (recent.length >= 3) filtered = recent; // Only filter if we still have enough
    }

    return filtered;
}

/**
 * Parse BidFax listing page.
 *
 * Structure per listing:
 *   <div class="thumbnail offer">
 *     <div class="price"><span class="prices">3600</span></div>
 *     <h2>Honda Accord Lx 2014 Black 2.4L vin: 1HGCR2F32EA266414</h2>
 *     Auction: <span class="iaai">IAAI</span> <span class="blackfont">Philadelphia (PA)</span>
 *     Lot number: <span class="blackfont">44966070</span>
 *     Condition: <span class="blackfont">Run and Drive</span>
 *     Damage: <span class="blackfont">Unknown</span>
 *     Mileage: <span class="blackfont">89778 miles (Actual)</span>
 *     Date of sale: <span class="blackfont">10.05.2026</span>
 */
function parseBidFaxListings(html: string, make: string, model: string): AuctionComp[] {
  const comps: AuctionComp[] = [];

  // Split by listing blocks
  const blocks = html.split(/class="thumbnail offer"/gi);

  for (let i = 1; i < blocks.length && comps.length < 20; i++) {
    const block = blocks[i];

    // Price — <span class="prices" id="...">3600</span>
    const priceMatch = block.match(/class="prices"[^>]*>(\d+)</);
    if (!priceMatch) continue;
    const price = parseInt(priceMatch[1]);
    if (price < 50 || price > 500000) continue;

    // Title — <h2>Honda Accord Lx 2014 Black 2.4L vin: ...</h2>
    const titleMatch = block.match(/<h2>([^<]+)<\/h2>/i);
    const title = titleMatch?.[1] || "";

    // Year from title
    const yearMatch = title.match(/\b(19\d{2}|20[0-2]\d)\b/);
    const year = yearMatch ? parseInt(yearMatch[1]) : 0;

    // Trim from title — extract everything between make+model and year
    // "Honda Accord Sport 2015 White 2.4L" → trim = "Sport"
    // "Honda Accord Ex-L V-6 2016 Black" → trim = "Ex-L V-6"
    const baseModel = model.split(/\s+/)[0];
    const trimRegex = new RegExp(`${baseModel}\\s+(.+?)\\s+${year}`, "i");
    const trimMatch = title.match(trimRegex);
    const trim = trimMatch?.[1]?.trim() || null;

    // Platform — <span class="iaai"> or <span class="copart">
    const platformMatch = block.match(/class="(iaai|copart)"/i);
    const platform = platformMatch?.[1]?.toLowerCase() === "copart" ? "copart" as const : "iaa" as const;

    // Location — after auction span: <span class="blackfont">Philadelphia (PA)</span>
    const locMatch = block.match(/class="(?:iaai|copart)"[^<]*<\/span>[^<]*<[^>]*>[^<]*<span class="blackfont">([^<]+)/i);
    const location = locMatch?.[1]?.trim() || null;

    // Lot number
    const lotMatch = block.match(/Lot\s*number[^<]*<span[^>]*>(\d+)/i);
    const lotNumber = lotMatch?.[1] || "";

    // Condition
    const condMatch = block.match(/Condition[^<]*<span[^>]*>([^<]+)/i);
    const condition = condMatch?.[1]?.trim() || null;

    // Damage
    const dmgMatch = block.match(/Damage[^<]*<span[^>]*>([^<]+)/i);
    const damage = dmgMatch?.[1]?.trim() || null;

    // Mileage — BidFax uses &nbsp; between number and "miles"
    const milesMatch = block.match(/Mileage[^<]*<span[^>]*>([\d,]+)(?:\s|&nbsp;)*miles/i);
    const mileage = milesMatch ? parseInt(milesMatch[1].replace(/,/g, "")) : null;

    // Date of sale
    const dateMatch = block.match(/Date\s*of\s*sale[^<]*<span[^>]*>([^<]+)/i);
    const saleDate = dateMatch?.[1]?.trim() || null;

    // Listing URL
    const urlMatch = block.match(/href="(https:\/\/en\.bidfax\.info\/[^"]+\.html)"/i);
    const listingUrl = urlMatch?.[1] || null;

    // Thumbnail image
    const imgMatch = block.match(/src="(https:\/\/bidfax\.info\/uploads\/[^"]+)"/i);
    const image = imgMatch?.[1] || null;

    comps.push({
      platform,
      year,
      make: make.toUpperCase(),
      model: model.toUpperCase(),
      trim,
      mileage,
      price,
      priceType: "sold",
      damage,
      titleStatus: condition,
      location,
      lotNumber,
      saleDate: saleDate || undefined,
      url: listingUrl || undefined,
      image: image || undefined,
    });
  }

  return comps;
}
