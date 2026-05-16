import "server-only";
import type { SubAgent } from "@/lib/agents/types";
import type { Persona, RiskDriver, Recommendation } from "@/lib/wine/types";

export interface ExtractionInput {
  regionId: string;
  persona: Persona;
  /**
   * Compact signal bag the orchestrator collected from upstream agents.
   * Pass raw text or a JSON snippet — extraction reasons over both.
   */
  weatherSignal?: string;
  geoSignal?: string;
  tavilySignal?: string;
}

export interface ExtractionOutput {
  /** 0–100 cumulative risk. */
  score: number;
  drivers: RiskDriver[];
  recommendations: Recommendation[];
  rationale: string;
}

/**
 * STUB — heuristic risk evaluator. Owner: dev team (modelling track).
 *
 * Recommended replacement: tiered LLM call with graceful degradation.
 *
 *   Tier 1 — Pioneer.ai (preferred sponsor path):
 *     `pioneerChat([...], { responseFormat: { type:"json_schema", ... } })`
 *     Uses hosted gpt-5.5 today; later swap PIONEER_MODEL_ID to a
 *     Pioneer-fine-tuned wine-domain local model (same code path).
 *
 *   Tier 2 — OpenAI structured output:
 *     `openaiClient().chat.completions.create({ response_format: {...} })`
 *     Fallback when Pioneer is unavailable or returns null.
 *
 *   Tier 3 — heuristic (this stub):
 *     Deterministic placeholder so the orchestrator stays demoable when
 *     both upstream calls fail.
 *
 * Contract guarantees:
 *  - score is bounded 0–100
 *  - drivers[].weight sums to ≤ 1.0
 *  - recommendations[].persona matches input.persona
 */
export const extractionAgent: SubAgent<ExtractionInput, ExtractionOutput> = {
  name: "extraction_agent",
  description:
    "Evaluate cumulative wine-region risk from collected weather/geo/public signals. Returns a 0–100 score with weighted drivers and persona-specific recommendations. CALL ONLY AFTER weather/geo/tavily have returned — it depends on their outputs.",
  input_schema: {
    type: "object",
    properties: {
      regionId: { type: "string" },
      persona: { type: "string", enum: ["vineyard", "trade"] },
      weatherSignal: { type: "string", description: "Compact summary from weather_agent." },
      geoSignal: { type: "string", description: "Compact summary from geo_agent." },
      tavilySignal: { type: "string", description: "Compact summary from tavily_agent." },
    },
    required: ["regionId", "persona"],
  },
  async run(input) {
    const present = [
      Boolean(input.weatherSignal) && "weather",
      Boolean(input.geoSignal) && "geo",
      Boolean(input.tavilySignal) && "tavily",
    ].filter(Boolean) as string[];

    const score = 30 + present.length * 10;
    const drivers: RiskDriver[] = present.map((p) => ({
      source: p as RiskDriver["source"],
      signal: `[stub] heuristic contribution from ${p}`,
      weight: Number((1 / Math.max(present.length, 1)).toFixed(2)),
    }));

    const recommendations: Recommendation[] =
      input.persona === "vineyard"
        ? [
            {
              persona: "vineyard",
              action: "[stub] Operational mitigation based on dominant driver",
            },
          ]
        : [
            { persona: "trade", action: "[stub] Allocation / hedge guidance" },
          ];

    return {
      agent: "extraction_agent",
      ok: true,
      durationMs: 0,
      data: {
        score,
        drivers,
        recommendations,
        rationale: `TODO(dev): tier 1 Pioneer chat (gpt-5.5 / wine-tuned) → tier 2 OpenAI structured → tier 3 (this) heuristic. Using ${present.length}/3 upstream signals.`,
      },
      summary: `heuristic score ${score}`,
    };
  },
};
