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
    <html
      lang="en"
      className={`dark ${sans.variable} ${serif.variable}`}
      suppressHydrationWarning
    >
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
    <nav className="glass sticky top-0 z-40 print:hidden">
      <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-7">
        <Link href="/" aria-label="Wine Signals" className="group inline-flex items-center gap-3">
          <span className="grid h-7 w-7 place-items-center">
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[22px] w-[22px] fill-none stroke-current transition-transform duration-500 group-hover:rotate-90" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 3v6c0 2.2 1.8 4 4 4s4-1.8 4-4V3" />
              <path d="M12 13v8" />
              <path d="M9 21h6" />
              <path d="M8 3h8" />
            </svg>
          </span>
          <span className="text-sm font-bold tracking-[0.04em]">Wine Signals</span>
          <span className="kicker ml-1">Atlas</span>
        </Link>
        <div className="flex items-center gap-2">
          <NavLink href="/vineyard">Vineyard</NavLink>
          <NavLink href="/trade">Trade</NavLink>
          <NavLink href="/blog">Blog</NavLink>
          <span className="mx-2 h-4 w-px bg-line" />
          <LocaleSwitcher />
        </div>
      </div>
    </nav>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="chip">
      {children}
    </Link>
  );
}
