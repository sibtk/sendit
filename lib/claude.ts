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

// Smart photo selection — pick the most damage-relevant photos
function selectDamagePhotos(
  imageUrls: string[],
  maxPhotos: number = 4
): string[] {
  if (imageUrls.length <= maxPhotos) return imageUrls;

  const prioritized = [...imageUrls];

  // Deprioritize odometer, VIN plate, key, interior shots
  const lowPriority = ["odom", "vin", "key", "interior", "dash", "seat"];
  prioritized.sort((a, b) => {
    const aLow = lowPriority.some((kw) => a.toLowerCase().includes(kw));
    const bLow = lowPriority.some((kw) => b.toLowerCase().includes(kw));
    if (aLow && !bLow) return 1;
    if (!aLow && bLow) return -1;
    return 0;
  });

  return prioritized.slice(0, maxPhotos);
}

// Downsize IAA image URLs for Claude analysis (saves ~75% on tokens)
function downsizeUrl(url: string): string {
  if (url.includes("vis.iaai.com/resizer")) {
    return url.replace(/width=\d+&height=\d+/, "width=400&height=300");
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

  // Build message content with photos
  const content: Anthropic.MessageCreateParams["messages"][0]["content"] = [];

  // Download and add damage photos as base64
  const selectedPhotos = selectDamagePhotos(listing.imageUrls);
  const photoResults = await Promise.all(
    selectedPhotos.map((url) => fetchImageAsBase64(url))
  );

  let photosAdded = 0;
  for (const photo of photoResults) {
    if (photo) {
      content.push({
        type: "image",
        source: {
          type: "base64",
          media_type: photo.mediaType as "image/jpeg" | "image/png" | "image/webp" | "image/gif",
          data: photo.base64,
        },
      });
      photosAdded++;
    }
  }

  console.log(`Sent ${photosAdded} photos to Claude (of ${selectedPhotos.length} attempted)`);

  // If too few photos loaded, warn Claude to limit its visual assessment
  let finalPrompt = userPrompt;
  if (photosAdded < 2) {
    const warning = `WARNING: Only ${photosAdded} of ${selectedPhotos.length} photos loaded successfully. Your damage assessment MUST be limited to what you can see. If no photos loaded, state that damage cannot be assessed visually and note it as an unknown risk.`;
    finalPrompt = warning + "\n\n" + userPrompt;
  }

  // Add the text prompt
  content.push({
    type: "text",
    text: finalPrompt,
  });

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 8192,
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
