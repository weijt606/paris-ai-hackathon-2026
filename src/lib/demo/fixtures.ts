import "server-only";
import type { ChatTurn } from "@/lib/ai/openai";
import type { AnalyzeInput, AnalyzeResult } from "@/lib/wine/types";
import { bandOf } from "@/lib/wine/types";

/**
 * Demo fixtures — return deterministic, hand-crafted responses when
 * NEXT_PUBLIC_DEMO_MODE=true so the team can rehearse the live demo
 * without burning credits or depending on flaky preview APIs.
 *
 * Replace these with the actual chosen product's demo data on event day.
 */

export function demoChatCompletion(messages: ChatTurn[]): string {
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const prompt = lastUser?.content ?? "";
  if (/hello|hi|hey/i.test(prompt)) {
    return "Hello from Paris Hack 2026 — running in demo mode. Wire a real API key to switch from fixtures to live calls.";
  }
  if (/track|wildcard|sponsor/i.test(prompt)) {
    return "Tracks for this hackathon are confirmed on event day. The scaffold pre-wires OpenAI, Anthropic, Fal, Gradium, and Slng.ai so any track is reachable.";
  }
  return `(demo) Echo: ${prompt.slice(0, 200)}`;
}

export function demoImageUrl(prompt: string): string {
  const slug = encodeURIComponent(prompt.slice(0, 64));
  return `https://placehold.co/1024x576/27272a/fafafa.png?text=${slug}`;
}

export function demoTranscript(): { text: string; confidence: number; durationMs: number } {
  return { text: "Hello Paris, this is a demo transcript.", confidence: 0.97, durationMs: 1234 };
}

export function demoTtsAudio(): ArrayBuffer {
  return new ArrayBuffer(0);
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
    ],
    generatedAt: new Date().toISOString(),
    isDemoOrPartial: true,
  };
}
