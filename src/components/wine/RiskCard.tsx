"use client";

import { cn } from "@/lib/utils";
import { useAnimatedNumber } from "@/lib/hooks/useAnimatedNumber";
import { useT } from "@/lib/i18n/Provider";
import { RiskBandLegend } from "@/components/wine/RiskBandLegend";
import type { AnalyzeResult, RiskBand } from "@/lib/wine/types";

const BAND_STYLES: Record<RiskBand, string> = {
  low: "border-emerald-700/30 text-emerald-800 dark:text-emerald-200",
  moderate: "border-amber-700/30 text-amber-800 dark:text-amber-200",
  elevated: "border-orange-700/30 text-orange-800 dark:text-orange-200",
  high: "border-red-800/40 text-red-900 dark:text-red-200",
};

const BAND_LABEL_KEY: Record<RiskBand, `result.band.${RiskBand}`> = {
  low: "result.band.low",
  moderate: "result.band.moderate",
  elevated: "result.band.elevated",
  high: "result.band.high",
};

export function RiskCard({ result }: { result: AnalyzeResult }) {
  const t = useT();
  const animated = useAnimatedNumber(result.riskScore);

  return (
    <article className="rounded-md border bg-card p-8">
      <header className="flex items-start justify-between gap-6">
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-luxe text-muted-foreground">
            {t("result.risk_score")}
          </p>
          <p
            className="font-serif text-7xl font-medium leading-none tabular-nums"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {Math.round(animated)}
          </p>
        </div>
        <span
          className={cn(
            "rounded-full border bg-background px-3 py-1 text-[10px] uppercase tracking-luxe",
            BAND_STYLES[result.riskBand],
          )}
        >
          {t(BAND_LABEL_KEY[result.riskBand])}
        </span>
      </header>

      <RiskBandLegend score={result.riskScore} band={result.riskBand} />

      {result.drivers.length > 0 && (
        <section className="mt-10">
          <p className="mb-4 text-[10px] uppercase tracking-luxe text-muted-foreground">
            {t("result.drivers")}
          </p>
          <ul className="divide-y divide-border/60">
            {result.drivers.map((d, i) => (
              <li key={i} className="flex items-start gap-4 py-3 text-sm">
                <span className="mt-0.5 inline-block min-w-[64px] text-[10px] uppercase tracking-wide text-muted-foreground">
                  {d.source}
                </span>
                <span className="flex-1 leading-relaxed">{d.signal}</span>
                <span className="font-mono text-xs tabular-nums text-muted-foreground">
                  {(d.weight * 100).toFixed(0)}%
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {result.recommendations.length > 0 && (
        <section className="mt-10">
          <p className="mb-4 text-[10px] uppercase tracking-luxe text-muted-foreground">
            {t("result.recommendations")} · {t(`persona.${result.persona}` as const)}
          </p>
          <ul className="space-y-3">
            {result.recommendations.map((r, i) => (
              <li
                key={i}
                className="rounded-md border border-border/70 bg-background/50 p-4 text-sm leading-relaxed"
              >
                <p>{r.action}</p>
                {r.evidence && (
                  <p className="mt-2 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                    ↳ {r.evidence}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {result.isDemoOrPartial && (
        <p className="mt-8 text-[11px] italic text-muted-foreground">
          {t("result.partial")}
        </p>
      )}
    </article>
  );
}
