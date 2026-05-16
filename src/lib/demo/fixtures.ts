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
      { agent: "feature_agent", ok: true, durationMs: 0, summary: "(demo fixture)" },
    ],
    qualityBand:
      score < 25 ? "Great" : score < 50 ? "Excellent" : score < 65 ? "Good" : score < 80 ? "Average" : "Poor",
    activeGates: [],
    rationale:
      "Demo-mode placeholder: weighted base from sub-agent stubs, gated by spring-frost signal and softening market sentiment.",
    feature: demoFeature(input, score),
    generatedAt: new Date().toISOString(),
    isDemoOrPartial: true,
  };
}

function demoFeature(input: AnalyzeInput, score: number) {
  const region = input.region.name;
  const persona = input.persona;
  const isVineyard = persona === "vineyard";
  return {
    executiveSummary: `${region} faces an elevated risk window in the current vintage outlook, driven primarily by spring frost probability above the 30-year baseline. Persona context: ${persona}.`,
    reportMarkdown: [
      `# Vintage outlook — ${region}`,
      ``,
      `## Risk profile`,
      `- **Risk score:** ${score}/100`,
      `- **Persona:** ${persona}`,
      `- **Window:** ${input.timeframe.start} → ${input.timeframe.end}`,
      ``,
      `## Key drivers`,
      `- Spring frost probability is +1.4σ above the 30-year baseline.`,
      `- Slope/aspect mix in the appellation amplifies frost-pocket exposure.`,
      `- Public-web chatter indicates négociants reducing en primeur allocations.`,
      ``,
      `## Recommendations (${persona})`,
      isVineyard
        ? `- Deploy frost protection (candles or wind machines) the week of bud-break.\n- Hold back 10–15% allocation; pricing power likely improves later in Q3.`
        : `- Lock in 2024 vintage allocations early — supply tightening is probable.\n- Diversify into Saint-Émilion satellites as a Bordeaux hedge.`,
      ``,
      `## Caveats`,
      `Generated in demo mode against fixture data. Re-run with OPENAI_API_KEY set for an OpenAI-driven assessment grounded in the wine-vintage-quality-schema.`,
    ].join("\n"),
    emailDigest: [
      `**Weekly outlook — ${region}**`,
      ``,
      `Risk score **${score}/100**. Spring frost is the dominant driver this window.`,
      ``,
      isVineyard
        ? `- Deploy frost protection at bud-break\n- Reserve 10–15% of allocation for Q3 pricing power`
        : `- Lock in 2024 allocations early\n- Diversify into Saint-Émilion satellites`,
    ].join("\n"),
  };
}
