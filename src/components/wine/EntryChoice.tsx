"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n/Provider";

export function EntryChoice() {
  const t = useT();
  return (
    <main className="container mx-auto max-w-5xl px-6 py-16">
      <header className="mb-16 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
          {t("common.app_name")}
        </p>
        <h1 className="mt-3 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
          {t("landing.tagline")}
        </h1>
        <p className="mt-6 text-sm uppercase tracking-widest text-muted-foreground">
          {t("landing.choose_entry")}
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <EntryCard
          href="/vineyard"
          emoji="🍇"
          title={t("landing.vineyard.title")}
          subtitle={t("landing.vineyard.subtitle")}
          cta={t("landing.vineyard.cta")}
        />
        <EntryCard
          href="/trade"
          emoji="🛒"
          title={t("landing.trade.title")}
          subtitle={t("landing.trade.subtitle")}
          cta={t("landing.trade.cta")}
        />
      </div>
    </main>
  );
}

function EntryCard({
  href,
  emoji,
  title,
  subtitle,
  cta,
}: {
  href: string;
  emoji: string;
  title: string;
  subtitle: string;
  cta: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col rounded-2xl border bg-card p-8 transition hover:border-foreground hover:shadow-lg"
    >
      <span className="text-5xl">{emoji}</span>
      <h2 className="mt-6 text-2xl font-semibold tracking-tight">{title}</h2>
      <p className="mt-3 flex-1 text-sm text-muted-foreground">{subtitle}</p>
      <span className="mt-8 inline-flex items-center gap-1 text-sm font-medium text-foreground">
        {cta}
        <span className="transition group-hover:translate-x-1">→</span>
      </span>
    </Link>
  );
}
