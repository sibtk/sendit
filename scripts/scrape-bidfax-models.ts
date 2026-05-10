/**
 * Scrape all valid make/model slugs from BidFax's dropdown.
 * Run: npx tsx scripts/scrape-bidfax-models.ts
 */

import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(__dirname, "../.env.local") });

const SCRAPER_API_KEY = process.env.SCRAPER_API_KEY || "";

// The makes we actually care about for flip cars
const MAKES = [
  "acura", "alfa-romeo", "aston-martin", "audi", "bmw",
  "buick", "cadillac", "chevrolet", "chrysler", "dodge",
  "ferrari", "fiat", "ford", "genesis", "gmc",
  "honda", "hyundai", "infiniti", "jaguar", "jeep",
  "kia", "lamborghini", "land-rover", "lexus", "lincoln",
  "lotus", "maserati", "mazda", "mclaren", "mercedes-benz",
  "mini", "mitsubishi", "nissan", "polestar", "pontiac",
  "porsche", "ram", "rivian", "subaru", "suzuki",
  "tesla", "toyota", "volkswagen", "volvo",
];

async function scrapeModels(make: string): Promise<string[]> {
  const url = `https://en.bidfax.info/${make}/`;
  const res = await fetch(
    `https://api.scraperapi.com?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(url)}`
  );

  if (!res.ok) {
    console.error(`  ${make}: ${res.status}`);
    return [];
  }

  const html = await res.text();

  // Extract model options from the dropdown <select> or links
  // BidFax model dropdown uses <option> tags or <a> links
  const models: string[] = [];

  // Try option tags first: <option value="m3">M3</option>
  const optionRegex = /<option[^>]*value="([^"]+)"[^>]*>([^<]+)<\/option>/gi;
  let match;
  while ((match = optionRegex.exec(html)) !== null) {
    const value = match[1].trim();
    // Skip empty/placeholder options
    if (value && value !== "" && !value.includes("Model")) {
      models.push(value);
    }
  }

  // Also try links: <a href="/bmw/m3/">M3</a>
  if (models.length === 0) {
    const linkRegex = new RegExp(`href="/${make}/([^/"]+)/"`, "gi");
    while ((match = linkRegex.exec(html)) !== null) {
      const slug = match[1].trim();
      if (slug && !models.includes(slug)) {
        models.push(slug);
      }
    }
  }

  return [...new Set(models)]; // dedupe
}

async function main() {
  console.log("Scraping BidFax model slugs for all makes...\n");

  const allModels: Record<string, string[]> = {};

  for (let i = 0; i < MAKES.length; i++) {
    const make = MAKES[i];
    process.stdout.write(`[${i + 1}/${MAKES.length}] ${make}... `);

    try {
      const models = await scrapeModels(make);
      allModels[make] = models;
      console.log(`${models.length} models`);
    } catch (e) {
      console.log(`ERROR: ${e}`);
      allModels[make] = [];
    }

    // Delay between calls
    if (i < MAKES.length - 1) {
      await new Promise((r) => setTimeout(r, 2500));
    }
  }

  // Output as JSON for easy reference
  const outputPath = resolve(__dirname, "bidfax-slugs.json");
  const fs = await import("fs");
  fs.writeFileSync(outputPath, JSON.stringify(allModels, null, 2));
  console.log(`\nSaved to ${outputPath}`);

  // Also print a summary
  console.log("\n=== SUMMARY ===");
  for (const [make, models] of Object.entries(allModels)) {
    if (models.length > 0) {
      console.log(`${make}: ${models.join(", ")}`);
    }
  }
}

main().catch(console.error);
