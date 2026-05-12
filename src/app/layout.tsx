import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Paris AI Hackathon 2026",
  description:
    "Team scaffold for the Paris AI Hackathon 2026 — single-day sprint, sponsor adapters pre-wired.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">{children}</body>
    </html>
  );
}
