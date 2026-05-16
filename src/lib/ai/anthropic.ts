import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { env, sponsors } from "@/lib/env";
import { SponsorUnavailableError } from "@/lib/utils";

let _client: Anthropic | null = null;

/**
 * Lazy Anthropic client. Throws SponsorUnavailableError if ANTHROPIC_API_KEY
 * is not set. Used by the orchestrator (Claude tool-use loop) and by
 * extraction_agent when it upgrades from the heuristic to a structured call.
 */
export function anthropicClient(): Anthropic {
  if (!sponsors.anthropic || !env.ANTHROPIC_API_KEY) {
    throw new SponsorUnavailableError("anthropic");
  }
  if (!_client) {
    _client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  }
  return _client;
}
