import { ListingData } from "./types";

const COPART_API = "https://www.copart.com/public/data/lotdetails/solr";
const COPART_IMAGES_API =
  "https://www.copart.com/public/data/lotdetails/solr/lotImages";

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
  // Fetch lot details
  const detailsRes = await fetch(`${COPART_API}/${lotNumber}`, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    },
  });

  if (!detailsRes.ok) {
    throw new Error(`Copart API returned ${detailsRes.status}`);
  }

  const detailsJson = await detailsRes.json();

  if (detailsJson.returnCode !== 1) {
    throw new Error(
      `Copart API error: ${detailsJson.returnCodeDesc || "Unknown error"}`
    );
  }

  const lot: CopartLotData = detailsJson.data?.lotDetails || {};

  // Fetch images
  let imageUrls: string[] = [];
  try {
    const imagesRes = await fetch(`${COPART_IMAGES_API}/${lotNumber}/USA`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      },
    });
    if (imagesRes.ok) {
      const imagesJson = await imagesRes.json();
      const images = imagesJson.data?.imagesList?.FULL_IMAGE || [];
      imageUrls = images
        .filter((img: { url?: string }) => img.url)
        .map((img: { url: string }) => img.url);
    }
  } catch {
    // Images are optional, don't fail the whole scrape
  }

  const vin = (lot.fld as string) || null;
  const vinMasked = vin ? vin.includes("*") : true;

  // Parse model — Copart sometimes includes trim in model name
  const modelRaw = (lot.mmon as string) || "";
  const modelParts = modelRaw.split(" ");
  const model = modelParts[0] || modelRaw;
  const trim = modelParts.length > 1 ? modelParts.slice(1).join(" ") : null;

  // Parse current bid
  const currentBid =
    lot.dynamicLotDetails?.currentBid ||
    (lot.htsmn ? parseFloat(String(lot.htsmn)) : null);

  return {
    platform: "copart",
    lotNumber,
    url: `https://www.copart.com/lot/${lotNumber}`,
    vin,
    vinMasked,
    year: (lot.lcy as number) || 0,
    make: (lot.mkn as string) || "",
    model,
    trim,
    bodyStyle: null, // Copart doesn't always give this in the API
    engine: (lot.engtp as string) || null,
    transmission: (lot.tmtp as string) || null,
    drivetrain: (lot.dd as string) || null,
    fuelType: (lot.fv as string) || null,
    cylinders: (lot.cylnd as number) || null,
    hp: null, // Not in Copart API, will come from VIN decode
    exteriorColor: (lot.clr as string) || null,
    interiorColor: null,
    mileage: (lot.orr as number) || null,
    mileageStatus: null,
    primaryDamage: (lot.dmg as string) || null,
    secondaryDamage: null,
    lossType: (lot.la as string) || null,
    titleStatus: (lot.sdf as string) || null,
    titleBrand: (lot.bndc as string) || null,
    startCode: parseStartCode(lot.rc as string | undefined),
    keyPresent: lot.hk === "YES" || lot.hk === "Y",
    airbags: null,
    sellingBranch: (lot.ynm as string) || null,
    branchCity: null,
    branchState: (lot.ysta as string) || null,
    branchCoordinates:
      lot.lat && lot.lon ? { lat: lot.lat, lng: lot.lon } : null,
    currentBid,
    buyItNow: (lot.bin as number) || null,
    acv: null,
    estimatedRepairCost: null,
    auctionDate: (lot.ad as string) || null,
    imageUrls,
    sellerType: "insurance" as const, // Copart is primarily insurance
  };
}
