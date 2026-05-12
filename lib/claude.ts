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

// Photo angle labels — IAA uses these in their image descriptions
const ANGLE_PRIORITY: { keywords: string[]; label: string; priority: number }[] = [
  { keywords: ["passenger front", "pass front", "right front", "rf"], label: "FRONT-RIGHT", priority: 1 },
  { keywords: ["driver front", "driv front", "left front", "lf", "front left"], label: "FRONT-LEFT", priority: 2 },
  { keywords: ["driver rear", "driv rear", "left rear", "lr", "rear left"], label: "REAR-LEFT", priority: 3 },
  { keywords: ["passenger rear", "pass rear", "right rear", "rr", "rear right"], label: "REAR-RIGHT", priority: 4 },
  { keywords: ["damage", "dmg", "impact"], label: "DAMAGE-CLOSEUP", priority: 5 },
  { keywords: ["front", "frt"], label: "FRONT", priority: 6 },
  { keywords: ["rear", "back"], label: "REAR", priority: 7 },
  { keywords: ["left", "driver"], label: "LEFT-SIDE", priority: 8 },
  { keywords: ["right", "passenger"], label: "RIGHT-SIDE", priority: 9 },
  { keywords: ["interior front", "int front", "cabin"], label: "INTERIOR", priority: 10 },
];

// Skip these — no damage info. Use specific patterns to avoid false matches on URLs
const SKIP_KEYWORDS = ["odometer", "vin plate", "key photo", "manufacturer vin", "engine photo", "misc parts", "not attached", "title doc"];

interface LabeledPhoto {
  url: string;
  label: string;
  priority: number;
}

function selectAndLabelPhotos(imageUrls: string[], maxPhotos: number = 4): LabeledPhoto[] {
  // IAA standard photo order: 1=front-right, 2=front-left, 3=rear-left, 4=rear-right
  // Copart varies but generally similar
  const DEFAULT_LABELS = ["FRONT-RIGHT", "FRONT-LEFT", "REAR-LEFT", "REAR-RIGHT", "DAMAGE-CLOSEUP", "EXTRA"];

  const labeled: LabeledPhoto[] = [];

  for (let i = 0; i < imageUrls.length; i++) {
    const url = imageUrls[i];
    const lower = url.toLowerCase();

    // Skip non-damage photos — only for URLs with descriptive text (not IAA index URLs)
    const hasDescriptiveText = !lower.includes("vis.iaai.com") && !lower.includes("cs.copart.com");
    if (hasDescriptiveText && SKIP_KEYWORDS.some(kw => lower.includes(kw))) continue;

    // Try to match a known angle from URL
    let label: string | null = null;
    let priority = 50 + i;
    for (const angle of ANGLE_PRIORITY) {
      if (angle.keywords.some(kw => lower.includes(kw))) {
        label = angle.label;
        priority = angle.priority;
        break;
      }
    }

    // If no keyword match, assign default label by position
    // IAA photos are consistently ordered: front-right, front-left, rear-left, rear-right
    if (!label) {
      const defaultIdx = labeled.length;
      label = defaultIdx < DEFAULT_LABELS.length ? DEFAULT_LABELS[defaultIdx] : `PHOTO-${defaultIdx + 1}`;
      priority = defaultIdx + 1;
    }

    labeled.push({ url, label, priority });
  }

  // Sort by priority, take top N
  labeled.sort((a, b) => a.priority - b.priority);
  return labeled.slice(0, maxPhotos);
}

// Downsize IAA image URLs for Claude analysis (saves ~75% on tokens)
function downsizeUrl(url: string): string {
  if (url.includes("vis.iaai.com/resizer")) {
    return url.replace(/width=\d+&height=\d+/, "width=1280&height=960");
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

  // Select and label 5 best exterior photos in consistent order
  const labeledPhotos = selectAndLabelPhotos(listing.imageUrls || [], 5);
  const photoResults = await Promise.all(
    labeledPhotos.map(async (lp) => ({
      label: lp.label,
      image: await fetchImageAsBase64(lp.url),
    }))
  );

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

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
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
