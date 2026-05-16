/**
 * Chart fixtures — client-safe (no "server-only"). Deterministic generators
 * keyed by regionId so the trade-side multi-chart dashboard has meaningful
 * variation without hitting the live agent pipeline.
 *
 * Dev team: replace these with real time-series / sentiment payloads once
 * weather_agent + tavily_agent return structured arrays.
 */

function hashSeed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return (h % 1000) / 1000;
}

export interface WeatherPoint {
  month: string; // YYYY-MM
  tempAnomalyC: number;
  precipMm: number;
  frostDays: number;
}

export function demoWeatherTimeseries(regionId: string): WeatherPoint[] {
  const seed = hashSeed(regionId);
  const months = ["2025-11", "2025-12", "2026-01", "2026-02", "2026-03", "2026-04"];
  return months.map((month, i) => ({
    month,
    tempAnomalyC: Number((Math.sin(i + seed * 6) * 1.5 + seed * 0.8).toFixed(2)),
    precipMm: Math.round(60 + Math.cos(i * 0.7 + seed * 4) * 30 + seed * 20),
    frostDays: Math.max(0, Math.round(i < 3 ? 2 + seed * 3 : seed * 1.5)),
  }));
}

export interface SentimentSlice {
  label: "positive" | "neutral" | "negative";
  value: number;
}

export function demoSentiment(regionId: string): SentimentSlice[] {
  const seed = hashSeed(regionId);
  const neg = Math.round(20 + seed * 25);
  const pos = Math.round(35 + (1 - seed) * 25);
  return [
    { label: "positive", value: pos },
    { label: "neutral", value: 100 - pos - neg },
    { label: "negative", value: neg },
  ];
}
