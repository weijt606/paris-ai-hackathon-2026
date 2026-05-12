import "server-only";
import OpenAI from "openai";
import { env, isDemoMode, sponsors } from "@/lib/env";
import { SponsorUnavailableError } from "@/lib/utils";
import { demoChatCompletion } from "@/lib/demo/fixtures";

let _client: OpenAI | null = null;

export function openaiClient(): OpenAI {
  if (!sponsors.openai || !env.OPENAI_API_KEY) {
    throw new SponsorUnavailableError("openai");
  }
  if (!_client) {
    _client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  }
  return _client;
}

export interface ChatTurn {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function chat(messages: ChatTurn[], opts: { model?: string } = {}): Promise<string> {
  if (isDemoMode) return demoChatCompletion(messages);
  const client = openaiClient();
  const res = await client.chat.completions.create({
    model: opts.model ?? env.OPENAI_MODEL,
    messages,
  });
  return res.choices[0]?.message?.content ?? "";
}
