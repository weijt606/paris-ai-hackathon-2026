"use client";

import { useState } from "react";
import { PersonaToggle } from "@/components/wine/PersonaToggle";
import { RegionPicker } from "@/components/wine/RegionPicker";
import { RiskCard } from "@/components/wine/RiskCard";
import { SignalsList } from "@/components/wine/SignalsList";
import { REGIONS } from "@/lib/wine/regions";
import type { AnalyzeInput, AnalyzeResult, Persona, Region } from "@/lib/wine/types";

function defaultTimeframe() {
  const now = new Date();
  const start = now.toISOString().slice(0, 10);
  const end = new Date(now.getTime() + 90 * 24 * 3600 * 1000).toISOString().slice(0, 10);
  return { start, end };
}

export function AnalyzePanel() {
  const firstRegion = REGIONS[0]!;
  const [region, setRegion] = useState<Pick<Region, "id" | "name" | "parent">>({
    id: firstRegion.id,
    name: firstRegion.name,
    parent: firstRegion.parent,
  });
  const [persona, setPersona] = useState<Persona>("vineyard");
  const [timeframe, setTimeframe] = useState(defaultTimeframe);
  const [question, setQuestion] = useState("");
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
        persona,
        question: question.trim() || undefined,
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
      const json = (await res.json()) as AnalyzeResult;
      setResult(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
      <aside className="space-y-6">
        <PersonaToggle value={persona} onChange={setPersona} />

        <RegionPicker value={region.id} onChange={setRegion} />

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">Start</span>
            <input
              type="date"
              value={timeframe.start}
              onChange={(e) => setTimeframe((t) => ({ ...t, start: e.target.value }))}
              className="rounded-md border bg-background px-3 py-2 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">End</span>
            <input
              type="date"
              value={timeframe.end}
              onChange={(e) => setTimeframe((t) => ({ ...t, end: e.target.value }))}
              className="rounded-md border bg-background px-3 py-2 text-sm"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">
            Question (optional)
          </span>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={3}
            placeholder="e.g. focus on frost risk in April"
            className="rounded-md border bg-background px-3 py-2 text-sm"
          />
        </label>

        <button
          type="button"
          onClick={run}
          disabled={loading}
          className="w-full rounded-md bg-foreground px-4 py-2.5 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Running orchestrator…" : "Run analysis"}
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
            <div>
              <h3 className="mb-3 text-sm font-medium uppercase tracking-widest text-muted-foreground">
                Agent trace
              </h3>
              <SignalsList trace={result.trace} />
            </div>
          </>
        ) : (
          <div className="rounded-xl border border-dashed p-12 text-center">
            <p className="text-sm text-muted-foreground">
              Pick a region + persona, then run analysis.
              <br />
              Orchestrator: Claude tool-use loop · 3 sub-agents · extraction · feature.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
