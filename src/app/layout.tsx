import type { Metadata } from "next";
import Link from "next/link";
import { I18nProvider } from "@/lib/i18n/Provider";
import { LocaleSwitcher } from "@/components/i18n/LocaleSwitcher";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wine Signals — Bourgogne & Bordeaux",
  description:
    "Multi-agent wine intelligence for French vineyards and trade buyers — Paris AI Hackathon 2026.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
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
    <nav className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur print:hidden">
      <div className="container mx-auto flex h-12 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="text-sm font-semibold tracking-tight">
          🍇 Wine Signals
        </Link>
        <div className="flex items-center gap-4 text-xs">
          <Link href="/vineyard" className="text-muted-foreground hover:text-foreground">
            Domaine · 酒庄
          </Link>
          <Link href="/trade" className="text-muted-foreground hover:text-foreground">
            Négoce · 酒商
          </Link>
          <LocaleSwitcher />
        </div>
      </div>
    </nav>
  );
}
