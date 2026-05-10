/**
 * Scrape all valid make/model names from AutoTempest's API.
 * Run: npx tsx scripts/scrape-autotempest-models.ts
 *
 * No API key needed — AutoTempest is free and public.
 * We test each model by doing a search and checking if results come back.
 */

import { writeFileSync } from "fs";
import { resolve } from "path";

// AutoTempest makes — they use Title Case with no spaces for multi-word models
const MAKES = [
  "Acura", "Alfa Romeo", "Aston Martin", "Audi", "Bentley", "BMW",
  "Buick", "Cadillac", "Chevrolet", "Chrysler", "Dodge",
  "Ferrari", "Fiat", "Ford", "Genesis", "GMC",
  "Honda", "Hyundai", "INFINITI", "Jaguar", "Jeep",
  "Kia", "Lamborghini", "Land Rover", "Lexus", "Lincoln",
  "Lotus", "Maserati", "Mazda", "McLaren", "Mercedes-Benz",
  "MINI", "Mitsubishi", "Nissan", "Polestar", "Pontiac",
  "Porsche", "RAM", "Rivian", "Subaru",
  "Tesla", "Toyota", "Volkswagen", "Volvo",
];

async function getModels(make: string): Promise<string[]> {
  // AutoTempest has a models endpoint or we can try searching
  // Let's try their search with just make to see what models come back
  const params = new URLSearchParams({
    make: make,
    zip: "77001",
    radius: "any",
    rpp: "50",
    sort: "best_match",
    sites: "cg|st|cs|cm|at|eb|ct",
    deduplicationSites: "cg|st|cs|cm|at|eb|ct",
  });

  const url = `https://www.autotempest.com/api/search?${params}`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Accept": "application/json",
      },
    });

    if (!res.ok) return [];

    const data = await res.json();
    const results = data.results || [];

    // Extract unique model names from results
    const models = new Set<string>();
    for (const r of results) {
      if (r.model) models.add(String(r.model));
    }

    return [...models].sort();
  } catch {
    return [];
  }
}

async function main() {
  console.log("Fetching AutoTempest model names...\n");

  const allModels: Record<string, string[]> = {};

  for (let i = 0; i < MAKES.length; i++) {
    const make = MAKES[i];
    process.stdout.write(`[${i + 1}/${MAKES.length}] ${make}... `);

    const models = await getModels(make);
    allModels[make] = models;
    console.log(`${models.length} models: ${models.slice(0, 8).join(", ")}${models.length > 8 ? "..." : ""}`);

    // Small delay to be polite
    await new Promise((r) => setTimeout(r, 500));
  }

  const outputPath = resolve(__dirname, "autotempest-models.json");
  writeFileSync(outputPath, JSON.stringify(allModels, null, 2));
  console.log(`\nSaved to ${outputPath}`);
}

main().catch(console.error);
