#!/usr/bin/env tsx
/**
 * Pre-flight check — run before the hackathon to verify every sponsor key
 * actually works (not just present). Catches the "preview API rate-limited
 * mid-demo" class of bug.
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
    name: "OpenAI",
    required: false,
    run: async () => {
      if (!process.env.OPENAI_API_KEY) return { ok: false, detail: "OPENAI_API_KEY not set" };
      const res = await fetch("https://api.openai.com/v1/models", {
        headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      });
      return res.ok
        ? { ok: true, detail: `${res.status} OK` }
        : { ok: false, detail: `${res.status} ${await res.text()}` };
    },
  },
  {
    name: "Anthropic",
    required: false,
    run: async () => {
      if (!process.env.ANTHROPIC_API_KEY)
        return { ok: false, detail: "ANTHROPIC_API_KEY not set" };
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
    name: "Fal",
    required: false,
    run: async () => {
      if (!process.env.FAL_KEY) return { ok: false, detail: "FAL_KEY not set" };
      return { ok: true, detail: "key present (no cheap ping endpoint — verify by generating)" };
    },
  },
  {
    name: "Gradium",
    required: false,
    run: async () => {
      if (!process.env.GRADIUM_API_KEY)
        return { ok: false, detail: "GRADIUM_API_KEY not set" };
      return { ok: true, detail: "key present (no public ping endpoint documented)" };
    },
  },
  {
    name: "Slng.ai",
    required: false,
    run: async () => {
      if (!process.env.SLNG_API_KEY) return { ok: false, detail: "SLNG_API_KEY not set" };
      return { ok: true, detail: "key present (no public ping endpoint documented)" };
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
      console.log(`\x1b[31m✗\x1b[0m ${c.name.padEnd(12)} ${err instanceof Error ? err.message : err}`);
      if (c.required) failures++;
    }
  }
  console.log("");
  process.exit(failures > 0 ? 1 : 0);
})();
