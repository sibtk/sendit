import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Copart & IAA Fee Calculator 2026 — Free Auction Fee Estimator | sendit scan",
  description: "Free Copart and IAA fee calculator. Enter your bid amount — instantly see buyer premium, gate fee, internet bid fee, environmental fee, and total out-the-door cost. Updated for 2026 fee schedules.",
  keywords: "copart fee calculator, copart fees calculator, IAA fee calculator, iaai fees calculator, copart buyer premium calculator, copart auction fees calculator, how much does copart charge, copart fee calculator 2026, iaa cost calculator, auction fee calculator, copart charges",
  openGraph: {
    title: "Copart & IAA Fee Calculator 2026 — Free | sendit scan",
    description: "Calculate exact auction fees before you bid. Copart and IAA buyer premiums, gate fees, and total costs.",
    url: "https://senditscan.com/tools/fees",
  },
};

export default function FeesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
