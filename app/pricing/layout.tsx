import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing — Pro & Dealer Plans | sendit scan",
  description: "sendit scan pricing — Pro at $30/mo (50 analyses) or Dealer at $120/mo (unlimited). AI damage analysis, repair estimates, real comps, and flip verdicts for Copart and IAA auctions.",
  keywords: "sendit scan pricing, copart analyzer pricing, salvage car tool price, car flip calculator cost",
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
