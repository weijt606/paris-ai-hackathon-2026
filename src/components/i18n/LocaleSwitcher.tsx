"use client";

import { useI18n } from "@/lib/i18n/Provider";
import { LOCALES } from "@/lib/i18n/dict";
import { cn } from "@/lib/utils";

export function LocaleSwitcher() {
  const { locale, setLocale } = useI18n();
  return (
    <div className="inline-flex rounded-md border bg-background p-0.5 text-xs">
      {LOCALES.map((l) => (
        <button
          key={l.code}
          type="button"
          onClick={() => setLocale(l.code)}
          className={cn(
            "rounded-sm px-2 py-1 transition",
            locale === l.code
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:bg-muted",
          )}
        >
          {l.short}
        </button>
      ))}
    </div>
  );
}
