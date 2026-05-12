import "server-only";
import type { ChatTurn } from "@/lib/ai/openai";

/**
 * Demo fixtures — return deterministic, hand-crafted responses when
 * NEXT_PUBLIC_DEMO_MODE=true so the team can rehearse the live demo
 * without burning credits or depending on flaky preview APIs.
 *
 * Replace these with the actual chosen product's demo data on event day.
 */

export function demoChatCompletion(messages: ChatTurn[]): string {
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const prompt = lastUser?.content ?? "";
  if (/hello|hi|hey/i.test(prompt)) {
    return "Hello from Paris Hack 2026 — running in demo mode. Wire a real API key to switch from fixtures to live calls.";
  }
  if (/track|wildcard|sponsor/i.test(prompt)) {
    return "Tracks for this hackathon are confirmed on event day. The scaffold pre-wires OpenAI, Anthropic, Fal, Gradium, and Slng.ai so any track is reachable.";
  }
  return `(demo) Echo: ${prompt.slice(0, 200)}`;
}

export function demoImageUrl(prompt: string): string {
  const slug = encodeURIComponent(prompt.slice(0, 64));
  return `https://placehold.co/1024x576/27272a/fafafa.png?text=${slug}`;
}

export function demoTranscript(): { text: string; confidence: number; durationMs: number } {
  return { text: "Hello Paris, this is a demo transcript.", confidence: 0.97, durationMs: 1234 };
}

export function demoTtsAudio(): ArrayBuffer {
  return new ArrayBuffer(0);
}
