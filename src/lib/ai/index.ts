import "server-only";
import { sponsors } from "@/lib/env";
import type { ChatTurn } from "@/lib/ai/openai";
import * as openai from "@/lib/ai/openai";
import * as anthropic from "@/lib/ai/anthropic";

/**
 * Provider-agnostic chat router.
 *
 * Tries the requested provider first; falls back to the other configured
 * provider so the demo path doesn't die on rate-limit / outage. Wire fallbacks
 * BEFORE the sprint, not during.
 */
export type Provider = "openai" | "anthropic";

export async function chat(
  messages: ChatTurn[],
  opts: { provider?: Provider; model?: string } = {},
): Promise<{ text: string; provider: Provider }> {
  const order: Provider[] =
    opts.provider === "anthropic"
      ? ["anthropic", "openai"]
      : opts.provider === "openai"
        ? ["openai", "anthropic"]
        : sponsors.openai
          ? ["openai", "anthropic"]
          : ["anthropic", "openai"];

  let lastErr: unknown;
  for (const p of order) {
    if (!sponsors[p]) continue;
    try {
      const text =
        p === "openai"
          ? await openai.chat(messages, { model: opts.model })
          : await anthropic.chat(messages, { model: opts.model });
      return { text, provider: p };
    } catch (err) {
      lastErr = err;
      console.warn(`[ai] provider ${p} failed, trying next`, err);
    }
  }
  throw lastErr ?? new Error("No AI provider configured. Set OPENAI_API_KEY or ANTHROPIC_API_KEY.");
}

export type { ChatTurn };
