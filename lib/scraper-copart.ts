import { ListingData } from "./types";

const COPART_API = "https://www.copart.com/public/data/lotdetails/solr";
const COPART_IMAGES_API =
  "https://www.copart.com/public/data/lotdetails/solr/lotImages";
const SCRAPER_API_KEY = process.env.SCRAPER_API_KEY || "";

// Fetch with ScraperAPI fallback for Incapsula bypass
async function fetchWithFallback(url: string): Promise<Response> {
  // Try direct first
  const direct = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Accept": "application/json, text/plain, */*",
    },
  });

  if (direct.ok) {
    const text = await direct.text();
    // Check if it's the Incapsula bot wall (HTML instead of JSON)
    if (text.includes("Incapsula") || text.includes("_Incapsula_Resource") || !text.startsWith("{")) {
      console.log("Copart: Incapsula blocked, falling back to ScraperAPI");
      if (!SCRAPER_API_KEY) throw new Error("Copart blocked by Incapsula and no ScraperAPI key configured");
      // No render needed — Copart API returns JSON, we just need proxy to bypass Incapsula
      const scraperUrl = `https://api.scraperapi.com?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(url)}&keep_headers=true`;
      const fallback = await fetch(scraperUrl);
      if (!fallback.ok) throw new Error(`ScraperAPI returned ${fallback.status}`);
      const fallbackText = await fallback.text();
      // ScraperAPI might also get blocked
      if (fallbackText.includes("Incapsula") || !fallbackText.startsWith("{")) {
        throw new Error("Copart blocked even through ScraperAPI");
      }
      return new Response(fallbackText, { status: 200, headers: { "content-type": "application/json" } });
    }
    return new Response(text, { status: 200, headers: { "content-type": "application/json" } });
  }

  throw new Error(`Copart API returned ${direct.status}`);
}

interface CopartLotData {
  ln?: number; // lot number
  mkn?: string; // make name
  mmon?: string; // model name (sometimes "X3 SDRIVE30I")
  lcy?: number; // lot year
  orr?: number; // odometer reading
  tmtp?: string; // transmission type
  dd?: string; // drive description
  dmg?: string; // damage description
  fv?: string; // fuel type value
  clr?: string; // color
  engtp?: string; // engine type
  cylnd?: number; // cylinders
  la?: string; // loss type / auction type
  sdf?: string; // sale doc type
  bndc?: string; // brand code
  rc?: string; // run condition ("RUNS AND DRIVES", "STARTS", "STATIONARY")
  htsmn?: string; // high bid amount
  bin?: number; // buy it now price
  tims?: string; // title info / doc
  ynm?: string; // yard name
  ysta?: string; // yard state
  lat?: number;
  lon?: number;
  fld?: string; // VIN (partially masked)
  an?: number; // auction number
  ad?: string; // auction date
  showSaleDate?: boolean;
  imgs?: { url: string }[];
  ts?: string; // title state
  eid?: string; // engine ID
  hk?: string; // has keys
  mkic?: string; // make icon
  lotNumberStr?: string;
  dynamicLotDetails?: {
    currentBid?: number;
    salePrice?: number;
  };
  [key: string]: unknown;
}

function parseStartCode(rc: string | undefined): string | null {
  if (!rc) return null;
  const upper = rc.toUpperCase();
  if (upper.includes("RUN") && upper.includes("DRIVE")) return "Run & Drive";
  if (upper.includes("START")) return "Starts";
  if (upper.includes("STATIONARY") || upper.includes("STAT")) return "Stationary";
  return rc;
}

export async function scrapeCopart(lotNumber: string): Promise<ListingData> {
  // Fetch lot details (with ScraperAPI fallback if Incapsula blocks)
  const detailsRes = await fetchWithFallback(`${COPART_API}/${lotNumber}`);
  const detailsJson = await detailsRes.json();

  if (detailsJson.returnCode !== 1) {
    throw new Error(
      `Copart API error: ${detailsJson.returnCodeDesc || "Unknown error"}`
    );
  }

  const lot: CopartLotData = detailsJson.data?.lotDetails || {};

  // Fetch images with labels (same fallback)
  let imageUrls: string[] = [];
  const imageLabelMap: Record<string, string> = {};
  try {
    const imagesRes = await fetchWithFallback(`${COPART_IMAGES_API}/${lotNumber}/USA`);
    const imagesJson = await imagesRes.json();
    const imagesOld = imagesJson.data?.imagesList?.FULL_IMAGE || [];
    const imagesNew = imagesJson.data?.imagesList?.content || [];
    const allImages = [...imagesOld, ...imagesNew];
    for (const img of allImages) {
      const url = ((img as Record<string, unknown>).url || (img as Record<string, unknown>).fullUrl || (img as Record<string, unknown>).highResUrl || "") as string;
      const label = ((img as Record<string, unknown>).imageLabelCode || "") as string;
      if (url.length > 10) {
        imageUrls.push(url);
        if (label) imageLabelMap[url] = label;
      }
    }
  } catch {
    // Images are optional, don't fail the whole scrape
  }

  const vin = (lot.fv as string) || (lot.fld as string) || null;
  const vinMasked = vin ? vin.includes("*") : true;

  // Parse model — try multiple field names, Copart changed their API
  const modelRaw = (lot.lm as string) || (lot.mmon as string) || (lot.lmg as string) || "";
  const modelParts = modelRaw.split(" ");
  const model = modelParts[0] || modelRaw;
  const trim = modelParts.length > 1 ? modelParts.slice(1).join(" ") : null;

  // Parse current bid
  const currentBid =
    lot.dynamicLotDetails?.currentBid ||
    (lot.hb ? parseFloat(String(lot.hb)) : null) ||
    (lot.htsmn ? parseFloat(String(lot.htsmn)) : null);

  // Parse auction date — could be epoch ms or string
  let auctionDate: string | null = null;
  const adRaw = lot.ad;
  if (adRaw) {
    if (typeof adRaw === "number" || /^\d{10,}$/.test(String(adRaw))) {
      auctionDate = new Date(Number(adRaw)).toISOString();
    } else {
      auctionDate = String(adRaw);
    }
  }

  // Parse ACV
  const acvRaw = lot.la || lot.lotPlugAcv;
  const acv = typeof acvRaw === "number" ? acvRaw : (acvRaw ? parseFloat(String(acvRaw)) : null);

  return {
    platform: "copart",
    lotNumber,
    url: `https://www.copart.com/lot/${lotNumber}`,
    vin,
    vinMasked,
    year: (lot.lcy as number) || 0,
    make: (lot.mkn as string) || (lot.lmc as string) || "",
    model,
    trim,
    bodyStyle: (lot.bstl as string) || null,
    engine: (lot.egn as string) || (lot.engtp as string) || null,
    transmission: (lot.tmtp as string) || (lot.tsmn as string) || null,
    drivetrain: (lot.drv as string) || null,
    fuelType: (lot.ft as string) || null,
    cylinders: (lot.cy as number) || (lot.cylnd as number) || null,
    hp: null,
    exteriorColor: (lot.clr as string) || null,
    interiorColor: null,
    mileage: (lot.orr as number) || null,
    mileageStatus: (lot.ord as string) || null,
    primaryDamage: (lot.dd as string) || (lot.dmg as string) || null,
    secondaryDamage: null,
    lossType: null,
    titleStatus: (lot.td as string) || (lot.tgd as string) || (lot.sdf as string) || null,
    titleBrand: (lot.tgd as string) || (lot.bndc as string) || null,
    startCode: parseStartCode((lot.lcd as string) || (lot.rc as string) || undefined),
    keyPresent: lot.hk === "YES" || lot.hk === "Y",
    airbags: null,
    sellingBranch: (lot.yn as string) || (lot.ynm as string) || null,
    branchCity: (lot.locCity as string) || null,
    branchState: (lot.locState as string) || (lot.ysta as string) || null,
    branchCoordinates:
      lot.lat && lot.long ? { lat: lot.lat as number, lng: lot.long as number } :
      lot.lat && lot.lon ? { lat: lot.lat as number, lng: lot.lon as number } : null,
    currentBid,
    buyItNow: (lot.bin as number) || null,
    acv: typeof acv === "number" ? acv : null,
    estimatedRepairCost: null,
    auctionDate,
    imageUrls,
    imageLabels: Object.keys(imageLabelMap).length > 0 ? imageLabelMap : undefined,
    sellerType: (lot.stt as string) === "CT" ? "fleet" as const : "insurance" as const,
  };
}
