import "server-only";
import { env, integrations, isDemoMode } from "@/lib/env";
import { SponsorUnavailableError } from "@/lib/utils";
import type { AnalyzeInput, AnalyzeResult } from "@/lib/wine/types";

/**
 * Pioneer.ai adapter — STUB.
 *
 * Owner provides docs + key. This file defines the call surface used by the
 * orchestrator / feature_agent so the rest of the code can be written
 * against a stable contract.
 *
 * Two flows we expect:
 *   - `recordCase(input, result)` — log analyses so pioneer can post-train
 *     on (input, signals, outcome) tuples.
 *   - `getInsights(regionId)` — fetch self-evolved patterns to fold into
 *     feature_agent.
 *
 * Until the real endpoints are confirmed, both return cheap placeholders;
 * none of the orchestrator code is allowed to block on pioneer.
 */

export interface PioneerCaseRef {
  id: string;
  recordedAt: string;
}

export interface PioneerInsight {
  /** Stable id of the insight pattern. */
  id: string;
  /** Short human-readable label, e.g. "frost+market_softness Q2". */
  label: string;
  /** Confidence from pioneer's model. */
  confidence: number;
  /** Free-form payload — shape will be defined once docs land. */
  payload: Record<string, unknown>;
}

export async function recordCase(
  input: AnalyzeInput,
  result: AnalyzeResult,
): Promise<PioneerCaseRef> {
  if (isDemoMode) return { id: `demo-${Date.now()}`, recordedAt: new Date().toISOString() };
  if (!integrations.pioneer) throw new SponsorUnavailableError("pioneer");

  // TODO(owner): POST to `${env.PIONEER_BASE_URL}/v1/cases` once docs arrive.
  // Body shape (proposed):
  //   { input, result, traceVersion: 1 }
  // Auth: Bearer ${env.PIONEER_API_KEY}
  void env.PIONEER_BASE_URL;
  void input;
  void result;
  return { id: `stub-${Date.now()}`, recordedAt: new Date().toISOString() };
}

export async function getInsights(regionId: string): Promise<PioneerInsight[]> {
  if (isDemoMode) return [];
  if (!integrations.pioneer) return [];

  // TODO(owner): GET `${env.PIONEER_BASE_URL}/v1/insights?regionId=...`
  void regionId;
  return [];
}
