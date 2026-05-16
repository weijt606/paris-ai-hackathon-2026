"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { AtlasShell } from "@/components/wine/atlas/AtlasShell";
import { ChateauListSidebar } from "@/components/wine/atlas/ChateauListSidebar";
import { ChateauDetailPanel } from "@/components/wine/atlas/ChateauDetailPanel";
import { AnalysisDrawer } from "@/components/wine/atlas/AnalysisDrawer";
import { WorkflowHero } from "@/components/wine/atlas/WorkflowHero";
import { getChateauList, type ChateauPoint } from "@/lib/wine/chateau-points";
import { useAnalysisFlow } from "@/lib/hooks/useAnalysisFlow";
import { BORDEAUX_BENCHMARKS } from "@/lib/wine/bordeaux-benchmarks";
import type { AnalyzeInput, Timeframe } from "@/lib/wine/types";

// Leaflet-based map must render client-side only.
const BordeauxMap = dynamic(
  () =>
    import("@/components/wine/trade/BordeauxMap").then((m) => m.BordeauxMap),
  {
    ssr: false,
    loading: () => <div className="h-full w-full bg-surface-1" />,
  },
);

function defaultTimeframe(): Timeframe {
  const year = new Date().getFullYear();
  return { start: `${year}-01-01`, end: `${year}-12-31` };
}

export function TradeDashboard() {
  const first = BORDEAUX_BENCHMARKS[0]!;
  const [region, setRegion] = useState({ id: first.id, name: first.name });
  const [chateau, setChateau] = useState<ChateauPoint | null>(null);
  const [query, setQuery] = useState("");
  const [growthFilter, setGrowthFilter] = useState<number[]>([]);
  const [timeframe, setTimeframe] = useState(defaultTimeframe);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { workflowState, details, result, loading, error, run } = useAnalysisFlow();

  // Surface the workflow as soon as the orchestrator fires, then hand off
  // to the analysis drawer once the result lands.
  const flowActive = workflowState.orchestrator !== "pending";
  useEffect(() => {
    if (flowActive) setDrawerOpen(true);
  }, [flowActive]);

  function handleSelect(
    c: { name: string; aoc: string; regionId: string; regionName: string } | null,
  ) {
    if (!c) {
      setChateau(null);
      return;
    }
    const full = getChateauList().find((x) => x.name === c.name) ?? null;
    setChateau(full);
    setRegion({ id: c.regionId, name: c.regionName });
  }

  function handleRun() {
    if (!chateau) return;
    const body: AnalyzeInput = {
      region: { id: region.id, name: region.name, parent: "bordeaux" },
      timeframe,
      persona: "trade",
      chateau: chateau.name,
    };
    void run(body);
  }

  return (
    <AtlasShell
      drawerOpen={drawerOpen}
      onDrawerClose={() => setDrawerOpen(false)}
      drawerLabel={
        result
          ? `${result.region.name} · Analysis`
          : loading
            ? "Agents running"
            : "Analysis"
      }
      drawer={
        result ? (
          <AnalysisDrawer result={result} persona="trade" />
        ) : flowActive ? (
          <WorkflowHero
            state={workflowState}
            details={details}
            subject={chateau?.name}
          />
        ) : null
      }
      left={
        <ChateauListSidebar
          query={query}
          onQueryChange={setQuery}
          growthFilter={growthFilter}
          onGrowthFilterChange={setGrowthFilter}
          selectedName={chateau?.name ?? null}
          onSelect={handleSelect}
        />
      }
      center={
        <BordeauxMap
          selectedChateau={chateau?.name ?? null}
          onChateauSelect={(c) => {
            if (!c) {
              setChateau(null);
              return;
            }
            const full = getChateauList().find((x) => x.name === c.name) ?? null;
            setChateau(full);
            setRegion({ id: c.regionId, name: c.regionName });
          }}
          query={query}
          growthFilter={growthFilter}
        />
      }
      right={
        <ChateauDetailPanel
          chateau={chateau}
          timeframe={timeframe}
          onTimeframeChange={setTimeframe}
          onClear={() => setChateau(null)}
          onRun={handleRun}
          loading={loading}
          error={error}
          hasResult={!!result}
          onShowAnalysis={() => setDrawerOpen(true)}
        />
      }
    />
  );
}
