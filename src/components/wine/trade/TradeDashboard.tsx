"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useT } from "@/lib/i18n/Provider";
import { BacktestCard } from "@/components/wine/BacktestCard";
import { ExecutiveSummary } from "@/components/wine/ExecutiveSummary";
import { FullReportCard } from "@/components/wine/FullReportCard";
import { RegionPicker } from "@/components/wine/RegionPicker";
import { RiskCard } from "@/components/wine/RiskCard";
import { TerroirCard } from "@/components/wine/TerroirCard";
import { DriverDonutChart } from "@/components/wine/charts/DriverDonutChart";
import { WeatherLineChart } from "@/components/wine/charts/WeatherLineChart";
import { RegionalRiskChart } from "@/components/wine/charts/RegionalRiskChart";
import { SentimentDonut } from "@/components/wine/charts/SentimentDonut";
import { ExportButton } from "@/components/wine/shared/ExportButton";
import { SubscribeDialog } from "@/components/wine/shared/SubscribeDialog";
import { TimeframePicker } from "@/components/wine/shared/TimeframePicker";
import { RunOverlay } from "@/components/wine/shared/RunOverlay";
import { ProductPicker } from "@/components/wine/trade/ProductPicker";
import { TradePersonaTabs } from "@/components/wine/trade/TradePersonaTabs";
import { useAnalysisFlow } from "@/lib/hooks/useAnalysisFlow";
import { BORDEAUX_BENCHMARKS } from "@/lib/wine/bordeaux-benchmarks";
import type { Product } from "@/lib/wine/products";
import type { AnalyzeInput, Region, Timeframe, TradePersona } from "@/lib/wine/types";

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

/**
 * Which cards each trade sub-persona sees in the result cascade. The
 * underlying analysis runs the full agent stack regardless; we just gate
 * the visible cards so each persona reads as its own focused workflow.
 *
 *   merchant   — full breadth (en-primeur buyer wants everything)
 *   restaurant — exec + backtest + risk + drivers (sommelier wants verdict + why)
 *   wineshop   — exec + risk + drivers + regional/sentiment (retail wants comparison)
 */
const PERSONA_CARDS: Record<TradePersona, ReadonlySet<string>> = {
  merchant: new Set(["executive", "backtest", "risk", "terroir", "drivers", "weather", "regional-sentiment", "report"]),
  restaurant: new Set(["executive", "backtest", "risk", "drivers", "report"]),
  wineshop: new Set(["executive", "risk", "drivers", "regional-sentiment", "report"]),
};

export function TradeDashboard() {
  const t = useT();
  const first = BORDEAUX_BENCHMARKS[0]!;
  const [selected, setSelected] = useState<Pick<Region, "id" | "name" | "parent">>(
    { id: first.id, name: first.name, parent: "bordeaux" },
  );
  const [chateau, setChateau] = useState<{ name: string; aoc: string } | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [timeframe, setTimeframe] = useState(defaultTimeframe);
  const [tradePersona, setTradePersona] = useState<TradePersona>("merchant");
  // Whether the user has clicked "View report" since the last run. Drives
  // the RunOverlay's lifecycle: it stays open in completion state until
  // the user clicks through.
  const [reportShown, setReportShown] = useState(true);
  const { workflowState, details, result, loading, error, run } = useAnalysisFlow();

  function handleRun() {
    setReportShown(false);
    const body: AnalyzeInput = {
      region: { id: selected.id, name: selected.name, parent: selected.parent },
      timeframe,
      persona: "trade",
      tradePersona,
      chateau: chateau?.name,
    };
    void run(body);
  }

  function onProductPick(p: Product | null) {
    setProduct(p);
    if (!p) return;
    setSelected({ id: p.region.id, name: p.region.name, parent: p.region.parent });
    if (p.chateau) {
      setChateau({ name: p.chateau.name, aoc: p.chateau.aoc });
    } else {
      setChateau(null);
    }
  }

  const visibleCardIds = PERSONA_CARDS[tradePersona];

  const allCards: Array<{ id: string; node: React.ReactNode }> = [];
  if (result) {
    if (result.feature?.executiveSummary)
      allCards.push({
        id: "executive",
        node: <ExecutiveSummary text={result.feature.executiveSummary} />,
      });
    if (result.backtest)
      allCards.push({ id: "backtest", node: <BacktestCard backtest={result.backtest} /> });
    allCards.push({ id: "risk", node: <RiskCard result={result} /> });
    if (result.feature?.reportMarkdown)
      allCards.push({
        id: "report",
        node: <FullReportCard markdown={result.feature.reportMarkdown} />,
      });
    if (result.geoSnapshot)
      allCards.push({ id: "terroir", node: <TerroirCard snapshot={result.geoSnapshot} /> });
    allCards.push({ id: "drivers", node: <DriverDonutChart drivers={result.drivers} /> });
    allCards.push({
      id: "weather",
      node: <WeatherLineChart regionId={result.region.id} />,
    });
    allCards.push({
      id: "regional-sentiment",
      node: (
        <div className="grid gap-6 md:grid-cols-2">
          <RegionalRiskChart selectedId={result.region.id} />
          <SentimentDonut regionId={result.region.id} />
        </div>
      ),
    });
  }

  const resultCards = allCards.filter((c) => visibleCardIds.has(c.id));

  return (
    <main className="container mx-auto max-w-6xl px-6 py-12">
      <header className="mb-10 flex flex-wrap items-end justify-between gap-6 border-b pb-8 print:mb-4 animate-fade-in">
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
            filename={`wine-signals-${selected.id}-${tradePersona}.md`}
          />
          <SubscribeDialog
            regionId={selected.id}
            persona="trade"
            digestPreview={result?.feature?.emailDigest}
          />
        </div>
      </header>

      {/* Persona segmented switcher */}
      <section className="mb-6 flex items-center gap-4 print:hidden animate-fade-in">
        <span className="text-[10px] uppercase tracking-luxe text-muted-foreground">
          {t("trade.persona.label")}
        </span>
        <TradePersonaTabs value={tradePersona} onChange={setTradePersona} />
      </section>

      {/* Controls — top section */}
      <section className="mb-10 rounded-md border bg-card p-8 print:hidden animate-fade-in-up">
        <div className="grid gap-6 md:grid-cols-2">
          <RegionPicker
            value={selected.id}
            onChange={(r) => {
              setSelected({ id: r.id, name: r.name, parent: r.parent });
              // Region change → clear chateau + product (their pointer to the
              // previous region is no longer valid).
              setChateau(null);
              setProduct(null);
            }}
          />
          <ProductPicker value={product?.id ?? null} onChange={onProductPick} />
        </div>

        <div className="mt-6 max-w-md">
          <TimeframePicker value={timeframe} onChange={setTimeframe} />
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t pt-6 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            {chateau ? (
              <div className="flex items-center gap-3">
                <span className="text-[10px] uppercase tracking-luxe text-muted-foreground">
                  {t("trade.focus_chateau")}
                </span>
                <span className="truncate text-sm font-medium">{chateau.name}</span>
                <span className="text-[10px] text-muted-foreground">{chateau.aoc}</span>
                <button
                  type="button"
                  onClick={() => {
                    setChateau(null);
                    setProduct(null);
                  }}
                  className="text-[10px] uppercase tracking-luxe text-muted-foreground hover:text-foreground"
                  aria-label={t("common.clear")}
                >
                  ×
                </button>
              </div>
            ) : (
              <p className="text-[10px] uppercase tracking-luxe text-muted-foreground">
                {selected.name}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={handleRun}
            disabled={loading}
            className="h-11 shrink-0 rounded-sm bg-primary px-8 text-[11px] uppercase tracking-luxe text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? t("common.running") : t("common.run_analysis")}
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-sm border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
      </section>

      {/* Map — wide, prominent */}
      <section className="mb-12 animate-fade-in-up" style={{ animationDelay: "120ms" }}>
        <BordeauxMap
          selectedChateau={chateau?.name ?? null}
          onChateauSelect={(c) => {
            if (c) {
              setChateau({ name: c.name, aoc: c.aoc });
              setSelected({ id: c.regionId, name: c.regionName, parent: "bordeaux" });
              setProduct(null);
            } else {
              setChateau(null);
            }
          }}
        />
      </section>

      {/* Run-time overlay — stays open in completion state until the user
          clicks "View report". Hides itself after the click. */}
      <RunOverlay
        open={loading || (!!result && !reportShown)}
        loading={loading}
        state={workflowState}
        details={details}
        onContinue={() => setReportShown(true)}
      />

      {/* Results — persona-filtered, progressive reveal cascade */}
      {result && reportShown ? (
        <section className="space-y-8">
          {resultCards.map((card, i) => (
            <div
              key={`${result.generatedAt}-${tradePersona}-${card.id}`}
              className="animate-fade-in-up"
              style={{ animationDelay: `${i * 140}ms` }}
            >
              {card.node}
            </div>
          ))}
        </section>
      ) : (
        !loading && !result && (
          <section className="rounded-xl border border-dashed p-12 text-center animate-fade-in">
            <p className="text-sm text-muted-foreground">{t("trade.no_result")}</p>
          </section>
        )
      )}
    </main>
  );
}
