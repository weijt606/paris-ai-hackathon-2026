import "server-only";
import { readFileSync } from "node:fs";
import path from "node:path";
import { isDemoMode, openaiModelForAgents, sponsors } from "@/lib/env";
import { openaiClient } from "@/lib/ai/openai";
import type { SubAgent } from "@/lib/agents/types";
import type { Persona, Recommendation, RiskDriver } from "@/lib/wine/types";

// ─── Types ─────────────────────────────────────────────────────────────

export interface ExtractionInput {
  regionId: string;
  persona: Persona;
  weatherSignal?: string;
  geoSignal?: string;
  tavilySignal?: string;
}

export interface ExtractionOutput {
  /** 0–100 RISK score. 0 = excellent vintage outlook, 100 = severe risk. */
  score: number;
  drivers: RiskDriver[];
  recommendations: Recommendation[];
  rationale: string;
  /** Underlying vintage-quality band per the schema (before inversion). */
  qualityBand?: "Great" | "Excellent" | "Good" | "Average" | "Poor";
  /** IDs of hard event gates the LLM identified as active. */
  activeGates?: string[];
}

// ─── Schema loading ────────────────────────────────────────────────────

const SCHEMA_PATH = "data/wine-vintage-quality-schema.json";

let _schemaText: string | null = null;
function loadSchemaText(): string {
  if (_schemaText === null) {
    try {
      _schemaText = readFileSync(path.join(process.cwd(), SCHEMA_PATH), "utf-8");
    } catch (err) {
      console.warn(`[extraction] could not load ${SCHEMA_PATH}:`, err);
      _schemaText = "";
    }
  }
  return _schemaText;
}

// ─── OpenAI prompt + response schema ───────────────────────────────────

const SYSTEM_PROMPT_HEAD = `You are the extraction agent in a wine-intelligence pipeline for Burgundy and Bordeaux.

You convert upstream signals (climate, geographical/terroir, public-web) into a structured RISK assessment for a specific French wine region. Your output drives a dashboard for two personas: vineyard operators and trade buyers.

SCORE SEMANTICS (IMPORTANT):
- Output \`score\` in the range 0–100.
- Score is RISK: 0 = excellent vintage outlook (low risk), 100 = severe risk / poor outlook.
- The schema below describes vintage QUALITY (high = good). You must INVERT it to produce risk: risk ≈ 100 − quality.

PROCEDURE:
1. From the available signals, infer best-effort feature values for the schema. When a feature has no signal coverage, treat it as neutral (~60 quality) and reduce its effective weight; mention the gap in the rationale.
2. Compute weightedBaseQuality = Σ(featureScore · featureWeight) over features with coverage.
3. Apply hard-event gates: cap quality at the gate's maximumScoreCap when its condition appears triggered. Record the gate ids in \`activeGates\`.
4. Apply dynamic adjustments where applicable.
5. Clamp quality to [0, 100], then set \`score = 100 − quality\`.
6. Map the QUALITY value (not the risk) into one of the schema grade bands and return as \`qualityBand\`.
7. Produce 3–5 drivers summarising the dominant influences. Each driver: source ∈ {weather, geo, tavily, extraction}, signal (one-line explanation), weight (0–1, weights sum ≤ 1).
8. Produce 2–3 persona-specific recommendations. All recommendations must use the requested persona.

Be concise. No prose padding. Output language: English.

WINE-VINTAGE-QUALITY-SCHEMA (v1):
`;

const RESPONSE_JSON_SCHEMA = {
  name: "wine_extraction",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["score", "qualityBand", "drivers", "recommendations", "activeGates", "rationale"],
    properties: {
      score: {
        type: "number",
        description: "0–100 RISK score (0 = great outlook, 100 = severe risk).",
      },
      qualityBand: {
        type: "string",
        enum: ["Great", "Excellent", "Good", "Average", "Poor"],
        description: "Underlying vintage quality band per the schema (before inversion).",
      },
      drivers: {
        type: "array",
        minItems: 1,
        maxItems: 6,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["source", "signal", "weight"],
          properties: {
            source: { type: "string", enum: ["weather", "geo", "tavily", "extraction"] },
            signal: { type: "string" },
            weight: { type: "number", minimum: 0, maximum: 1 },
          },
        },
      },
      recommendations: {
        type: "array",
        minItems: 1,
        maxItems: 4,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["persona", "action", "evidence"],
          properties: {
            persona: { type: "string", enum: ["vineyard", "trade"] },
            action: { type: "string" },
            evidence: { type: "string" },
          },
        },
      },
      activeGates: {
        type: "array",
        items: { type: "string" },
        description: "IDs of hard event gates the model identified as active.",
      },
      rationale: {
        type: "string",
        description: "1–3 sentences explaining the score.",
      },
    },
  },
} as const;

// ─── Trade sub-persona lens ────────────────────────────────────────────

/**
 * Returns a one-paragraph "lens" that biases driver weighting + recommendations
 * toward the trade sub-persona. Kept short so it doesn't dominate the system
 * prompt — the schema scoring stays the same, only the rationale + drivers +
 * recommendations should shift in emphasis.
 */
function tradePersonaLens(tp: "merchant" | "restaurant" | "wineshop"): string {
  if (tp === "merchant") {
    return `Trade sub-persona: MERCHANT (négociant / en-primeur buyer).
Lens: prioritise drivers that affect en-primeur pricing, allocation availability, and age-worthiness. Emphasise long-term cellar potential and price-volatility signals. Recommendations should target allocation sizing, hedging across vintages, and en-primeur participation decisions.`;
  }
  if (tp === "restaurant") {
    return `Trade sub-persona: RESTAURANT (sommelier / wine-list buyer).
Lens: prioritise drivers that affect by-the-glass viability, vintage-to-vintage consistency, and food-pairing reliability. De-emphasise long-term cellar metrics. Recommendations should target list-refresh cadence, replacement candidates within the same style, and pairing-flexibility notes.`;
  }
  return `Trade sub-persona: WINESHOP (retail / supermarket buyer).
Lens: prioritise drivers that affect retail volume, mainstream consumer appeal, predictable supply, and price-tier diversity. De-emphasise critic-driven prestige metrics in favour of broad-market signals. Recommendations should target SKU breadth, promotional timing, and price-band coverage.`;
}

// ─── Heuristic fallback (tier 3) ───────────────────────────────────────

function heuristicFallback(input: ExtractionInput): ExtractionOutput {
  const present = [
    input.weatherSignal && "weather",
    input.geoSignal && "geo",
    input.tavilySignal && "tavily",
  ].filter(Boolean) as string[];
  const score = 30 + present.length * 10;
  return {
    score,
    drivers: present.map((p) => ({
      source: p as RiskDriver["source"],
      signal: `[heuristic] contribution from ${p}`,
      weight: Number((1 / Math.max(present.length, 1)).toFixed(2)),
    })),
    recommendations:
      input.persona === "vineyard"
        ? [{ persona: "vineyard", action: "[heuristic] mitigation based on dominant driver" }]
        : [{ persona: "trade", action: "[heuristic] allocation / hedge guidance" }],
    rationale: `Heuristic fallback (OpenAI unavailable or schema missing). Using ${present.length}/3 upstream signals.`,
  };
}

// ─── Agent ─────────────────────────────────────────────────────────────

export const extractionAgent: SubAgent<ExtractionInput, ExtractionOutput> = {
  name: "extraction_agent",
  description:
    "Evaluate cumulative wine-region risk from collected weather/geo/public signals. Returns a 0–100 RISK score (low = great vintage outlook) with weighted drivers, persona-specific recommendations, and the underlying vintage-quality band. Driven by an OpenAI Chat Completions call against the wine-vintage-quality-schema. CALL ONLY AFTER weather/geo/tavily have returned.",
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

  async run(input, ctx) {
    const t0 = Date.now();

    // Demo mode or no OpenAI key → heuristic fallback.
    if (isDemoMode || !sponsors.openai) {
      const data = heuristicFallback(input);
      return {
        agent: "extraction_agent",
        ok: true,
        durationMs: Date.now() - t0,
        data,
        summary: isDemoMode ? "demo · heuristic" : "no openai · heuristic",
      };
    }

    const schemaText = loadSchemaText();
    if (!schemaText) {
      const data = heuristicFallback(input);
      return {
        agent: "extraction_agent",
        ok: true,
        durationMs: Date.now() - t0,
        data,
        summary: "schema missing · heuristic",
      };
    }

    // Vineyard-uploaded documents arrive on ctx (direct entry — not routed
    // through the GPT tool-use loop). Metadata only at this stage; future
    // work parses content client-side and includes it here.
    const uploads = ctx.uploads ?? [];
    const uploadBlock = uploads.length > 0
      ? `\n\nUSER-UPLOADED DOCUMENTS (direct entry from the vineyard, metadata only — content not yet parsed):\n${uploads
          .map((u) => `  • ${u.name} (${(u.size / 1024).toFixed(1)} KB, ${u.mime})`)
          .join("\n")}\nTreat these as evidence that operational data exists. Weight features they cover (yield, disease pressure, harvest timing, etc.) more confidently and acknowledge them in the rationale.`
      : "";

    try {
      const client = openaiClient();
      const tradeLens =
        input.persona === "trade" && ctx.tradePersona
          ? tradePersonaLens(ctx.tradePersona)
          : "";

      const userMessage = [
        `Region id: ${input.regionId}`,
        `Persona: ${input.persona}`,
        tradeLens,
        input.weatherSignal && `Weather signals:\n${input.weatherSignal}`,
        input.geoSignal && `Geographical / terroir signals:\n${input.geoSignal}`,
        input.tavilySignal && `Public-web signals:\n${input.tavilySignal}`,
        uploadBlock,
      ]
        .filter(Boolean)
        .join("\n\n");

      const res = await client.chat.completions.create(
        {
          model: openaiModelForAgents(),
          messages: [
            { role: "system", content: SYSTEM_PROMPT_HEAD + schemaText },
            { role: "user", content: userMessage },
          ],
          response_format: {
            type: "json_schema",
            json_schema: RESPONSE_JSON_SCHEMA,
          },
          // Note: newer OpenAI reasoning models (gpt-5*, o-series) only
          // accept the default temperature. We omit the param so any
          // current GA model works.
        },
        { signal: ctx.signal },
      );

      const content = res.choices[0]?.message?.content;
      if (!content) {
        const data = heuristicFallback(input);
        return {
          agent: "extraction_agent",
          ok: true,
          durationMs: Date.now() - t0,
          data,
          summary: "empty openai response · heuristic",
        };
      }

      const parsed = JSON.parse(content) as {
        score: number;
        qualityBand: ExtractionOutput["qualityBand"];
        drivers: RiskDriver[];
        recommendations: Recommendation[];
        activeGates: string[];
        rationale: string;
      };

      const score = Math.max(0, Math.min(100, Number(parsed.score)));
      // Coerce persona on recommendations in case the model strayed.
      const recommendations: Recommendation[] = (parsed.recommendations ?? []).map((r) => ({
        persona: input.persona,
        action: r.action,
        evidence: r.evidence,
      }));

      const data: ExtractionOutput = {
        score,
        qualityBand: parsed.qualityBand,
        drivers: parsed.drivers,
        recommendations,
        rationale: parsed.rationale ?? "",
        activeGates: parsed.activeGates,
      };

      return {
        agent: "extraction_agent",
        ok: true,
        durationMs: Date.now() - t0,
        data,
        summary: `${parsed.qualityBand ?? "scored"} · risk=${score}`,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn("[extraction] OpenAI call failed, falling back to heuristic:", message);
      const data = heuristicFallback(input);
      return {
        agent: "extraction_agent",
        ok: false,
        durationMs: Date.now() - t0,
        data,
        error: message,
        summary: "openai error · heuristic",
      };
    }
  },
};
