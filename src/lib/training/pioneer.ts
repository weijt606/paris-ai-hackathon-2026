import "server-only";
import { env, integrations, isDemoMode } from "@/lib/env";

/**
 * Pioneer.ai inference adapter (GLiNER2 entity classifier).
 *
 * Workflow:
 *   1. Train a classifier on the Pioneer dashboard with your domain data
 *      (offline — not done in this repo). Take note of the resulting model id.
 *   2. Set PIONEER_API_KEY + PIONEER_MODEL_ID in .env.local.
 *   3. Call `classify({ text, task, labels })` from a sub-agent — typically
 *      from `extraction_agent` (risk band classification) or `feature_agent`
 *      (specialised wine-domain features).
 *
 * Returns `null` on any failure (missing key, network, timeout, bad response)
 * so callers can fall back to their heuristic path without try/catch noise.
 */

const DEFAULT_TIMEOUT_MS = 8_000;

export interface ClassifyInput {
  /** The text to classify. Keep it short and structured — GLiNER2 is best on payloads, not essays. */
  text: string;
  /** Logical name of the classification task, e.g. "risk_band" or "driver_kind". */
  task: string;
  /** Closed label set. Must match the labels you trained the model on. */
  labels: readonly string[];
  /** Override the env model id (e.g., when you train multiple classifiers). */
  modelId?: string;
  /** Override the default 8s ceiling. */
  timeoutMs?: number;
}

export interface ClassifyResult {
  /** The matched label, or `null` if Pioneer returned something not in `labels`. */
  label: string | null;
  /** Model id Pioneer was queried against. */
  modelId: string;
  latencyMs: number;
}

export async function classify({
  text,
  task,
  labels,
  modelId,
  timeoutMs = DEFAULT_TIMEOUT_MS,
}: ClassifyInput): Promise<ClassifyResult | null> {
  if (isDemoMode) return null;
  if (!integrations.pioneer || !env.PIONEER_API_KEY) return null;

  const resolvedModelId = modelId ?? env.PIONEER_MODEL_ID;
  if (!resolvedModelId) return null;

  if (typeof text !== "string" || text.trim() === "") {
    return { label: null, modelId: resolvedModelId, latencyMs: 0 };
  }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  const startedAt = Date.now();
  try {
    const res = await fetch(`${env.PIONEER_BASE_URL}/inference`, {
      method: "POST",
      headers: {
        "X-API-Key": env.PIONEER_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model_id: resolvedModelId,
        text,
        schema: { classifications: [{ task, labels: [...labels] }] },
      }),
      signal: ctrl.signal,
    });
    const latencyMs = Date.now() - startedAt;
    if (!res.ok) return { label: null, modelId: resolvedModelId, latencyMs };

    const data = (await res.json().catch(() => null)) as
      | { result?: Record<string, unknown> }
      | null;
    const raw = data?.result?.[task];
    const label = typeof raw === "string" && labels.includes(raw) ? raw : null;
    return { label, modelId: resolvedModelId, latencyMs };
  } catch {
    return { label: null, modelId: resolvedModelId, latencyMs: Date.now() - startedAt };
  } finally {
    clearTimeout(timer);
  }
}
