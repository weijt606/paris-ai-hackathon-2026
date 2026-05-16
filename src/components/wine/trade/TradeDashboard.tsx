"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n/Provider";
import { BordeauxMap } from "@/components/wine/trade/BordeauxMap";
import { ExecutiveSummary } from "@/components/wine/ExecutiveSummary";
import { RiskCard } from "@/components/wine/RiskCard";
import { TerroirCard } from "@/components/wine/TerroirCard";
import { DriverDonutChart } from "@/components/wine/charts/DriverDonutChart";
import { WeatherLineChart } from "@/components/wine/charts/WeatherLineChart";
import { RegionalRiskChart } from "@/components/wine/charts/RegionalRiskChart";
import { SentimentDonut } from "@/components/wine/charts/SentimentDonut";
import { ExportButton } from "@/components/wine/shared/ExportButton";
import { SubscribeDialog } from "@/components/wine/shared/SubscribeDialog";
import { TimeframePicker } from "@/components/wine/shared/TimeframePicker";
import { WorkflowTrace } from "@/components/wine/shared/WorkflowTrace";
import { useAnalysisFlow } from "@/lib/hooks/useAnalysisFlow";
import { BORDEAUX_BENCHMARKS } from "@/lib/wine/bordeaux-benchmarks";
import type { AnalyzeInput, Timeframe } from "@/lib/wine/types";

function defaultTimeframe(): Timeframe {
  const year = new Date().getFullYear();
  return { start: `${year}-01-01`, end: `${year}-12-31` };
}

export function TradeDashboard() {
  const t = useT();
  const first = BORDEAUX_BENCHMARKS[0]!;
  const [selected, setSelected] = useState({ id: first.id, name: first.name });
  const [chateau, setChateau] = useState<{ name: string; aoc: string } | null>(null);
  const [timeframe, setTimeframe] = useState(defaultTimeframe);
  const { workflowState, details, result, loading, error, run } = useAnalysisFlow();

  function handleRun() {
    const body: AnalyzeInput = {
      region: { id: selected.id, name: selected.name, parent: "bordeaux" },
      timeframe,
      persona: "trade",
      chateau: chateau?.name,
    };
    void run(body);
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
          <ExportButton
            reportMarkdown={result?.feature?.reportMarkdown}
            filename={`wine-signals-${selected.id}.md`}
          />
          <SubscribeDialog
            regionId={selected.id}
            persona="trade"
            digestPreview={result?.feature?.emailDigest}
          />
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-[420px_1fr]">
        <aside className="space-y-6">
          <BordeauxMap
            selectedId={selected.id}
            onSelect={(id, name) => setSelected({ id, name })}
            selectedChateau={chateau?.name ?? null}
            onChateauSelect={setChateau}
          />

          <div className="rounded-md border p-4 print:hidden">
            <TimeframePicker value={timeframe} onChange={setTimeframe} />

            {chateau && (
              <div className="mt-4 flex items-center justify-between gap-3 rounded-sm border bg-muted/40 px-3 py-2">
                <div className="min-w-0">
                  <p className="text-[9px] uppercase tracking-luxe text-muted-foreground">
                    Focus château
                  </p>
                  <p className="truncate text-sm font-medium">{chateau.name}</p>
                  <p className="text-[10px] text-muted-foreground">{chateau.aoc}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setChateau(null)}
                  className="shrink-0 text-[10px] uppercase tracking-luxe text-muted-foreground hover:text-foreground"
                  aria-label="Clear château selection"
                >
                  ×
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={handleRun}
              disabled={loading}
              className="mt-4 w-full rounded-sm bg-primary px-4 py-3 text-[11px] uppercase tracking-luxe text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading
                ? t("common.running")
                : `${t("common.run_analysis")} · ${chateau ? chateau.name : selected.name}`}
            </button>
            {error && (
              <div className="mt-3 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
          </div>

          <WorkflowTrace state={workflowState} details={details} />
        </aside>

        <section className="space-y-8">
          {result ? (
            <>
              {result.feature?.executiveSummary && (
                <ExecutiveSummary text={result.feature.executiveSummary} />
              )}
              <RiskCard result={result} />
              {result.geoSnapshot && <TerroirCard snapshot={result.geoSnapshot} />}
              <DriverDonutChart drivers={result.drivers} />
              <WeatherLineChart regionId={result.region.id} />
              <div className="grid gap-6 md:grid-cols-2">
                <RegionalRiskChart selectedId={result.region.id} />
                <SentimentDonut regionId={result.region.id} />
              </div>
            </>
          ) : (
            <div className="space-y-6">
              <div className="rounded-xl border border-dashed p-8 text-center">
                <p className="text-sm text-muted-foreground">{t("trade.no_result")}</p>
              </div>
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
