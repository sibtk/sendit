import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Copart & IAA Fee Calculator 2026 — Free Auction Fee Estimator | sendit scan",
  description: "Calculate exact Copart and IAA buyer fees, premiums, gate fees, and total costs before you bid. Free auction fee calculator updated for 2026. Know your real out-the-door cost.",
  keywords: "copart fee calculator, IAA fee calculator, copart buyer premium, IAA buyer premium, auction fees, copart costs, IAA costs, salvage auction fees 2026",
  openGraph: {
    title: "Copart & IAA Fee Calculator 2026 — Free | sendit scan",
    description: "Calculate exact auction fees before you bid. Copart and IAA buyer premiums, gate fees, and total costs.",
    url: "https://senditscan.com/tools/fees",
  },
};

export default function FeesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
