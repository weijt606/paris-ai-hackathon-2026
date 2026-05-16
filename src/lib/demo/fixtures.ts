import "server-only";
import type { AnalyzeInput, AnalyzeResult } from "@/lib/wine/types";
import { bandOf } from "@/lib/wine/types";
import type { GeoSignals } from "@/lib/agents/sub-agents/geo";

/**
 * Demo fixtures — deterministic responses for NEXT_PUBLIC_DEMO_MODE=true.
 * Used for offline rehearsal and to save credits during dev. Every new
 * sponsor / sub-agent call should add a fixture branch here (H3).
 */

export function demoGeoSignals(regionId: string, chateau?: string): GeoSignals {
  if (chateau) {
    return {
      summary: `${chateau} (fixture) — ridge site (good cold-air drainage), moderate Gironde water-buffer.`,
      centroid: { lat: 45.22, lng: -0.77 },
      appellations: ["Pauillac"],
      notes: [
        "Elevation 14 m above sea level.",
        "5.0 km from the Gironde estuary — moderate water-buffer.",
        "TPI +5.8 m — ridge site (good cold-air drainage).",
        "Slope 2.8%, N-facing — pronounced slope, cool-facing — slower ripening, preserves acidity in warm vintages.",
        "Local relief 22 m (300 m neighborhood).",
        "Soil: 34% clay / 33% sand / 32% silt — balanced loam.",
      ],
    };
  }
  if (regionId === "bordeaux-medoc") {
    return {
      summary:
        "Médoc (fixture): 60 classed growths across 5 AOCs; 4 frost-pocket sites; mean elevation 15 m.",
      centroid: { lat: 45.12, lng: -0.72 },
      appellations: ["Pauillac", "Saint-Estèphe", "Saint-Julien", "Margaux", "Haut-Médoc"],
      notes: [
        "Elevation: 15 m mean (range 3–30 m). Classed growths cluster on gravel croupes 7–24 m above the estuary.",
        "Distance to Gironde: 6.1 km mean (range 3.3–10.0 km). Closer sites get a stronger water-buffer on diurnal range.",
        "Topographic Position Index: mean 2.2 m. 4 châteaux sit in cold-air pockets (TPI < −2 m) — elevated spring-frost risk.",
        "Slope: mean 1.1% (max 2.8%). 49 sites with measurable slope, dominant aspect E, 16 sun-exposed (S/SE/SW), 16 cool-facing (N/NE/NW).",
        "Soil texture: mean clay 27% / sand 45%. Gravel/sandy regime, strong drainage.",
        "AOC mix: Margaux (21), Pauillac (18), Saint-Julien (11), Saint-Estèphe (5), Haut-Médoc (5).",
        "Frost-pocket châteaux: Léoville-Las Cases, Léoville-Barton, Ducru-Beaucaillou, Calon-Ségur.",
      ],
    };
  }
  if (regionId === "bordeaux-graves") {
    return {
      summary: "Graves (fixture): 1 classed growth (Haut-Brion); inland Pessac-Léognan terroir.",
      centroid: { lat: 44.81, lng: -0.61 },
      appellations: ["Pessac-Léognan"],
      notes: [
        "Only Premier Cru outside the Médoc strip: Haut-Brion at 26 m elevation, 14 km inland.",
        "TPI ~0 m — neutral topographic position with no frost-pocket signal.",
        "Distance to Gironde: 13 km — weak water-buffer; relies on Atlantic moderation.",
      ],
    };
  }
  return {
    summary: `${regionId} (fixture): no 1855-classed coverage in dataset`,
    centroid: { lat: 47.0, lng: 4.9 },
    appellations: [],
    notes: ["Static centroid only. Per-château terroir profiles are limited to left-bank 1855 classed growths."],
  };
}

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
    geoSnapshot: demoGeoSignals(input.region.id),
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
