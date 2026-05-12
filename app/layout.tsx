import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth/auth-provider";
import { UserMenu } from "@/components/auth/user-menu";

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
  title: "SendIt Scan — Should You Send It?",
  description: "Paste a Copart or IAA link. Get AI damage analysis, repair costs, market comps, and a flip verdict in 15 seconds.",
  metadataBase: new URL("https://senditscan.com"),
  openGraph: {
    title: "SendIt Scan — Should You Send It?",
    description: "AI-powered auction car analysis. Paste a link, get the verdict.",
    siteName: "SendIt Scan",
    type: "website",
    url: "https://senditscan.com",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "SendIt Scan — Should You Send It?",
    description: "AI-powered auction car analysis. Paste a link, get the verdict.",
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
      <body className="min-h-screen relative" style={{ fontFamily: "var(--font-inter)" }}>
        <AuthProvider>
          {/* Global background texture */}
          <div className="fixed inset-0 pointer-events-none z-0 bg-cover bg-center bg-no-repeat opacity-50" style={{ backgroundImage: "url('/bg.jpg')" }} />
          <div className="fixed inset-0 pointer-events-none z-0 bg-[#0a0a0b]/40" />
          {/* Nav */}
          <nav className="sticky top-0 z-50 bg-[#0a0a0b]/60 backdrop-blur-xl relative">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-2.5">
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
              </a>
              <div className="flex items-center gap-5 text-[13px] font-medium text-[#52525b]">
                <a href="/" className="hover:text-[#7dd3fc] transition-colors">
                  New Scan
                </a>
                <a href="/flips" className="hover:text-[#a1a1aa] transition-colors">
                  My Cars
                </a>
                <a href="/analyses" className="hover:text-[#a1a1aa] transition-colors">
                  History
                </a>
                <a href="/pricing" className="hover:text-[#a1a1aa] transition-colors">
                  Pricing
                </a>
                <UserMenu />
              </div>
            </div>
            <div className="h-px bg-gradient-to-r from-transparent via-[#27272a] to-transparent" />
          </nav>
          <main className="flex-1 relative z-10">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
