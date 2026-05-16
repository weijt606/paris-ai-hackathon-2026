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

// Same client-only Leaflet trick as the trade dashboard — Leaflet touches
// window/document at import time.
const BordeauxMap = dynamic(
  () =>
    import("@/components/wine/trade/BordeauxMap").then((m) => m.BordeauxMap),
  {
    ssr: false,
    loading: () => (
      <div className="aspect-[5/4] w-full animate-pulse rounded-md border bg-muted/40" />
    ),
  },
);
import { DriverDonutChart } from "@/components/wine/charts/DriverDonutChart";
import { WeatherLineChart } from "@/components/wine/charts/WeatherLineChart";
import { ExportButton } from "@/components/wine/shared/ExportButton";
import { SubscribeDialog } from "@/components/wine/shared/SubscribeDialog";
import { TimeframePicker } from "@/components/wine/shared/TimeframePicker";
import { WorkflowTrace } from "@/components/wine/shared/WorkflowTrace";
import { useAnalysisFlow } from "@/lib/hooks/useAnalysisFlow";
import { REGIONS } from "@/lib/wine/regions";
import type { AnalyzeInput, Region, Timeframe, UploadMeta } from "@/lib/wine/types";

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

  return (
    <main className="container mx-auto max-w-6xl px-6 py-12">
      <header className="mb-12 flex flex-wrap items-end justify-between gap-6 border-b pb-8 print:mb-4">
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

      <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
        <aside className="space-y-6 print:hidden">
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
          <RegionPicker value={region.id} onChange={setRegion} />
          <TimeframePicker value={timeframe} onChange={setTimeframe} />
          <UploadArea uploads={uploads} onChange={setUploads} />

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-[10px] uppercase tracking-luxe text-muted-foreground">
              {t("common.question_placeholder").split("：")[0] ??
                t("common.question_placeholder")}
            </span>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={3}
              placeholder={t("common.question_placeholder")}
              className="rounded-md border bg-background px-3 py-2 text-sm"
            />
          </label>

          <button
            type="button"
            onClick={handleRun}
            disabled={loading}
            className="w-full rounded-sm bg-primary px-4 py-3 text-[11px] uppercase tracking-luxe text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? t("common.running") : t("common.run_analysis")}
          </button>

          {error && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Agent workflow visualisation lives in the sidebar so the user
              sees the agents fire as soon as Run is clicked. */}
          <WorkflowTrace
            state={workflowState}
            details={details}
            hasUploads={uploads.length > 0}
          />
        </aside>

        <section className="space-y-8">
          {result ? (
            <>
              {result.feature?.executiveSummary && (
                <ExecutiveSummary text={result.feature.executiveSummary} />
              )}
              {result.backtest && <BacktestCard backtest={result.backtest} />}
              <RiskCard result={result} />
              {result.geoSnapshot && <TerroirCard snapshot={result.geoSnapshot} />}
              <DriverDonutChart drivers={result.drivers} />
              <WeatherLineChart regionId={result.region.id} />
            </>
          ) : (
            <div className="rounded-xl border border-dashed p-12 text-center">
              <p className="text-sm text-muted-foreground">{t("vineyard.subtitle")}</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
