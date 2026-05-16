import "server-only";
import type { SubAgent } from "@/lib/agents/types";

export interface FeatureInput {
  regionId: string;
  /** Raw risk score from extraction_agent. */
  riskScore: number;
  /** Optional knobs the dashboard exposes — to be defined. */
  knobs?: Record<string, unknown>;
}

export interface FeatureOutput {
  /** Whatever the feature layer eventually returns. Shape: TBD. */
  payload: Record<string, unknown>;
  notes: string[];
}

/**
 * STUB — definition pending. Owner: TBD.
 *
 * Per session brief: feature-agent sits between extraction-agent and the
 * user dashboard, and is the surface where Pioneer.ai's wine-domain
 * classifier is folded back in (see src/lib/training/pioneer.ts).
 *
 * Example consumer (drop into run() once features are scoped):
 *
 *     import { classify } from "@/lib/training/pioneer";
 *     const cls = await classify({
 *       text: `score=${input.riskScore}; drivers=${JSON.stringify(input.knobs)}`,
 *       task: "risk_band",
 *       labels: ["low", "moderate", "elevated", "high"],
 *     });
 *     // cls?.label gives the wine-domain-trained classifier's band
 *
 * The orchestrator wires this agent as an optional tool so it can be
 * implemented and enabled without changing the loop.
 */
export const featureAgent: SubAgent<FeatureInput, FeatureOutput> = {
  name: "feature_agent",
  description:
    "[NOT IMPLEMENTED] Transform extraction output into dashboard features. Wire pioneer.ai self-evolved patterns here. Optional — orchestrator runs without it until owner ships an impl.",
  input_schema: {
    type: "object",
    properties: {
      regionId: { type: "string" },
      riskScore: { type: "number" },
      knobs: { type: "object", additionalProperties: true },
    },
    required: ["regionId", "riskScore"],
  },
  async run(input) {
    return {
      agent: "feature_agent",
      ok: true,
      durationMs: 0,
      data: {
        payload: { regionId: input.regionId, riskScore: input.riskScore },
        notes: ["TODO(owner): define features; hook pioneer.ai recommendations."],
      },
      summary: "stub passthrough",
    };
  },
};
