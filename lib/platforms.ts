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

  // Copart: copart.com/vehicleDetail/48876976 (alternate format)
  const copartAltMatch = trimmed.match(
    /copart\.com\/vehicleDetail\/(\d+)/i
  );
  if (copartAltMatch) {
    return { platform: "copart", lotNumber: copartAltMatch[1] };
  }

  // Copart: mobile share links — copart.com/member/lotDetail/48876976
  const copartMemberMatch = trimmed.match(
    /copart\.com\/member\/lotDetail\/(\d+)/i
  );
  if (copartMemberMatch) {
    return { platform: "copart", lotNumber: copartMemberMatch[1] };
  }

  // Copart: any copart.com URL with a lot number in it
  const copartAnyMatch = trimmed.match(
    /copart\.com\/[^?]*?(\d{7,9})/i
  );
  if (copartAnyMatch) {
    return { platform: "copart", lotNumber: copartAnyMatch[1] };
  }

  // IAA: iaai.com/VehicleDetail/44365188~US or mappproxy.iaai.com/deeplink/VehicleDetail/44365188~US
  const iaaMatch = trimmed.match(
    /iaai\.com\/(?:deeplink\/)?VehicleDetail\/(\d+)/i
  );
  if (iaaMatch) {
    return { platform: "iaa", lotNumber: iaaMatch[1] };
  }

  // IAA mobile app links — various formats
  const iaaMobileMatch = trimmed.match(
    /iaai\.com\/Vehicle\?itemID=(\d+)/i
  );
  if (iaaMobileMatch) {
    return { platform: "iaa", lotNumber: iaaMobileMatch[1] };
  }

  // IAA: iaai.com/VehicleDetail?id=44365188
  const iaaIdMatch = trimmed.match(
    /iaai\.com\/VehicleDetail\?id=(\d+)/i
  );
  if (iaaIdMatch) {
    return { platform: "iaa", lotNumber: iaaIdMatch[1] };
  }

  // IAA: any URL with a salvage ID pattern in it
  const iaaAnyMatch = trimmed.match(
    /iaai\.com\/[^?]*?(\d{7,9})/i
  );
  if (iaaAnyMatch) {
    return { platform: "iaa", lotNumber: iaaAnyMatch[1] };
  }

  return null;
}

export function buildListingUrl(platform: Platform, lotNumber: string): string {
  if (platform === "copart") {
    return `https://www.copart.com/lot/${lotNumber}`;
  }
  return `https://www.iaai.com/VehicleDetail/${lotNumber}~US`;
}
