import "server-only";
import { integrations } from "@/lib/env";
import type { SubAgent } from "@/lib/agents/types";

export interface TavilyInput {
  regionId: string;
  /** Sources to weight up. */
  facets?: Array<"vineyard_official" | "news" | "forum" | "government" | "research">;
  /** Free-form search refinement, e.g. "en primeur 2024". */
  query?: string;
}

export interface TavilySignal {
  source: string;
  url?: string;
  snippet: string;
  /** 0–1, agent's own confidence. */
  confidence: number;
}

export interface TavilySignals {
  summary: string;
  signals: TavilySignal[];
  /** True if the agent skipped the live search (key missing / demo mode). */
  partial: boolean;
}

/**
 * STUB — replace `run()` body. Owner: dev team (tavily track).
 *
 * Expected scope: public web/grounding search via Tavily covering:
 *  - vineyard official sites / press releases
 *  - news + community forums (Wine-Searcher, Decanter, vivino comments)
 *  - government data (Ministry of Agriculture / INAO / customs)
 *  - open research (HAL, ResearchGate)
 *
 * Returns ranked Signal objects with snippet + url. The orchestrator will
 * weight these by source type in extraction_agent.
 */
export const tavilyAgent: SubAgent<TavilyInput, TavilySignals> = {
  name: "tavily_agent",
  description:
    "Search public sources (vineyard sites, press, forums, government data, research) for current intelligence about a wine region. Returns ranked snippets. Call when market sentiment, regulation changes, or vintage commentary matters.",
  input_schema: {
    type: "object",
    properties: {
      regionId: { type: "string" },
      facets: {
        type: "array",
        items: {
          type: "string",
          enum: ["vineyard_official", "news", "forum", "government", "research"],
        },
        description: "Source categories to emphasise.",
      },
      query: { type: "string", description: "Optional natural-language refinement." },
    },
    required: ["regionId"],
  },
  async run(input) {
    if (!integrations.tavily) {
      return {
        agent: "tavily_agent",
        ok: true,
        durationMs: 0,
        data: {
          summary: `[stub] no TAVILY_API_KEY — returning placeholder signals for ${input.regionId}`,
          signals: [
            {
              source: "placeholder",
              snippet: "Set TAVILY_API_KEY to enable live public-web grounding.",
              confidence: 0.0,
            },
          ],
          partial: true,
        },
        summary: "stub (no key)",
      };
    }
    // TODO(dev): real Tavily call using @tavily/core or fetch to api.tavily.com/search.
    // Map results into TavilySignal[] with source classification + confidence.
    return {
      agent: "tavily_agent",
      ok: true,
      durationMs: 0,
      data: {
        summary: `[stub] key present, body not yet wired for ${input.regionId}`,
        signals: [],
        partial: true,
      },
      summary: "stub (key present, body TBD)",
    };
  },
};
