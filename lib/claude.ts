import Anthropic from "@anthropic-ai/sdk";
import {
  AnalysisResult,
  AuctionFees,
  ListingData,
  RecallInfo,
  RepairProfile,
  ShippingEstimate,
  VinDecode,
} from "./types";
import { buildSystemPrompt, buildUserPrompt } from "./prompt";

const client = new Anthropic();

// Labels we want for damage assessment — priority order
// IAA labels: "Passenger Front Image", "Driver Front photo", "Driver Rear photo", "Passenger Rear photo", "Damage photo"
// Copart labels: "PSFA", "DSFA", "DSRA", "PSRA", "DENT"
const WANTED_LABELS: { match: string[]; label: string; priority: number }[] = [
  { match: ["passenger front", "psfa"], label: "FRONT-RIGHT", priority: 1 },
  { match: ["driver front", "dsfa"], label: "FRONT-LEFT", priority: 2 },
  { match: ["driver rear", "dsra"], label: "REAR-LEFT", priority: 3 },
  { match: ["passenger rear", "psra"], label: "REAR-RIGHT", priority: 4 },
];

// Skip these completely
const SKIP_LABELS = ["odometer", "odom", "vin", "vins", "key", "engine", "engn", "misc", "video", "manufacturer", "ckpt", "dashboard"];

interface LabeledPhoto {
  url: string;
  label: string;
  priority: number;
}

function selectAndLabelPhotos(
  imageUrls: string[],
  imageLabels?: Record<string, string>
): LabeledPhoto[] {
  const selected: LabeledPhoto[] = [];
  const labels = imageLabels || {};

  for (const url of imageUrls) {
    const rawLabel = (labels[url] || "").toLowerCase();

    // Skip unwanted photos
    if (rawLabel && SKIP_LABELS.some(skip => rawLabel.includes(skip))) continue;

    // Try to match a wanted label
    for (const wanted of WANTED_LABELS) {
      if (wanted.match.some(m => rawLabel.includes(m))) {
        selected.push({ url, label: wanted.label, priority: wanted.priority });
        break;
      }
    }

    // If no label data at all (no imageLabels provided), include by position (first 5)
    if (!rawLabel && !imageLabels) {
      const DEFAULT_LABELS = ["FRONT-RIGHT", "FRONT-LEFT", "REAR-LEFT", "REAR-RIGHT", "DAMAGE"];
      const idx = selected.length;
      if (idx < DEFAULT_LABELS.length) {
        selected.push({ url, label: DEFAULT_LABELS[idx], priority: idx + 1 });
      }
    }
  }

  // Sort by priority — all DAMAGE photos come after the 4 corners
  selected.sort((a, b) => a.priority - b.priority);
  return selected.slice(0, 5);
}

// Downsize image URLs for Claude analysis
function downsizeUrl(url: string): string {
  if (url.includes("vis.iaai.com/resizer")) {
    return url.replace(/width=\d+&height=\d+/, "width=800&height=600");
  }
  // Copart images: replace _ful (full size 2576x1932) with _hrs (high res ~1200x900)
  if (url.includes("cs.copart.com") && url.includes("_ful.")) {
    return url.replace("_ful.", "_hrs.");
  }
  return url;
}

// Download image and convert to base64
async function fetchImageAsBase64(
  url: string
): Promise<{ base64: string; mediaType: string } | null> {
  try {
    const fetchUrl = downsizeUrl(url);
    const res = await fetch(fetchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      },
    });
    if (!res.ok) return null;

    const contentType = res.headers.get("content-type") || "image/jpeg";
    const buffer = await res.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");

    // Only return if we got actual image data (at least 1KB)
    if (base64.length < 1000) return null;

    // Map content type to what Claude expects
    let mediaType = "image/jpeg";
    if (contentType.includes("png")) mediaType = "image/png";
    else if (contentType.includes("webp")) mediaType = "image/webp";
    else if (contentType.includes("gif")) mediaType = "image/gif";

    return { base64, mediaType };
  } catch {
    return null;
  }
}

export async function analyzeVehicle(params: {
  listing: ListingData;
  vinDecode: VinDecode | null;
  recalls: RecallInfo[];
  fees: AuctionFees;
  shipping: ShippingEstimate | null;
  repairProfile: RepairProfile;
  userBid: number | null;
  userLocation: string;
  damageNotes: string | null;
}): Promise<AnalysisResult> {
  const {
    listing,
    vinDecode,
    recalls,
    fees,
    shipping,
    repairProfile,
    userBid,
    userLocation,
    damageNotes,
  } = params;

  const systemPrompt = buildSystemPrompt(repairProfile);
  const userPrompt = buildUserPrompt({
    listing: listing as unknown as Record<string, unknown>,
    vinDecode: vinDecode as unknown as Record<string, unknown>,
    recalls,
    fees: fees as unknown as Record<string, unknown>,
    shipping: shipping as unknown as Record<string, unknown>,
    userBid,
    userLocation,
    damageNotes,
  });

  // Build message content with labeled photos
  const content: Anthropic.MessageCreateParams["messages"][0]["content"] = [];

  // Select photos by label — gets all 4 corners + damage photo
  const t0 = Date.now();
  const labeledPhotos = selectAndLabelPhotos(listing.imageUrls || [], listing.imageLabels);
  const photoResults = await Promise.all(
    labeledPhotos.map(async (lp) => ({
      label: lp.label,
      image: await fetchImageAsBase64(lp.url),
    }))
  );
  console.log(`[TIMING] Photo download: ${Date.now() - t0}ms (${labeledPhotos.length} photos)`);

  let photosAdded = 0;
  const photoLabels: string[] = [];
  for (const { label, image } of photoResults) {
    if (image) {
      // Add label before each photo so Claude knows the angle
      content.push({
        type: "text",
        text: `[${label}]`,
      });
      content.push({
        type: "image",
        source: {
          type: "base64",
          media_type: image.mediaType as "image/jpeg" | "image/png" | "image/webp" | "image/gif",
          data: image.base64,
        },
      });
      photosAdded++;
      photoLabels.push(label);
    }
  }

  console.log(`Sent ${photosAdded} labeled photos to Claude: ${photoLabels.join(", ")}`);

  // Build final prompt with photo context
  let finalPrompt = userPrompt;
  if (photosAdded < 2) {
    const warning = `WARNING: Only ${photosAdded} photos loaded successfully. Your damage assessment MUST be limited to what you can see. If no photos loaded, state that damage cannot be assessed visually and note it as an unknown risk.`;
    finalPrompt = warning + "\n\n" + userPrompt;
  } else {
    const photoContext = `\nPHOTOS PROVIDED: ${photoLabels.join(", ")}.
EXAMINE EACH PHOTO INDEPENDENTLY. For EACH photo, describe what damage you see at that specific angle.
CRITICAL: Check the REAR of the car carefully. Missing rear bumpers, tail light damage, and rear quarter damage are commonly missed. If ANY bumper (front OR rear) is missing or damaged, it MUST be in the repair estimate.`;
    finalPrompt = photoContext + "\n\n" + userPrompt;
  }

  // Add the text prompt
  content.push({
    type: "text",
    text: finalPrompt,
  });

  const tClaude = Date.now();
  const response = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 8192,
    temperature: 0,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content,
      },
    ],
  });
  console.log(`[TIMING] Claude API call: ${Date.now() - tClaude}ms`);

  // Extract text from response
  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Claude");
  }

  // Parse JSON response
  let jsonText = textBlock.text.trim();

  // Strip markdown code blocks if present
  if (jsonText.startsWith("```")) {
    jsonText = jsonText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  let analysis: AnalysisResult;
  try {
    analysis = JSON.parse(jsonText);
  } catch {
    // Claude sometimes wraps JSON in extra text — try to extract it
    const match = jsonText.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        analysis = JSON.parse(match[0]);
      } catch {
        throw new Error("Failed to parse analysis response");
      }
    } else {
      throw new Error("Failed to parse analysis response");
    }
  }

  return analysis;
}
