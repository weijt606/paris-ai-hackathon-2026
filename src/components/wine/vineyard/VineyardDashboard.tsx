"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useT } from "@/lib/i18n/Provider";
import { BacktestCard } from "@/components/wine/BacktestCard";
import { ExecutiveSummary } from "@/components/wine/ExecutiveSummary";
import { RegionPicker } from "@/components/wine/RegionPicker";
import { RiskCard } from "@/components/wine/RiskCard";
import { TerroirCard } from "@/components/wine/TerroirCard";
import { UploadArea } from "@/components/wine/vineyard/UploadArea";
import { DriverDonutChart } from "@/components/wine/charts/DriverDonutChart";
import { WeatherLineChart } from "@/components/wine/charts/WeatherLineChart";
import { ExportButton } from "@/components/wine/shared/ExportButton";
import { SubscribeDialog } from "@/components/wine/shared/SubscribeDialog";
import { TimeframePicker } from "@/components/wine/shared/TimeframePicker";
import { RunOverlay } from "@/components/wine/shared/RunOverlay";
import { useAnalysisFlow } from "@/lib/hooks/useAnalysisFlow";
import { REGIONS } from "@/lib/wine/regions";
import type { AnalyzeInput, Region, Timeframe, UploadMeta } from "@/lib/wine/types";

const BordeauxMap = dynamic(
  () => import("@/components/wine/trade/BordeauxMap").then((m) => m.BordeauxMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-[420px] w-full animate-pulse rounded-md border bg-muted/40 md:h-[520px]" />
    ),
  },
);

function defaultTimeframe(): Timeframe {
  const year = new Date().getFullYear();
  return { start: `${year}-01-01`, end: `${year}-12-31` };
}

export function VineyardDashboard() {
  const t = useT();
  const first = REGIONS[0]!;
  const [region, setRegion] = useState<Pick<Region, "id" | "name" | "parent">>({
    id: first.id,
    name: first.name,
    parent: first.parent,
  });
  const [chateau, setChateau] = useState<{ name: string; aoc: string } | null>(null);
  const [timeframe, setTimeframe] = useState(defaultTimeframe);
  const [question, setQuestion] = useState("");
  const [uploads, setUploads] = useState<UploadMeta[]>([]);
  const { workflowState, details, result, loading, error, run } = useAnalysisFlow();

  function handleRun() {
    const body: AnalyzeInput = {
      region,
      timeframe,
      persona: "vineyard",
      question: question.trim() || undefined,
      uploads: uploads.length > 0 ? uploads : undefined,
      chateau: chateau?.name,
    };
    void run(body);
  }

  const resultCards: Array<{ id: string; node: React.ReactNode }> = [];
  if (result) {
    if (result.feature?.executiveSummary)
      resultCards.push({
        id: "executive",
        node: <ExecutiveSummary text={result.feature.executiveSummary} />,
      });
    if (result.backtest)
      resultCards.push({ id: "backtest", node: <BacktestCard backtest={result.backtest} /> });
    resultCards.push({ id: "risk", node: <RiskCard result={result} /> });
    if (result.geoSnapshot)
      resultCards.push({ id: "terroir", node: <TerroirCard snapshot={result.geoSnapshot} /> });
    resultCards.push({ id: "drivers", node: <DriverDonutChart drivers={result.drivers} /> });
    resultCards.push({
      id: "weather",
      node: <WeatherLineChart regionId={result.region.id} />,
    });
  }

  return (
    <main className="container mx-auto max-w-6xl px-6 py-12">
      <header className="mb-10 flex flex-wrap items-end justify-between gap-6 border-b pb-8 print:mb-4 animate-fade-in">
        <div>
          <p className="text-[10px] uppercase tracking-luxe text-muted-foreground">
            {t("persona.vineyard")}
          </p>
          <h1 className="mt-3 font-serif text-4xl font-medium leading-tight tracking-tight md:text-5xl">
            {t("vineyard.title")}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {t("vineyard.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2 print:hidden">
          <ExportButton
            reportMarkdown={result?.feature?.reportMarkdown}
            filename={`wine-signals-${region.id}.md`}
          />
          <SubscribeDialog
            regionId={region.id}
            persona="vineyard"
            digestPreview={result?.feature?.emailDigest}
          />
        </div>
      </header>

      {/* Controls — top section */}
      <section className="mb-10 rounded-md border bg-card p-6 print:hidden space-y-6 animate-fade-in-up">
        <div className="grid gap-5 md:grid-cols-2">
          <RegionPicker value={region.id} onChange={setRegion} />
          <TimeframePicker value={timeframe} onChange={setTimeframe} />
        </div>

        <UploadArea uploads={uploads} onChange={setUploads} />

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-[10px] uppercase tracking-luxe text-muted-foreground">
            {t("common.question_placeholder").split(":")[0] ?? t("common.question_placeholder")}
          </span>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={2}
            placeholder={t("common.question_placeholder")}
            className="rounded-md border bg-background px-3 py-2 text-sm"
          />
        </label>

        {chateau && (
          <div className="flex items-center gap-3 rounded-sm border bg-muted/40 px-3 py-2">
            <div className="min-w-0 flex-1">
              <p className="text-[9px] uppercase tracking-luxe text-muted-foreground">
                {t("trade.focus_chateau")}
              </p>
              <p className="truncate text-sm font-medium">{chateau.name}</p>
              <p className="text-[10px] text-muted-foreground">{chateau.aoc}</p>
            </div>
            <button
              type="button"
              onClick={() => setChateau(null)}
              className="text-[10px] uppercase tracking-luxe text-muted-foreground hover:text-foreground"
              aria-label={t("common.clear")}
            >
              ×
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={handleRun}
          disabled={loading}
          className="w-full rounded-sm bg-primary px-6 py-3 text-[11px] uppercase tracking-luxe text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading
            ? t("common.running")
            : `${t("common.run_analysis")} · ${chateau ? chateau.name : region.name}`}
        </button>

        {error && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
      </section>

      {/* Map — wide */}
      <section className="mb-12 animate-fade-in-up" style={{ animationDelay: "120ms" }}>
        <BordeauxMap
          selectedChateau={chateau?.name ?? null}
          onChateauSelect={(c) => {
            if (c) {
              setChateau({ name: c.name, aoc: c.aoc });
              setRegion({ id: c.regionId, name: c.regionName, parent: "bordeaux" });
            } else {
              setChateau(null);
            }
          }}
        />
      </section>

      {/* Run-time overlay */}
      <RunOverlay open={loading} state={workflowState} details={details} />

      {/* Results — progressive cascade */}
      {result ? (
        <section className="space-y-8">
          {resultCards.map((card, i) => (
            <div
              key={`${result.generatedAt}-${card.id}`}
              className="animate-fade-in-up"
              style={{ animationDelay: `${i * 140}ms` }}
            >
              {card.node}
            </div>
          ))}
        </section>
      ) : (
        !loading && (
          <section className="rounded-xl border border-dashed p-12 text-center animate-fade-in">
            <p className="text-sm text-muted-foreground">{t("vineyard.subtitle")}</p>
          </section>
        )
      )}
    </main>
  );
}
