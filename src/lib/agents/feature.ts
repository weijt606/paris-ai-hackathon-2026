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
 * user dashboard, and is the surface where pioneer.ai's self-evolving
 * insights are folded back in. Concrete features (prediction widgets,
 * alerting thresholds, persona-specific lenses) are still being scoped.
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
