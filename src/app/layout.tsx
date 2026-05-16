import type { Metadata } from "next";
import Link from "next/link";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { I18nProvider } from "@/lib/i18n/Provider";
import { LocaleSwitcher } from "@/components/i18n/LocaleSwitcher";
import "./globals.css";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Wine Signals — Bourgogne & Bordeaux",
  description:
    "Multi-agent wine intelligence for French vineyards and trade buyers — Paris AI Hackathon 2026.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <I18nProvider>
          <TopNav />
          <div className="print:mt-0">{children}</div>
        </I18nProvider>
      </body>
    </html>
  );
}

function TopNav() {
  return (
    <nav className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md print:hidden">
      <div className="container mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="font-serif text-xl tracking-tight">
          Wine Signals
        </Link>
        <div className="flex items-center gap-6 text-[11px] uppercase tracking-luxe text-muted-foreground">
          <Link href="/vineyard" className="transition-colors hover:text-foreground">
            Vineyard
          </Link>
          <Link href="/trade" className="transition-colors hover:text-foreground">
            Trade
          </Link>
          <LocaleSwitcher />
        </div>
      </div>
    </nav>
  );
}
