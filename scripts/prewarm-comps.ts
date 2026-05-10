/**
 * Pre-warm BidFax comp cache for the top 50 flip cars.
 *
 * Run: npx tsx scripts/prewarm-comps.ts
 *
 * Each call uses ~10 ScraperAPI credits. 50 cars = ~500 credits.
 * Results cache in Supabase for 7 days, so run weekly.
 *
 * If a car is already cached (DB hit), it skips the scrape — safe to re-run.
 */

import { config } from "dotenv";
import { resolve } from "path";

// Load env vars from .env.local
config({ path: resolve(__dirname, "../.env.local") });

// Verify we have what we need
if (!process.env.SCRAPER_API_KEY) {
  console.error("Missing SCRAPER_API_KEY in .env.local");
  process.exit(1);
}
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL in .env.local");
  process.exit(1);
}

// Top 50 flip cars — sorted by frequency on IAA/Copart auctions
// Format: [make, model, typical year range]
const TOP_CARS: [string, string, number][] = [
  // Muscle / Sports — highest margin flips
  ["DODGE", "CHARGER", 2020],
  ["DODGE", "CHALLENGER", 2020],
  ["FORD", "MUSTANG", 2020],
  ["CHEVROLET", "CAMARO", 2020],
  ["CHEVROLET", "CORVETTE", 2020],
  ["TOYOTA", "GR SUPRA", 2022],
  ["TOYOTA", "GR86", 2023],
  ["NISSAN", "370Z", 2018],
  ["NISSAN", "Z", 2023],
  ["NISSAN", "GT-R", 2018],
  ["BMW", "M3", 2020],
  ["BMW", "M4", 2020],
  ["BMW", "M2", 2020],
  ["BMW", "M5", 2020],
  ["PORSCHE", "CAYMAN", 2020],
  ["PORSCHE", "911", 2020],
  ["PORSCHE", "BOXSTER", 2020],
  ["LEXUS", "RC F", 2018],
  ["LEXUS", "IS", 2020],
  ["LEXUS", "LC", 2020],
  ["INFINITI", "Q50", 2018],
  ["INFINITI", "Q60", 2018],
  ["KIA", "STINGER", 2020],
  ["GENESIS", "G70", 2020],

  // Trucks / SUVs — high volume
  ["FORD", "F-150", 2020],
  ["CHEVROLET", "SILVERADO", 2020],
  ["TOYOTA", "TACOMA", 2020],
  ["TOYOTA", "4RUNNER", 2020],
  ["JEEP", "WRANGLER", 2020],
  ["JEEP", "GRAND CHEROKEE", 2020],
  ["FORD", "BRONCO", 2022],
  ["TOYOTA", "RAV4", 2020],
  ["LEXUS", "RX", 2020],
  ["LEXUS", "GX", 2020],
  ["PORSCHE", "MACAN", 2020],
  ["PORSCHE", "CAYENNE", 2020],
  ["BMW", "X3", 2020],
  ["BMW", "X5", 2020],

  // Sedans — high volume, quick flips
  ["HONDA", "ACCORD", 2020],
  ["HONDA", "CIVIC", 2020],
  ["HONDA", "CR-V", 2020],
  ["TOYOTA", "CAMRY", 2020],
  ["TOYOTA", "COROLLA", 2020],
  ["HYUNDAI", "SONATA", 2020],
  ["HYUNDAI", "ELANTRA", 2020],
  ["NISSAN", "ALTIMA", 2020],

  // Tesla — growing segment
  ["TESLA", "MODEL 3", 2022],
  ["TESLA", "MODEL Y", 2022],
  ["TESLA", "MODEL S", 2020],
  ["TESLA", "MODEL X", 2020],

  // BMW sedans
  ["BMW", "330", 2020],
  ["BMW", "M240", 2022],

  // Audi
  ["AUDI", "A4", 2020],
  ["AUDI", "RS3", 2020],

  // Mercedes — BidFax only (no AutoTempest)
  ["MERCEDES-BENZ", "C", 2020],
  ["MERCEDES-BENZ", "E", 2020],
];

async function prewarm() {
  // Dynamic import so env vars are loaded first
  const { searchBidFaxSold } = await import("../lib/scraper-bidfax");

  console.log(`\nPre-warming BidFax cache for ${TOP_CARS.length} vehicles...\n`);

  let cached = 0;
  let scraped = 0;
  let failed = 0;

  for (let i = 0; i < TOP_CARS.length; i++) {
    const [make, model, year] = TOP_CARS[i];
    const tag = `[${i + 1}/${TOP_CARS.length}] ${make} ${model}`;

    try {
      const comps = await searchBidFaxSold(make, model, year);

      if (comps.length > 0) {
        const prices = comps.map((c) => c.price).sort((a, b) => a - b);
        const median = prices[Math.floor(prices.length / 2)];
        console.log(`  ${tag} — ${comps.length} comps, median $${median.toLocaleString()}`);
      } else {
        console.log(`  ${tag} — 0 comps (no data on BidFax)`);
      }

      // Check if it was a cache hit or fresh scrape by looking at the log output
      // If it was fresh, add a delay to not hammer ScraperAPI
      // The scraper logs "memory cache hit" or "DB cache hit" vs "scraping"
      // We can't easily detect this, so just add a small delay between all calls
      // Cache hits return instantly anyway

      if (comps.length > 0) {
        scraped++;
      } else {
        failed++;
      }

      // 3-second delay between calls to be nice to ScraperAPI
      // Cache hits return in <100ms so this only really matters for fresh scrapes
      if (i < TOP_CARS.length - 1) {
        await new Promise((r) => setTimeout(r, 3000));
      }
    } catch (e) {
      console.error(`  ${tag} — ERROR: ${e}`);
      failed++;
      // Still delay after errors
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  console.log(`\nDone! ${scraped} with data, ${failed} empty/failed`);
  console.log(`Cache valid for 7 days. Re-run weekly.\n`);
}

prewarm().catch(console.error);
