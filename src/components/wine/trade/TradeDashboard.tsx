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
import { BORDEAUX_BENCHMARKS } from "@/lib/wine/bordeaux-benchmarks";
import type { AnalyzeInput, AnalyzeResult } from "@/lib/wine/types";

function defaultTimeframe() {
  const now = new Date();
  const start = now.toISOString().slice(0, 10);
  const end = new Date(now.getTime() + 90 * 24 * 3600 * 1000).toISOString().slice(0, 10);
  return { start, end };
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
    <main className="container mx-auto max-w-7xl px-6 py-8">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4 print:mb-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            🛒 {t("persona.trade")}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">{t("trade.title")}</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{t("trade.subtitle")}</p>
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
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-xs uppercase tracking-wide text-muted-foreground">
                  {t("common.start_date")}
                </span>
                <input
                  type="date"
                  value={timeframe.start}
                  onChange={(e) => setTimeframe((tf) => ({ ...tf, start: e.target.value }))}
                  className="rounded-md border bg-background px-3 py-2 text-sm"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-xs uppercase tracking-wide text-muted-foreground">
                  {t("common.end_date")}
                </span>
                <input
                  type="date"
                  value={timeframe.end}
                  onChange={(e) => setTimeframe((tf) => ({ ...tf, end: e.target.value }))}
                  className="rounded-md border bg-background px-3 py-2 text-sm"
                />
              </label>
            </div>
            <button
              type="button"
              onClick={run}
              disabled={loading}
              className="mt-4 w-full rounded-md bg-foreground px-4 py-2.5 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50"
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
