import { Platform } from "./types";

interface ParsedUrl {
  platform: Platform;
  lotNumber: string;
}

export function parseAuctionUrl(url: string): ParsedUrl | null {
  const trimmed = url.trim();

  // Copart: copart.com/lot/48876976 or copart.com/lot/48876976/slug-here
  const copartMatch = trimmed.match(
    /copart\.com\/lot\/(\d+)/i
  );
  if (copartMatch) {
    return { platform: "copart", lotNumber: copartMatch[1] };
  }

  // IAA: iaai.com/VehicleDetail/44365188~US or iaai.com/VehicleDetail/44365188
  const iaaMatch = trimmed.match(
    /iaai\.com\/VehicleDetail\/(\d+)/i
  );
  if (iaaMatch) {
    return { platform: "iaa", lotNumber: iaaMatch[1] };
  }

  // Try raw lot number if it's just digits
  if (/^\d{7,9}$/.test(trimmed)) {
    // Can't determine platform from just a number
    return null;
  }

  return null;
}

export function buildListingUrl(platform: Platform, lotNumber: string): string {
  if (platform === "copart") {
    return `https://www.copart.com/lot/${lotNumber}`;
  }
  return `https://www.iaai.com/VehicleDetail/${lotNumber}~US`;
}
