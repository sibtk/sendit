import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Manage Subscription | sendit scan",
  description: "Manage your sendit scan subscription — upgrade, cancel, or view your plan details.",
  robots: { index: false },
};

export default function SubscriptionLayout({ children }: { children: React.ReactNode }) {
  return children;
}
