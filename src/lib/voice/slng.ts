import "server-only";
import { env, isDemoMode, sponsors } from "@/lib/env";
import { SponsorUnavailableError } from "@/lib/utils";

/**
 * Slng.ai voice-infra adapter.
 *
 * Slng's product focuses on real-time voice agents (telephony / WebRTC).
 * The actual SDK surface depends on what they hand out at the event — this
 * is a minimal REST stub. Replace with their official SDK once received.
 */

function ensure() {
  if (!sponsors.slng || !env.SLNG_API_KEY) throw new SponsorUnavailableError("slng");
  return { key: env.SLNG_API_KEY, base: env.SLNG_BASE_URL };
}

export interface CreateAgentInput {
  name: string;
  systemPrompt: string;
  voice?: string;
}

export interface AgentSession {
  id: string;
  websocketUrl?: string;
  webrtcOffer?: string;
}

export async function createAgent(input: CreateAgentInput): Promise<AgentSession> {
  if (isDemoMode) {
    return { id: `demo-${Date.now()}`, websocketUrl: "wss://demo.local/agent" };
  }
  const { key, base } = ensure();
  const res = await fetch(`${base}/v1/agents`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`Slng createAgent failed: ${res.status} ${await res.text()}`);
  return (await res.json()) as AgentSession;
}
