import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { env, isDemoMode, sponsors } from "@/lib/env";
import { SponsorUnavailableError } from "@/lib/utils";
import { demoChatCompletion } from "@/lib/demo/fixtures";
import type { ChatTurn } from "@/lib/ai/openai";

let _client: Anthropic | null = null;

export function anthropicClient(): Anthropic {
  if (!sponsors.anthropic || !env.ANTHROPIC_API_KEY) {
    throw new SponsorUnavailableError("anthropic");
  }
  if (!_client) {
    _client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  }
  return _client;
}

export async function chat(
  messages: ChatTurn[],
  opts: { model?: string; system?: string } = {},
): Promise<string> {
  if (isDemoMode) return demoChatCompletion(messages);

  const sys = opts.system ?? messages.find((m) => m.role === "system")?.content;
  const turns = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

  const client = anthropicClient();
  const res = await client.messages.create({
    model: opts.model ?? env.ANTHROPIC_MODEL,
    max_tokens: 1024,
    system: sys,
    messages: turns,
  });
  const text = res.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
  return text;
}
