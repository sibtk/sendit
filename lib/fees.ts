/**
 * @fileoverview Auction fee calculations for Copart and IAA platforms.
 *
 * All fees are estimates based on publicly published fee schedules and may
 * change without notice. Always verify current fees directly with the auction
 * platform before making purchasing decisions.
 */

import { AuctionFees, Platform } from "./types";

/**
 * Calculate Copart buyer fees based on published fee schedule.
 * Buyer premium is tiered:
 *   $0-$99.99:        $1 (flat)
 *   $100-$499.99:     $49
 *   $500-$999.99:     $99
 *   $1,000-$1,499.99: $179
 *   $1,500-$1,999.99: $229
 *   $2,000-$3,999.99: $299
 *   $4,000-$5,999.99: $399
 *   $6,000-$7,999.99: $499
 *   $8,000-$9,999.99: $599
 *   $10,000-$14,999:  $699
 *   $15,000+:         6% of bid + $99
 */
function copartBuyerPremium(bid: number): number {
  if (bid < 100) return 1;
  if (bid < 500) return 49;
  if (bid < 1000) return 99;
  if (bid < 1500) return 179;
  if (bid < 2000) return 229;
  if (bid < 4000) return 299;
  if (bid < 6000) return 399;
  if (bid < 8000) return 499;
  if (bid < 10000) return 599;
  if (bid < 15000) return 699;
  return Math.round(bid * 0.06 + 99);
}

/**
 * Calculate IAA buyer premium (standard volume licensed buyer).
 * Source: SCA Help Center + iaaicalculator.com (verified Apr 2026)
 */
function iaaBuyerPremium(bid: number): number {
  if (bid < 50) return 25;
  if (bid < 100) return 45;
  if (bid < 200) return 80;
  if (bid < 300) return 130;
  if (bid < 350) return 137.5;
  if (bid < 400) return 145;
  if (bid < 450) return 175;
  if (bid < 500) return 185;
  if (bid < 550) return 205;
  if (bid < 600) return 210;
  if (bid < 700) return 240;
  if (bid < 800) return 270;
  if (bid < 900) return 295;
  if (bid < 1000) return 320;
  if (bid < 1200) return 375;
  if (bid < 1300) return 395;
  if (bid < 1400) return 410;
  if (bid < 1500) return 430;
  if (bid < 1600) return 445;
  if (bid < 1700) return 465;
  if (bid < 1800) return 485;
  if (bid < 2000) return 510;
  if (bid < 2400) return 535;
  if (bid < 2500) return 570;
  if (bid < 3000) return 610;
  if (bid < 3500) return 655;
  if (bid < 4000) return 705;
  if (bid < 4500) return 725;
  if (bid < 5000) return 750;
  if (bid < 5500) return 775;
  if (bid < 6000) return 800;
  if (bid < 6500) return 825;
  if (bid < 7000) return 845;
  if (bid < 7500) return 880;
  if (bid < 8000) return 900;
  if (bid < 8500) return 925;
  if (bid < 10000) return 945;
  if (bid < 15000) return 1000;
  return Math.round(bid * 0.075); // 7.5% for $15,000+
}

/**
 * Calculate IAA internet/online bid fee (proxy bid).
 * Source: SCA Help Center (verified Apr 2026)
 */
function iaaInternetBidFee(bid: number): number {
  if (bid < 100) return 0;
  if (bid < 500) return 40;
  if (bid < 1000) return 55;
  if (bid < 1500) return 75;
  if (bid < 2000) return 85;
  if (bid < 4000) return 100;
  if (bid < 6000) return 110;
  if (bid < 8000) return 125;
  return 140; // $8,000+
}

export function calculateAuctionFees(
  platform: Platform,
  bidAmount: number
): AuctionFees {
  if (platform === "copart") {
    const buyerPremium = copartBuyerPremium(bidAmount);
    const gateFee = 79;
    const internetBidFee = 159; // Internet bid fee for non-member
    const environmentalFee = 15;
    const titleFee = 20;
    const totalFees =
      buyerPremium + gateFee + internetBidFee + environmentalFee + titleFee;

    return {
      platform,
      bidAmount,
      buyerPremium,
      gateFee,
      internetBidFee,
      environmentalFee,
      titleFee,
      totalFees,
      totalWithBid: bidAmount + totalFees,
    };
  }

  // IAA — fees verified from SCA Help Center (Apr 2026)
  const buyerPremium = iaaBuyerPremium(bidAmount);
  const gateFee = 95; // Service/pull-out fee
  const internetBidFee = iaaInternetBidFee(bidAmount); // Tiered proxy bid fee
  const environmentalFee = 15;
  const titleFee = 20; // Title handling/mailing fee
  const totalFees =
    buyerPremium + gateFee + internetBidFee + environmentalFee + titleFee;

  return {
    platform,
    bidAmount,
    buyerPremium,
    gateFee,
    internetBidFee,
    environmentalFee,
    titleFee,
    totalFees,
    totalWithBid: bidAmount + totalFees,
  };
}
