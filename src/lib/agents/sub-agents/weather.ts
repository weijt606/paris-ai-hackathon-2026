import "server-only";
import type { SubAgent } from "@/lib/agents/types";

export interface WeatherInput {
  regionId: string;
  /** ISO date. */
  start: string;
  /** ISO date. */
  end: string;
}

export interface WeatherSignals {
  summary: string;
  metrics: Array<{ name: string; value: number; unit: string }>;
  /** Free-form notes for the orchestrator to include in its reasoning. */
  notes: string[];
}

/**
 * STUB — replace `run()` body. Owner: dev team (weather track).
 *
 * Expected scope: historical climate (30y baseline) + official forecast
 * (Météo-France / NOAA / Open-Meteo) → aggregated metrics like GDD,
 * frost-day count, temperature anomaly, precipitation deficit.
 *
 * Keep WeatherSignals shape stable — extraction_agent depends on it.
 */
export const weatherAgent: SubAgent<WeatherInput, WeatherSignals> = {
  name: "weather_agent",
  description:
    "Gather historical climate and official forecast for a wine region/timeframe. Returns aggregated metrics (growing-degree-days, frost-day count, anomalies vs 30y baseline) plus narrative notes. Call early in the loop — extraction_agent depends on its output.",
  input_schema: {
    type: "object",
    properties: {
      regionId: { type: "string", description: "Region slug, e.g. 'burgundy-cote-de-nuits'." },
      start: { type: "string", description: "ISO date YYYY-MM-DD." },
      end: { type: "string", description: "ISO date YYYY-MM-DD." },
    },
    required: ["regionId", "start", "end"],
  },
  async run(input) {
    return {
      agent: "weather_agent",
      ok: true,
      durationMs: 0,
      data: {
        summary: `[stub] ${input.regionId} weather for ${input.start}→${input.end}`,
        metrics: [
          { name: "growing_degree_days", value: 1480, unit: "GDD" },
          { name: "frost_days", value: 3, unit: "days" },
          { name: "temp_anomaly_vs_baseline", value: 1.2, unit: "°C" },
        ],
        notes: ["TODO(dev): replace with real climate fetch."],
      },
      summary: "stub climate metrics",
    };
  },
};
