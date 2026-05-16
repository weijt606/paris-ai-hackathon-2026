#!/usr/bin/env tsx
/**
 * Pre-flight env check — verify the orchestrator brain + integrations.
 * Run before a demo to catch "key present but rate-limited / wrong tier".
 *
 * Usage:
 *   pnpm check:env
 */
import "dotenv/config";

interface Check {
  name: string;
  required: boolean;
  run: () => Promise<{ ok: boolean; detail?: string }>;
}

const checks: Check[] = [
  {
    name: "Anthropic",
    required: true,
    run: async () => {
      if (!process.env.ANTHROPIC_API_KEY)
        return { ok: false, detail: "ANTHROPIC_API_KEY not set (orchestrator brain)" };
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6",
          max_tokens: 4,
          messages: [{ role: "user", content: "ping" }],
        }),
      });
      return res.ok
        ? { ok: true, detail: `${res.status} OK` }
        : { ok: false, detail: `${res.status} ${(await res.text()).slice(0, 200)}` };
    },
  },
  {
    name: "Tavily",
    required: false,
    run: async () => {
      if (!process.env.TAVILY_API_KEY) return { ok: false, detail: "TAVILY_API_KEY not set" };
      return { ok: true, detail: "key present (verify on first tavily_agent call)" };
    },
  },
  {
    name: "Pioneer.ai",
    required: false,
    run: async () => {
      if (!process.env.PIONEER_API_KEY) return { ok: false, detail: "PIONEER_API_KEY not set" };
      return { ok: true, detail: "key present (adapter stub — verify once docs land)" };
    },
  },
];

(async () => {
  console.log("Pre-flight env check\n");
  let failures = 0;
  for (const c of checks) {
    try {
      const res = await c.run();
      const mark = res.ok ? "\x1b[32m✓\x1b[0m" : c.required ? "\x1b[31m✗\x1b[0m" : "\x1b[33m–\x1b[0m";
      console.log(`${mark} ${c.name.padEnd(12)} ${res.detail ?? ""}`);
      if (!res.ok && c.required) failures++;
    } catch (err) {
      console.log(
        `\x1b[31m✗\x1b[0m ${c.name.padEnd(12)} ${err instanceof Error ? err.message : err}`,
      );
      if (c.required) failures++;
    }
  }
  console.log("");
  process.exit(failures > 0 ? 1 : 0);
})();
