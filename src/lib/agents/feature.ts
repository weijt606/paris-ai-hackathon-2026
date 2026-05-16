import "server-only";
import { env, integrations, isDemoMode, sponsors } from "@/lib/env";
import { openaiClient } from "@/lib/ai/openai";
import { pioneerChat } from "@/lib/training/pioneer";
import type { SubAgent } from "@/lib/agents/types";
import type { FeatureSummary, Persona } from "@/lib/wine/types";

/**
 * Feature agent — receives the extraction agent's evaluation and produces
 * the three user-facing artifacts:
 *   1. executiveSummary  — 2 sentences shown above the risk card
 *   2. reportMarkdown    — one-page markdown report (download/print)
 *   3. emailDigest       — short markdown preview for the subscribe flow
 *
 * Tiered LLM strategy:
 *   tier 1 — Pioneer.ai (preferred): a small/medium open-source model
 *            (Qwen, GLM, Llama-class) hosted by Pioneer. Cheaper + faster
 *            than gpt-4o-mini for this short-output packaging task, and the
 *            sponsor integration is functionally meaningful here (not
 *            cosmetic). Future: swap PIONEER_MODEL_ID to a Pioneer-fine-
 *            tuned wine-domain local model — same code path.
 *   tier 2 — OpenAI structured output (response_format: json_schema strict)
 *            as fallback when Pioneer is unavailable / returns null.
 *   tier 3 — deterministic template assembled from extraction output, so
 *            the dashboard stays demoable even with zero LLM access.
 */

export interface FeatureInput {
  regionId: string;
  persona: Persona;
  /** Risk score from extraction (0–100, higher = worse outlook). */
  score: number;
  /** Vintage quality band from extraction (Great → Poor). */
  qualityBand?: "Great" | "Excellent" | "Good" | "Average" | "Poor";
  /** 1-sentence summary of the dominant risk drivers from extraction. */
  driversSummary?: string;
  /** 1-sentence summary of persona-specific recommendations from extraction. */
  recommendationsSummary?: string;
  /** Optional rationale string from extraction. */
  rationale?: string;
}

export type FeatureOutput = FeatureSummary;

// ─── Prompts ───────────────────────────────────────────────────────────

// Shared system prompt body (same for both tiers; structure note diverges).
const PROMPT_BODY = `You are the feature agent in a wine-intelligence pipeline.

You receive an evaluation from the upstream extraction agent (risk score, quality band, driver summary, recommendations summary, rationale) plus the target region and persona. You produce THREE user-facing artifacts:

1. executiveSummary — exactly 2 concise sentences. Mention the region by id, the risk level qualitatively, and the dominant driver. No marketing fluff.

2. reportMarkdown — a one-page markdown report (~250–400 words). Sections:
   # Vintage outlook — {regionId}
   ## Risk profile
   ## Key drivers
   ## Recommendations ({persona})
   ## Caveats
   Persona-appropriate tone: operational/agronomic for vineyard, commercial/buying-decision for trade.

3. emailDigest — short markdown digest for a weekly email. About 5–8 lines. Start with a one-line subject, then 2–3 sentences of summary, then a 2-item bullet list of top recommendations.

Output language: English. Be specific. No padding.`;

// For Pioneer / open-source models: explicit JSON-only contract since most
// open-source models don't support OpenAI's strict json_schema mode.
const PIONEER_SYSTEM_PROMPT = `${PROMPT_BODY}

Output STRICTLY this JSON object — exactly these three keys, all strings, no extras, no prose outside JSON, no markdown code fence:

{
  "executiveSummary": "...",
  "reportMarkdown": "...",
  "emailDigest": "..."
}`;

// For OpenAI (tier 2): paired with response_format json_schema strict.
const OPENAI_SYSTEM_PROMPT = PROMPT_BODY;

const OPENAI_RESPONSE_SCHEMA = {
  name: "feature_output",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["executiveSummary", "reportMarkdown", "emailDigest"],
    properties: {
      executiveSummary: { type: "string" },
      reportMarkdown: { type: "string" },
      emailDigest: { type: "string" },
    },
  },
} as const;

function buildUserMessage(input: FeatureInput): string {
  return [
    `Region id: ${input.regionId}`,
    `Persona: ${input.persona}`,
    `Risk score: ${input.score}/100`,
    input.qualityBand && `Quality band: ${input.qualityBand}`,
    input.driversSummary && `Drivers: ${input.driversSummary}`,
    input.recommendationsSummary && `Recommendations: ${input.recommendationsSummary}`,
    input.rationale && `Rationale: ${input.rationale}`,
  ]
    .filter(Boolean)
    .join("\n");
}

function isValidFeature(x: unknown): x is FeatureOutput {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.executiveSummary === "string" &&
    typeof o.reportMarkdown === "string" &&
    typeof o.emailDigest === "string"
  );
}

function stripCodeFence(s: string): string {
  // Some open-source models still wrap JSON in ```json ... ``` despite instruction.
  return s.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
}

// ─── Tier 3 — deterministic template ───────────────────────────────────

function templateFallback(input: FeatureInput, reason: string): FeatureOutput {
  const band = input.qualityBand ?? "Average";
  const risk =
    input.score >= 75
      ? "critical"
      : input.score >= 50
        ? "elevated"
        : input.score >= 25
          ? "moderate"
          : "low";
  const persona = input.persona;
  return {
    executiveSummary: `${input.regionId} is in a ${risk}-risk window with an underlying ${band.toLowerCase()} vintage outlook. ${input.driversSummary ?? "Driver context unavailable."}`,
    reportMarkdown: [
      `# Vintage outlook — ${input.regionId}`,
      ``,
      `## Risk profile`,
      `- **Risk score:** ${input.score}/100 (${risk})`,
      `- **Quality band:** ${band}`,
      ``,
      `## Key drivers`,
      input.driversSummary ?? "_Heuristic fallback: no driver detail available._",
      ``,
      `## Recommendations (${persona})`,
      input.recommendationsSummary ?? "_Recommendations unavailable in fallback mode._",
      ``,
      `## Caveats`,
      `Generated by deterministic template (${reason}). Configure PIONEER_API_KEY or OPENAI_API_KEY for the full LLM report.`,
      input.rationale ? `\n_Extraction rationale: ${input.rationale}_` : "",
    ].join("\n"),
    emailDigest: [
      `**Weekly outlook — ${input.regionId}**`,
      ``,
      `Risk score **${input.score}/100** (${risk}), quality band ${band}.`,
      input.driversSummary ?? "Drivers unavailable.",
      ``,
      input.recommendationsSummary
        ? `Top recommendation: ${input.recommendationsSummary}`
        : "_Recommendations unavailable in fallback mode._",
    ].join("\n"),
  };
}

// ─── Tier 1 — Pioneer ──────────────────────────────────────────────────

async function tryPioneer(input: FeatureInput, signal: AbortSignal): Promise<{ data: FeatureOutput; modelId: string } | null> {
  if (!integrations.pioneer) return null;
  const res = await pioneerChat(
    [
      { role: "system", content: PIONEER_SYSTEM_PROMPT },
      { role: "user", content: buildUserMessage(input) },
    ],
    {
      responseFormat: { type: "json_object" },
      temperature: 0.45,
      timeoutMs: 12_000,
    },
  );
  void signal; // pioneerChat wires its own abort/timeout
  if (!res?.content) return null;
  try {
    const parsed = JSON.parse(stripCodeFence(res.content));
    if (!isValidFeature(parsed)) return null;
    return { data: parsed, modelId: res.modelId };
  } catch {
    return null;
  }
}

// ─── Tier 2 — OpenAI ───────────────────────────────────────────────────

async function tryOpenAI(input: FeatureInput, signal: AbortSignal): Promise<FeatureOutput | null> {
  if (!sponsors.openai) return null;
  try {
    const client = openaiClient();
    const res = await client.chat.completions.create(
      {
        model: env.OPENAI_MODEL,
        messages: [
          { role: "system", content: OPENAI_SYSTEM_PROMPT },
          { role: "user", content: buildUserMessage(input) },
        ],
        response_format: { type: "json_schema", json_schema: OPENAI_RESPONSE_SCHEMA },
        temperature: 0.4,
      },
      { signal },
    );
    const content = res.choices[0]?.message?.content;
    if (!content) return null;
    const parsed = JSON.parse(content);
    return isValidFeature(parsed) ? parsed : null;
  } catch (err) {
    console.warn("[feature] OpenAI tier-2 failed:", err instanceof Error ? err.message : err);
    return null;
  }
}

// ─── Agent ─────────────────────────────────────────────────────────────

export const featureAgent: SubAgent<FeatureInput, FeatureOutput> = {
  name: "feature_agent",
  description:
    "Produce the dashboard's executive summary, a downloadable markdown report, and a short email digest from the extraction agent's evaluation. CALL ONLY AFTER extraction_agent has returned, passing its score, quality band, and 1-sentence summaries of drivers + recommendations + rationale.",
  input_schema: {
    type: "object",
    properties: {
      regionId: { type: "string" },
      persona: { type: "string", enum: ["vineyard", "trade"] },
      score: { type: "number", description: "Risk score 0–100 from extraction." },
      qualityBand: {
        type: "string",
        enum: ["Great", "Excellent", "Good", "Average", "Poor"],
        description: "Vintage quality band from extraction.",
      },
      driversSummary: {
        type: "string",
        description: "1-sentence summary of extraction's dominant drivers.",
      },
      recommendationsSummary: {
        type: "string",
        description: "1-sentence summary of extraction's persona-specific recommendations.",
      },
      rationale: { type: "string", description: "Extraction's rationale (full string)." },
    },
    required: ["regionId", "persona", "score"],
  },

  async run(input, ctx) {
    const t0 = Date.now();

    if (isDemoMode) {
      return {
        agent: "feature_agent",
        ok: true,
        durationMs: Date.now() - t0,
        data: templateFallback(input, "demo mode"),
        summary: "demo · template",
      };
    }

    // tier 1 — Pioneer (preferred sponsor path)
    const pioneer = await tryPioneer(input, ctx.signal);
    if (pioneer) {
      return {
        agent: "feature_agent",
        ok: true,
        durationMs: Date.now() - t0,
        data: pioneer.data,
        summary: `pioneer · ${pioneer.modelId.slice(0, 8)}`,
      };
    }

    // tier 2 — OpenAI
    const openai = await tryOpenAI(input, ctx.signal);
    if (openai) {
      return {
        agent: "feature_agent",
        ok: true,
        durationMs: Date.now() - t0,
        data: openai,
        summary: "openai · structured",
      };
    }

    // tier 3 — deterministic template
    const reason = !integrations.pioneer && !sponsors.openai ? "no llm configured" : "all llm tiers failed";
    return {
      agent: "feature_agent",
      ok: !!reason && reason === "no llm configured",
      durationMs: Date.now() - t0,
      data: templateFallback(input, reason),
      summary: `template · ${reason}`,
    };
  },
};
