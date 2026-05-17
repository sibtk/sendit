import { ListingData } from "./types";

/**
 * Scrape IAA listing by fetching the HTML page and extracting data.
 * IAA embeds JSON data in the page that we can parse directly,
 * plus uses a known image URL pattern.
 */
export async function scrapeIAA(stockNumber: string): Promise<ListingData> {
  const url = `https://www.iaai.com/VehicleDetail/${stockNumber}~US`;

  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  });

  if (!res.ok) {
    throw new Error(`IAA returned ${res.status}`);
  }

  const html = await res.text();

  if (
    html.includes("DetailsNotFoundView") ||
    html.includes("Vehicle details are not found")
  ) {
    throw new Error("IAA listing not found or expired");
  }

  // Helper: extract value by label from HTML
  const extract = (label: string): string | null => {
    const patterns = [
      // Label/span pairs
      new RegExp(
        `${label}[:\\s]*</(?:label|span|div|dt|th)>\\s*(?:<[^>]*>\\s*)*([^<]+)`,
        "i"
      ),
      // JSON embedded data
      new RegExp(`"${label}"\\s*:\\s*"([^"]+)"`, "i"),
      // Direct value patterns
      new RegExp(
        `<label[^>]*>\\s*${label}[:\\s]*</label>\\s*(?:<[^>]*>\\s*)*([^<]+)`,
        "i"
      ),
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match?.[1]) {
        const val = match[1].trim();
        if (val && val !== "null" && val !== "undefined") return val;
      }
    }
    return null;
  };

  const extractNumber = (label: string): number | null => {
    const val = extract(label);
    if (!val) return null;
    const cleaned = val.replace(/[,$\s]/g, "");
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  };

  // === Extract VIN ===
  // Try full 17-char VIN first, then masked VINs
  let vin: string | null = null;
  let vinMasked = false;

  // Look for VIN in JSON data embedded in page
  const vinJsonMatch = html.match(/"VIN"?\s*:\s*"([A-HJ-NPR-Z0-9*]{17})"/i);
  if (vinJsonMatch) {
    vin = vinJsonMatch[1];
    vinMasked = vin.includes("*");
  }

  // Try finding full VIN in page text
  if (!vin || vinMasked) {
    const fullVinMatch = html.match(
      /\b([A-HJ-NPR-Z0-9]{17})\b/
    );
    if (fullVinMatch) {
      vin = fullVinMatch[1];
      vinMasked = false;
    }
  }

  // === Extract year/make/model from page title ===
  let year = 0;
  let make = "";
  let model = "";
  let trim: string | null = null;

  // IAA page titles are like "2022 TOYOTA GR SUPRA 3.0 PREMIUM"
  const titleTag = html.match(/<title[^>]*>([^<]+)</i);
  const pageTitle = titleTag?.[1] || "";

  // Clean the title — remove "for Auction - IAA" and similar suffixes
  const cleanTitle = pageTitle
    .replace(/\s*for\s+Auction.*$/i, "")
    .replace(/\s*-\s*IAA.*$/i, "")
    .replace(/\s*\|.*$/i, "")
    .trim();

  const ymm = cleanTitle.match(/^(\d{4})\s+([A-Z]+)\s+(.+)/i);
  if (ymm) {
    year = parseInt(ymm[1]);
    make = ymm[2].toUpperCase();
    const rest = ymm[3].trim();
    // Split model and trim — model is usually first 1-2 words
    const parts = rest.split(/\s+/);
    if (parts.length <= 2) {
      model = rest;
    } else {
      // For "GR SUPRA 3.0 PREMIUM" → model="GR SUPRA", trim="3.0 PREMIUM"
      // Heuristic: if a part starts with a digit, everything from there is trim
      const trimStart = parts.findIndex((p, i) => i > 0 && /^\d/.test(p));
      if (trimStart > 0) {
        model = parts.slice(0, trimStart).join(" ");
        trim = parts.slice(trimStart).join(" ");
      } else {
        model = parts.slice(0, 2).join(" ");
        trim = parts.length > 2 ? parts.slice(2).join(" ") : null;
      }
    }
  }

  // Fallback to extracted fields
  if (!year) year = extractNumber("Model Year") || 0;
  if (!make) make = extract("Make") || "";
  if (!model) model = extract("Model") || "";

  // === Extract engine ===
  const engineStr = extract("Engine");
  let hp: number | null = null;
  if (engineStr) {
    const hpMatch = engineStr.match(/(\d+)\s*HP/i);
    if (hpMatch) hp = parseInt(hpMatch[1]);
  }

  // === Extract mileage ===
  const mileageStr = extract("Odometer");
  let mileage: number | null = null;
  let mileageStatus: string | null = null;
  if (mileageStr) {
    const mileageMatch = mileageStr.match(/([\d,]+)\s*mi/i);
    if (mileageMatch) {
      mileage = parseInt(mileageMatch[1].replace(/,/g, ""));
    }
    if (mileageStr.includes("Actual")) mileageStatus = "Actual";
    else if (mileageStr.includes("Exempt")) mileageStatus = "Exempt";
    else if (mileageStr.includes("Not Actual")) mileageStatus = "Not Actual";
  }

  // === Extract title info ===
  const titleDoc = extract("Title/Sale Doc") || extract("Title");
  const titleBrand =
    extract("Title/Sale Doc Brand") || extract("Title Brand");

  // === Extract branch ===
  const branch = extract("Selling Branch");
  let branchCity: string | null = null;
  let branchState: string | null = null;
  if (branch) {
    const branchMatch = branch.match(/(.+?)\s*\((\w{2})\)/);
    if (branchMatch) {
      branchCity = branchMatch[1].trim();
      branchState = branchMatch[2];
    }
  }

  // === Extract branch number for IMAGE URLs ===
  // IMPORTANT: The image branch (B###) can differ from branchCode.
  // Priority: actual image key pattern in page > branchCode > fallback
  const imageBranchMatch = html.match(/~SID~B(\d{2,4})~/);
  const branchCodeMatch =
    html.match(/"branchCode"\s*:\s*"?(\d{2,4})/i) ||
    html.match(/"BranchNumber"\s*:\s*"(\d{2,4})"/i);
  const branchNum = imageBranchMatch?.[1] || branchCodeMatch?.[1] || "441";

  // Also try to extract image count from JSON
  const imageCountMatch = html.match(/"ImageCount"\s*:\s*(\d+)/i) ||
    html.match(/"imageCount"\s*:\s*(\d+)/i) ||
    html.match(/~I(\d+)~[^"]*"[^"]*$/m);
  const actualImageCount = imageCountMatch
    ? Math.min(parseInt(imageCountMatch[1]), 30)
    : 20;

  // === Extract salvageID for image URLs ===
  // IAA uses salvageID in image keys — this is often the URL param but can differ from stockNumber.
  // Best source: the actual image key embedded in the page HTML.
  const imageKeyMatch = html.match(/(\d{7,9})~SID~B\d{2,4}~/);
  const imageId = imageKeyMatch?.[1] || stockNumber;

  // === Build image URLs with labels ===
  // Extract image labels from hidden field: "Passenger Front Image,Driver Front photo,..."
  const labelMatch = html.match(/value="(Passenger Front[^"]+)"/);
  const imageLabels = labelMatch ? labelMatch[1].split(",").map(l => l.trim()) : [];

  // Extract actual image indices from HTML — IAA uses non-sequential indices (I5, I6, I8, not I1, I2, I3)
  // The S value (S0, S1, etc.) varies per listing — detect it from the HTML
  const imageIndexRegex = new RegExp(`${imageId}~SID~B${branchNum}~S(\\d)~I(\\d+)`, "g");
  const foundImages: { s: string; i: number }[] = [];
  const seenIndices = new Set<number>();
  let indexMatch;
  while ((indexMatch = imageIndexRegex.exec(html)) !== null) {
    const idx = parseInt(indexMatch[2]);
    if (!seenIndices.has(idx)) {
      seenIndices.add(idx);
      foundImages.push({ s: indexMatch[1], i: idx });
    }
  }

  // Determine the most common S value (S1 = active on most listings)
  const sCounts: Record<string, number> = {};
  for (const img of foundImages) {
    sCounts[img.s] = (sCounts[img.s] || 0) + 1;
  }
  const primaryS = Object.entries(sCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "0";

  // Filter to only the primary S value (active images), sort by index
  const activeIndices = foundImages
    .filter(img => img.s === primaryS)
    .map(img => img.i)
    .sort((a, b) => a - b);

  const imageUrls: string[] = [];
  const imageLabelMap: Record<string, string> = {};

  if (activeIndices.length > 0) {
    for (let idx = 0; idx < activeIndices.length; idx++) {
      const i = activeIndices[idx];
      const key = `${imageId}~SID~B${branchNum}~S${primaryS}~I${i}~RW2576~H1932~TH0`;
      const url = `https://vis.iaai.com/resizer?imageKeys=${key}&width=845&height=633`;
      imageUrls.push(url);
      if (imageLabels[idx]) {
        imageLabelMap[url] = imageLabels[idx];
      }
    }
  } else {
    // Fallback: sequential indices with S0
    for (let i = 1; i <= actualImageCount; i++) {
      const key = `${imageId}~SID~B${branchNum}~S0~I${i}~RW2576~H1932~TH0`;
      const url = `https://vis.iaai.com/resizer?imageKeys=${key}&width=845&height=633`;
      imageUrls.push(url);
      if (imageLabels[i - 1]) {
        imageLabelMap[url] = imageLabels[i - 1];
      }
    }
  }

  // === Extract ACV from JSON data ===
  let acv: number | null = null;
  const acvJsonMatch =
    html.match(/"ACV"\s*:\s*"?\$?([\d,]+(?:\.\d{2})?)/i) ||
    html.match(/"actualCashValue"\s*:\s*"?\$?([\d,]+(?:\.\d{2})?)/i) ||
    html.match(/Actual\s*Cash\s*Value[^$\d]{0,40}\$\s*([\d,]+(?:\.\d{2})?)/i);
  if (acvJsonMatch) {
    acv = parseFloat(acvJsonMatch[1].replace(/,/g, ""));
  }

  // === Extract Buy Now price from JSON data ===
  let buyItNow: number | null = null;
  const binMatch =
    html.match(/"[Bb]uy[Nn]ow[Pp]rice"\s*:\s*"?\$?([\d,]+(?:\.\d{2})?)/i) ||
    html.match(/"buyNowPrice"\s*:\s*([\d.]+)/i) ||
    html.match(/"BuyNowPrice"\s*:\s*([\d.]+)/i) ||
    html.match(/Buy\s*Now[^$\d]{0,30}\$\s*([\d,]+(?:\.\d{2})?)/i);
  if (binMatch) {
    const val = parseFloat(binMatch[1].replace(/,/g, ""));
    if (val >= 50) {
      buyItNow = val;
    }
  }

  // === Extract current bid from JSON data ===
  let currentBid: number | null = null;
  const bidMatch =
    html.match(/"[Cc]urrent[Bb]id"\s*:\s*"?\$?([\d,]+(?:\.\d{2})?)/i) ||
    html.match(/"[Hh]igh[Bb]id"\s*:\s*"?\$?([\d,]+(?:\.\d{2})?)/i) ||
    html.match(/"currentBidAmount"\s*:\s*([\d.]+)/i) ||
    html.match(/Current\s*Bid[^$\d]{0,20}\$\s*([\d,]+(?:\.\d{2})?)/i);
  if (bidMatch) {
    const val = parseFloat(bidMatch[1].replace(/,/g, ""));
    // Sanity: bid shouldn't be the mileage — compare against mileage if we have it
    if (val > 0 && val < 500000 && (!mileage || val !== mileage)) {
      currentBid = val;
    }
  }

  // === Extract estimated repair cost ===
  let estimatedRepairCost: number | null = null;
  const repairMatch = html.match(
    /Estimated\s*Repair\s*Cost[^$]*?\$?\s*([\d,]+(?:\.\d{2})?)/i
  );
  if (repairMatch) {
    estimatedRepairCost = parseFloat(repairMatch[1].replace(/,/g, ""));
  }

  // === Branch coordinates for shipping calculation ===
  const branchCoords: Record<string, { lat: number; lng: number }> = {
    "Dallas": { lat: 32.5889, lng: -96.7242 },
    "Houston": { lat: 29.7604, lng: -95.3698 },
    "Taunton": { lat: 41.9001, lng: -71.0898 },
    "Los Angeles": { lat: 34.0522, lng: -118.2437 },
    "Avenel": { lat: 40.5801, lng: -74.2776 },
    "Avenel New Jersey": { lat: 40.5801, lng: -74.2776 },
    "Atlanta": { lat: 33.749, lng: -84.388 },
    "Chicago": { lat: 41.8781, lng: -87.6298 },
    "Denver": { lat: 39.7392, lng: -104.9903 },
    "Miami": { lat: 25.7617, lng: -80.1918 },
    "Phoenix": { lat: 33.4484, lng: -112.074 },
    "Philadelphia": { lat: 39.9526, lng: -75.1652 },
    "San Antonio": { lat: 29.4241, lng: -98.4936 },
    "Portland": { lat: 45.5152, lng: -122.6784 },
    "Seattle": { lat: 47.6062, lng: -122.3321 },
    "Detroit": { lat: 42.3314, lng: -83.0458 },
    "Minneapolis": { lat: 44.9778, lng: -93.265 },
    "Charlotte": { lat: 35.2271, lng: -80.8431 },
    "Nashville": { lat: 36.1627, lng: -86.7816 },
    "Oklahoma City": { lat: 35.4676, lng: -97.5164 },
    // IAA specialty auctions
    "Dream Rides": { lat: 32.5889, lng: -96.7242 }, // Dallas-based
    "Dream Ride": { lat: 32.5889, lng: -96.7242 },
    // More common branches
    "Jacksonville": { lat: 30.3322, lng: -81.6557 },
    "Orlando": { lat: 28.5383, lng: -81.3792 },
    "Tampa": { lat: 27.9506, lng: -82.4572 },
    "Sacramento": { lat: 38.5816, lng: -121.4944 },
    "San Diego": { lat: 32.7157, lng: -117.1611 },
    "Las Vegas": { lat: 36.1699, lng: -115.1398 },
    "Salt Lake City": { lat: 40.7608, lng: -111.891 },
    "Indianapolis": { lat: 39.7684, lng: -86.1581 },
    "Columbus": { lat: 39.9612, lng: -82.9988 },
    "Kansas City": { lat: 39.1141, lng: -94.6275 },
    "St. Louis": { lat: 38.627, lng: -90.1994 },
    "New Orleans": { lat: 29.9511, lng: -90.0715 },
    "Birmingham": { lat: 33.5207, lng: -86.8025 },
    "Albuquerque": { lat: 35.0844, lng: -106.6504 },
    "Pittsburgh": { lat: 40.4406, lng: -79.9959 },
    "Albany": { lat: 42.6526, lng: -73.7562 },
    "Fort Worth": { lat: 32.8624, lng: -97.3929 },
    "Austin": { lat: 30.2672, lng: -97.7431 },
    "El Paso": { lat: 31.7619, lng: -106.485 },
    "Boise": { lat: 43.615, lng: -116.2023 },
  };

  // Try matching branch city/name against known coords
  let coords: { lat: number; lng: number } | null = null;
  const branchLookup = branchCity || branch;
  if (branchLookup) {
    // Try exact match first, then partial
    coords = branchCoords[branchLookup] || null;
    if (!coords) {
      const cityKey = Object.keys(branchCoords).find((k) =>
        branchLookup!.toLowerCase().includes(k.toLowerCase())
      );
      if (cityKey) coords = branchCoords[cityKey];
    }
  }

  return {
    platform: "iaa",
    lotNumber: stockNumber,
    url,
    vin,
    vinMasked,
    year,
    make,
    model,
    trim,
    bodyStyle: extract("Body Style"),
    engine: engineStr,
    transmission: extract("Transmission"),
    drivetrain: extract("Drive Line Type"),
    fuelType: extract("Fuel Type"),
    cylinders: extractNumber("Cylinders"),
    hp,
    exteriorColor: extract("Exterior") || extract("Color"),
    interiorColor: extract("Interior"),
    mileage,
    mileageStatus,
    primaryDamage: extract("Primary Damage"),
    secondaryDamage: extract("Secondary Damage"),
    lossType: extract("Loss"),
    titleStatus: titleDoc,
    titleBrand,
    startCode: (() => {
      // Try JSON fields first
      const jsonMatch =
        html.match(/"StartsDesc"\s*:\s*"([^"]+)"/i) ||
        html.match(/"StartCode"\s*[,:]\s*"?([^",}]+)/i) ||
        html.match(/"value"\s*:\s*"(Stationary|Starts|Run\s*(?:&|and)\s*Drive)"/i);
      if (jsonMatch) return jsonMatch[1].trim();
      // Fall back to HTML extraction
      return extract("Start Code") || extract("StartCode");
    })(),
    keyPresent: extract("Key")?.toLowerCase().includes("present") ?? null,
    airbags: extract("Airbags"),
    sellingBranch: branch,
    branchCity,
    branchState,
    branchCoordinates: coords,
    currentBid,
    buyItNow,
    acv,
    estimatedRepairCost,
    auctionDate: (() => {
      // IAA embeds auction date as "AuctionDateTime" in JSON
      const jsonMatch = html.match(/"AuctionDateTime"\s*:\s*"([^"]+)"/i)
        || html.match(/"auctionDate(?:Time)?"\s*:\s*"([^"]+)"/i)
        || html.match(/"SaleDate"\s*:\s*"([^"]+)"/i);
      if (jsonMatch?.[1]) {
        // Parse "5/18/2026 1:30:00 PM +00:00" into ISO
        try {
          const d = new Date(jsonMatch[1].replace(/\\u002B/g, "+"));
          if (!isNaN(d.getTime())) return d.toISOString();
        } catch {}
        return jsonMatch[1].trim();
      }
      return extract("Auction Date and Time") || extract("Auction Date") || extract("Sale Date") || null;
    })(),
    imageUrls,
    imageLabels: Object.keys(imageLabelMap).length > 0 ? imageLabelMap : undefined,
    bidRequirements: (() => {
      // Extract "WhoCanBuy" from JSON — codes like "PUB,DEA,DIS,REB,SCR,EXP,OLB"
      const wcbMatch = html.match(/"WhoCanBuy"\s*:\s*"([^"]+)"/i);
      if (!wcbMatch) return undefined;
      const codes = wcbMatch[1].split(",").map(c => c.trim());
      const codeMap: Record<string, string> = {
        PUB: "Public", DEA: "Dealer", DIS: "Dismantler", REB: "Rebuilder",
        SCR: "Scrapper", EXP: "Exporter", OLB: "Other Licensed Business",
        NAL: "Non-Auto Licensed Business",
      };
      return codes.map(c => codeMap[c] || c).filter(Boolean);
    })(),
    sellerType: (() => {
      // Check Seller Type field first (IAA shows this explicitly)
      const sellerTypeField = extract("Seller Type") ||
        html.match(/"sellerType"\s*:\s*"([^"]+)"/i)?.[1] ||
        html.match(/"SellerType"\s*:\s*"([^"]+)"/i)?.[1] || null;

      if (sellerTypeField) {
        const st = sellerTypeField.toLowerCase();
        if (st.includes("insurance")) return "insurance" as const;
        if (st.includes("dealer")) return "dealer" as const;
        if (st.includes("private") || st.includes("individual")) return "private" as const;
        if (st.includes("fleet") || st.includes("rental")) return "fleet" as const;
      }

      // Fallback: check Seller name
      const seller = extract("Seller") || extract("SellerName") ||
        html.match(/"sellerName"\s*:\s*"([^"]+)"/i)?.[1] ||
        html.match(/"Seller"\s*:\s*"([^"]+)"/i)?.[1] || null;

      if (!seller || seller === "") return "dealer" as const; // No seller shown = dealer
      if (/insurance|insur|geico|state farm|progressive|allstate|liberty|nationwide|usaa|farmers|aaa|traveler/i.test(seller)) return "insurance" as const;
      if (/llc|inc|corp|auto|motors|dealer|group|enterprise|hertz|avis|budget|fleet/i.test(seller)) return "fleet" as const;
      return "private" as const;
    })(),
  };
}
