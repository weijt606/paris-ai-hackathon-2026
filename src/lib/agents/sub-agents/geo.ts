import "server-only";
import { findRegion } from "@/lib/wine/regions";
import type { SubAgent } from "@/lib/agents/types";

export interface GeoInput {
  regionId: string;
  /** Optional appellation filter. */
  appellation?: string;
}

export interface GeoSignals {
  summary: string;
  centroid: { lat: number; lng: number };
  appellations: string[];
  /** Free-form notes (slope, soil, aspect, elevation patterns). */
  notes: string[];
}

/**
 * STUB — replace `run()` body. Owner: dev team (geo track).
 *
 * Expected scope: terroir geometry — slope/aspect/elevation, soil type,
 * proximity to rivers/forests, appellation boundary lookups (INAO).
 * Drives geographic explanations for risk drivers from weather_agent.
 */
export const geoAgent: SubAgent<GeoInput, GeoSignals> = {
  name: "geo_agent",
  description:
    "Resolve geographical/terroir context for a wine region: appellation boundaries, centroid, slope/aspect/soil characteristics. Use to give weather signals a 'why' (frost pockets, drainage, exposure). Cheap to call — no external API needed for the basic lookup.",
  input_schema: {
    type: "object",
    properties: {
      regionId: { type: "string" },
      appellation: { type: "string", description: "Optional appellation name to focus on." },
    },
    required: ["regionId"],
  },
  async run(input) {
    const region = findRegion(input.regionId);
    if (!region) {
      return {
        agent: "geo_agent",
        ok: false,
        error: `Unknown regionId: ${input.regionId}`,
        durationMs: 0,
      };
    }
    return {
      agent: "geo_agent",
      ok: true,
      durationMs: 0,
      data: {
        summary: `[stub] ${region.name} terroir snapshot`,
        centroid: region.centroid,
        appellations: region.appellations ?? [],
        notes: ["TODO(dev): wire INAO / IGN data; describe slope/aspect/soil."],
      },
      summary: "stub terroir snapshot",
    };
  },
};
