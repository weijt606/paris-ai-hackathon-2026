"use client";

import { useState } from "react";
import {
  INITIAL_WORKFLOW,
  type NodeDetail,
  type NodeKey,
  type WorkflowState,
} from "@/components/wine/shared/WorkflowTrace";
import type { AnalyzeInput, AnalyzeResult } from "@/lib/wine/types";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Drives the analyze flow with a workflow-style visual progression.
 *
 * The API call runs in parallel with phased state transitions so the user
 * sees the agents "wake up" in the right topology order even when the
 * backend (demo mode) responds instantly. Real-mode latency is hidden
 * inside phase 2 which awaits both the timer and the response promise.
 */
export function useAnalysisFlow() {
  const [workflowState, setWorkflowState] = useState<WorkflowState>(INITIAL_WORKFLOW);
  const [details, setDetails] = useState<Partial<Record<NodeKey, NodeDetail>>>({});
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(body: AnalyzeInput): Promise<void> {
    setLoading(true);
    setError(null);
    setResult(null);
    setDetails({});
    setWorkflowState(INITIAL_WORKFLOW);

    // Kick off API request immediately — it runs in parallel with the
    // visual animation phases below.
    const apiPromise = (async (): Promise<AnalyzeResult> => {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: unknown };
        throw new Error(typeof j.error === "string" ? j.error : `HTTP ${res.status}`);
      }
      return (await res.json()) as AnalyzeResult;
    })();

    try {
      // Phase 1 — orchestrator wakes up.
      await sleep(180);
      setWorkflowState((s) => ({ ...s, orchestrator: "running" }));

      await sleep(380);
      setWorkflowState((s) => ({
        ...s,
        orchestrator: "ok",
        weather_agent: "running",
        geo_agent: "running",
        tavily_agent: "running",
      }));

      // Phase 2 — three sub-agents in parallel. Wait for both the timer
      // and the real API response before resolving their statuses.
      await sleep(900);
      const data = await apiPromise;

      const traceMap = Object.fromEntries(data.trace.map((t) => [t.agent, t]));
      const setSub = (key: NodeKey): WorkflowState[NodeKey] =>
        traceMap[key]?.ok ? "ok" : "fail";
      const detail = (key: NodeKey): NodeDetail | undefined => {
        const t = traceMap[key];
        if (!t) return undefined;
        return { durationMs: t.durationMs, summary: t.summary, error: t.error };
      };

      setWorkflowState((s) => ({
        ...s,
        weather_agent: setSub("weather_agent"),
        geo_agent: setSub("geo_agent"),
        tavily_agent: setSub("tavily_agent"),
      }));
      setDetails((d) => ({
        ...d,
        weather_agent: detail("weather_agent"),
        geo_agent: detail("geo_agent"),
        tavily_agent: detail("tavily_agent"),
      }));

      // Phase 3 — extraction.
      await sleep(280);
      setWorkflowState((s) => ({ ...s, extraction_agent: "running" }));

      await sleep(520);
      setWorkflowState((s) => ({ ...s, extraction_agent: setSub("extraction_agent") }));
      setDetails((d) => ({ ...d, extraction_agent: detail("extraction_agent") }));

      // Phase 4 — reveal result.
      await sleep(180);
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed");
      // mark any still-running agents as failed
      setWorkflowState((s) => {
        const next = { ...s };
        for (const k of Object.keys(s) as NodeKey[]) {
          if (next[k] === "running" || next[k] === "pending") next[k] = "fail";
        }
        return next;
      });
    } finally {
      setLoading(false);
    }
  }

  return { workflowState, details, result, loading, error, run };
}
