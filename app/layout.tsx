import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth/auth-provider";
import { UserMenu } from "@/components/auth/user-menu";
import { NavLinks, TierBadge } from "@/components/nav-links";
import { Analytics } from "@vercel/analytics/next";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const grotesk = Space_Grotesk({
  variable: "--font-grotesk",
  subsets: ["latin"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "sendit scan — Copart & IAA Auction Analyzer | AI Damage Analysis & Flip Calculator",
  description: "Free Copart and IAA salvage auction analyzer. Paste any listing — get AI photo damage analysis, repair cost estimates, real auction and retail comps, fee calculator, shipping estimates, and a profit/loss flip verdict in 30 seconds. The sendit car auction tool for flippers and dealers.",
  keywords: ["sendit", "sendit scan", "sendit car", "sendit auction", "copart analyzer", "IAA analyzer", "salvage auction tool", "copart fee calculator", "car flip calculator", "auction damage analysis", "salvage car analyzer", "copart profit calculator", "IAA fee calculator", "should I buy this car", "copart flip tool", "salvage flip calculator"],
  metadataBase: new URL("https://senditscan.com"),
  openGraph: {
    title: "sendit scan — Copart & IAA Auction Analyzer",
    description: "Free salvage auction analyzer. AI damage analysis, repair estimates, real comps, and profit/loss verdicts for Copart and IAA listings in 30 seconds.",
    siteName: "sendit scan",
    type: "website",
    url: "https://senditscan.com",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "sendit scan — Copart & IAA Auction Analyzer",
    description: "Free salvage auction analyzer. AI damage analysis, repair estimates, real comps, and profit/loss verdicts in 30 seconds.",
    images: ["/og.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${grotesk.variable} ${jetbrains.variable}`}>
      <head>
        <link rel="preload" href="/bg.jpg" as="image" type="image/jpeg" />
      </head>
      <body className="min-h-screen relative flex flex-col" style={{ fontFamily: "var(--font-inter)" }}>
        <AuthProvider>
          {/* Global background texture */}
          <div className="fixed inset-0 pointer-events-none z-0 bg-cover bg-center bg-no-repeat opacity-50" style={{ backgroundImage: "url('/bg.jpg')" }} />
          <div className="fixed inset-0 pointer-events-none z-0 bg-[#0a0a0b]/40" />
          {/* Nav */}
          <nav className="sticky top-0 z-50 bg-[#0a0a0b]/60 backdrop-blur-xl border-b border-white/[0.04] relative before:absolute before:inset-x-0 before:-top-20 before:h-20 before:bg-[#0a0a0b]">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-5 pt-4 pb-2.5">
              <a href="/" className="flex items-center gap-2.5 group">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round"
                  style={{ filter: "drop-shadow(0 0 4px rgba(125,211,252,0.3))" }}
                >
                  <line x1="5" y1="12" x2="19" y2="12" stroke="#a1a1aa" strokeWidth="1.5"/>
                  <line x1="5" y1="4" x2="5" y2="20" stroke="#a1a1aa" strokeWidth="1.5"/>
                  <line x1="12" y1="4" x2="12" y2="20" stroke="#a1a1aa" strokeWidth="1.5"/>
                  <line x1="19" y1="4" x2="19" y2="20" stroke="#a1a1aa" strokeWidth="1.5"/>
                  <circle cx="5" cy="4" r="2.5" fill="#7dd3fc"/>
                </svg>
                <span className="text-[15px] font-bold tracking-tight text-[#a1a1aa] group-hover:text-[#d4d4d8] transition-colors" style={{ fontFamily: "var(--font-grotesk)" }}>
                  send<span className="text-[#7dd3fc]">it</span>
                </span>
                <TierBadge />
              </a>
              <div className="flex items-center gap-5 text-[13px] font-medium text-[#52525b]">
                <NavLinks />
                <UserMenu />
              </div>
            </div>
            <div className="h-px bg-gradient-to-r from-transparent via-[#27272a] to-transparent" />
          </nav>
          <main className="flex-1 relative z-10">{children}</main>
          {/* Footer */}
          <footer className="relative z-10 border-t border-white/[0.04] mt-auto">
            <div className="mx-auto max-w-6xl px-5 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-[11px] text-[#3f3f46]">
                &copy; {new Date().getFullYear()} sendit scan
              </span>
              <div className="flex items-center gap-4 text-[11px] text-[#3f3f46]">
                <a href="/blog" className="hover:text-[#52525b] transition-colors">Blog</a>
                <a href="/tools/fees" className="hover:text-[#52525b] transition-colors">Fee Calculator</a>
                <a href="/tools/title-laws" className="hover:text-[#52525b] transition-colors">Title Laws</a>
                <a href="/terms" className="hover:text-[#52525b] transition-colors">Terms</a>
                <a href="/privacy" className="hover:text-[#52525b] transition-colors">Privacy</a>
                <a href="/pricing" className="hover:text-[#52525b] transition-colors">Pricing</a>
                <a href="mailto:hello@senditscan.com" className="hover:text-[#52525b] transition-colors">Contact</a>
              </div>
            </div>
          </footer>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
