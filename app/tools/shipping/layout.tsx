import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Auto Transport & Shipping Cost Estimator 2026 — Copart & IAA | sendit scan",
  description: "Estimate shipping costs from any Copart or IAA auction yard to your location. Distance-based rates for open and enclosed transport. Free calculator.",
  keywords: "copart shipping cost, IAA shipping estimate, auto transport calculator, salvage car shipping, auction car transport cost 2026",
  openGraph: {
    title: "Auto Transport Cost Estimator 2026 — Copart & IAA | sendit scan",
    description: "Estimate shipping costs from any auction yard to your door. Open and enclosed transport rates.",
    url: "https://senditscan.com/tools/shipping",
  },
};

export default function ShippingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
