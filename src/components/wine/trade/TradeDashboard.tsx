"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n/Provider";
import { BordeauxMap } from "@/components/wine/trade/BordeauxMap";
import { RiskCard } from "@/components/wine/RiskCard";
import { SignalsList } from "@/components/wine/SignalsList";
import { DriverBarChart } from "@/components/wine/charts/DriverBarChart";
import { WeatherLineChart } from "@/components/wine/charts/WeatherLineChart";
import { RegionalRiskChart } from "@/components/wine/charts/RegionalRiskChart";
import { SentimentDonut } from "@/components/wine/charts/SentimentDonut";
import { ExportButton } from "@/components/wine/shared/ExportButton";
import { SubscribeDialog } from "@/components/wine/shared/SubscribeDialog";
import { TimeframePicker } from "@/components/wine/shared/TimeframePicker";
import { BORDEAUX_BENCHMARKS } from "@/lib/wine/bordeaux-benchmarks";
import type { AnalyzeInput, AnalyzeResult, Timeframe } from "@/lib/wine/types";

function defaultTimeframe(): Timeframe {
  // Default: current calendar (natural) year forecast.
  const year = new Date().getFullYear();
  return { start: `${year}-01-01`, end: `${year}-12-31` };
}

export function TradeDashboard() {
  const t = useT();
  const first = BORDEAUX_BENCHMARKS[0]!;
  const [selected, setSelected] = useState({ id: first.id, name: first.name });
  const [timeframe, setTimeframe] = useState(defaultTimeframe);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeResult | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const body: AnalyzeInput = {
        region: { id: selected.id, name: selected.name, parent: "bordeaux" },
        timeframe,
        persona: "trade",
      };
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: unknown };
        throw new Error(typeof j.error === "string" ? j.error : `HTTP ${res.status}`);
      }
      setResult((await res.json()) as AnalyzeResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container mx-auto max-w-7xl px-6 py-12">
      <header className="mb-12 flex flex-wrap items-end justify-between gap-6 border-b pb-8 print:mb-4">
        <div>
          <p className="text-[10px] uppercase tracking-luxe text-muted-foreground">
            {t("persona.trade")}
          </p>
          <h1 className="mt-3 font-serif text-4xl font-medium leading-tight tracking-tight md:text-5xl">
            {t("trade.title")}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {t("trade.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2 print:hidden">
          <ExportButton />
          <SubscribeDialog regionId={selected.id} persona="trade" />
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <aside className="space-y-4">
          <BordeauxMap
            selectedId={selected.id}
            onSelect={(id, name) => setSelected({ id, name })}
          />

          <div className="rounded-xl border p-4 print:hidden">
            <TimeframePicker value={timeframe} onChange={setTimeframe} />
            <button
              type="button"
              onClick={run}
              disabled={loading}
              className="mt-4 w-full rounded-sm bg-primary px-4 py-3 text-[11px] uppercase tracking-luxe text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading
                ? t("common.running")
                : `${t("common.run_analysis")} · ${selected.name}`}
            </button>
            {error && (
              <div className="mt-3 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
          </div>
        </aside>

        <section className="space-y-6">
          {result ? (
            <>
              <RiskCard result={result} />
              <div className="grid gap-6 md:grid-cols-2">
                <DriverBarChart drivers={result.drivers} />
                <WeatherLineChart regionId={result.region.id} />
                <RegionalRiskChart selectedId={result.region.id} />
                <SentimentDonut regionId={result.region.id} />
              </div>
              <div>
                <h3 className="mb-3 text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  {t("result.trace")}
                </h3>
                <SignalsList trace={result.trace} />
              </div>
            </>
          ) : (
            <div className="space-y-6">
              <div className="rounded-xl border border-dashed p-8 text-center">
                <p className="text-sm text-muted-foreground">{t("trade.no_result")}</p>
              </div>
              {/* Show the regional comparison + sentiment even before analyze */}
              <div className="grid gap-6 md:grid-cols-2">
                <RegionalRiskChart selectedId={selected.id} />
                <SentimentDonut regionId={selected.id} />
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
