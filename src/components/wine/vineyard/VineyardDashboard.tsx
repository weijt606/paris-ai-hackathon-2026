"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n/Provider";
import { RegionPicker } from "@/components/wine/RegionPicker";
import { RiskCard } from "@/components/wine/RiskCard";
import { SignalsList } from "@/components/wine/SignalsList";
import { UploadArea } from "@/components/wine/vineyard/UploadArea";
import { DriverBarChart } from "@/components/wine/charts/DriverBarChart";
import { WeatherLineChart } from "@/components/wine/charts/WeatherLineChart";
import { ExportButton } from "@/components/wine/shared/ExportButton";
import { SubscribeDialog } from "@/components/wine/shared/SubscribeDialog";
import { REGIONS } from "@/lib/wine/regions";
import type { AnalyzeInput, AnalyzeResult, Region, UploadMeta } from "@/lib/wine/types";

function defaultTimeframe() {
  const now = new Date();
  const start = now.toISOString().slice(0, 10);
  const end = new Date(now.getTime() + 90 * 24 * 3600 * 1000).toISOString().slice(0, 10);
  return { start, end };
}

export function VineyardDashboard() {
  const t = useT();
  const first = REGIONS[0]!;
  const [region, setRegion] = useState<Pick<Region, "id" | "name" | "parent">>({
    id: first.id,
    name: first.name,
    parent: first.parent,
  });
  const [timeframe, setTimeframe] = useState(defaultTimeframe);
  const [question, setQuestion] = useState("");
  const [uploads, setUploads] = useState<UploadMeta[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeResult | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const body: AnalyzeInput = {
        region,
        timeframe,
        persona: "vineyard",
        question: question.trim() || undefined,
        uploads: uploads.length > 0 ? uploads : undefined,
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
    <main className="container mx-auto max-w-6xl px-6 py-8">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4 print:mb-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            🍇 {t("persona.vineyard")}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">{t("vineyard.title")}</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            {t("vineyard.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2 print:hidden">
          <ExportButton />
          <SubscribeDialog regionId={region.id} persona="vineyard" />
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
        <aside className="space-y-6 print:hidden">
          <RegionPicker value={region.id} onChange={setRegion} />

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

          <UploadArea uploads={uploads} onChange={setUploads} />

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
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
            onClick={run}
            disabled={loading}
            className="w-full rounded-md bg-foreground px-4 py-2.5 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50"
          >
            {loading ? t("common.running") : t("common.run_analysis")}
          </button>

          {error && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
        </aside>

        <section className="space-y-6">
          {result ? (
            <>
              <RiskCard result={result} />
              <div className="grid gap-6 md:grid-cols-2">
                <DriverBarChart drivers={result.drivers} />
                <WeatherLineChart regionId={result.region.id} />
              </div>
              <div>
                <h3 className="mb-3 text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  {t("result.trace")}
                </h3>
                <SignalsList trace={result.trace} />
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-dashed p-12 text-center">
              <p className="text-sm text-muted-foreground">
                {t("vineyard.subtitle")}
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
