import "server-only";
import type { AnalyzeInput, AnalyzeResult } from "@/lib/wine/types";
import { bandOf } from "@/lib/wine/types";

/**
 * Demo fixtures — deterministic responses for NEXT_PUBLIC_DEMO_MODE=true.
 * Used for offline rehearsal and to save credits during dev. Every new
 * sponsor / sub-agent call should add a fixture branch here (H3).
 */

export function demoWineAnalysis(input: AnalyzeInput): AnalyzeResult {
  const score = input.region.parent === "burgundy" ? 62 : 48;
  return {
    region: input.region,
    timeframe: input.timeframe,
    persona: input.persona,
    riskScore: score,
    riskBand: bandOf(score),
    drivers: [
      {
        source: "weather",
        signal: "Spring frost probability above 30-year baseline (+1.4σ)",
        weight: 0.42,
      },
      { source: "geo", signal: "Slope/aspect mix amplifies frost pocket exposure", weight: 0.18 },
      {
        source: "tavily",
        signal: "Industry chatter: négociants reducing en primeur allocations",
        weight: 0.27,
      },
      { source: "extraction", signal: "Compound risk: weather × demand softness", weight: 0.13 },
    ],
    recommendations:
      input.persona === "vineyard"
        ? [
            {
              persona: "vineyard",
              action: "Deploy frost protection (candles/wind machines) week of bud-break",
              evidence: "weather.frost_probability",
            },
            {
              persona: "vineyard",
              action: "Hold back 10–15% allocation; pricing power likely improves Q3",
              evidence: "tavily.market_sentiment",
            },
          ]
        : [
            {
              persona: "trade",
              action: "Lock in 2024 vintage allocations early — supply tightening probable",
              evidence: "weather + tavily",
            },
            {
              persona: "trade",
              action: "Diversify into Saint-Émilion satellites as Bordeaux hedge",
              evidence: "geo.appellation_substitution",
            },
          ],
    trace: [
      { agent: "weather_agent", ok: true, durationMs: 0, summary: "(demo fixture)" },
      { agent: "geo_agent", ok: true, durationMs: 0, summary: "(demo fixture)" },
      { agent: "tavily_agent", ok: true, durationMs: 0, summary: "(demo fixture)" },
      { agent: "extraction_agent", ok: true, durationMs: 0, summary: "(demo fixture)" },
    ],
    generatedAt: new Date().toISOString(),
    isDemoOrPartial: true,
  };
}
