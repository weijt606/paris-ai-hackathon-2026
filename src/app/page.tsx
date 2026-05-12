import Link from "next/link";
import { sponsors, isDemoMode } from "@/lib/env";

const SPONSOR_INFO: { key: keyof typeof sponsors; name: string; role: string }[] = [
  { key: "openai", name: "OpenAI", role: "LLM (chat / structured output)" },
  { key: "anthropic", name: "Anthropic", role: "LLM (Claude — preferred fallback)" },
  { key: "fal", name: "Fal", role: "Image / video generation" },
  { key: "gradium", name: "Gradium", role: "TTS + STT (voice in/out)" },
  { key: "slng", name: "Slng.ai", role: "Real-time voice agent infra" },
];

export default function Home() {
  return (
    <main className="container mx-auto max-w-4xl px-6 py-16">
      <header className="mb-12">
        <p className="text-sm uppercase tracking-widest text-muted-foreground">Team scaffold</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight">Paris AI Hackathon 2026</h1>
        <p className="mt-3 text-muted-foreground">
          Single-day sprint · ~7h coding window · Live demo at 18:00. Sponsor adapters are
          pre-wired and env-gated — drop a key into <code>.env.local</code> to enable.
        </p>
        {isDemoMode && (
          <p className="mt-4 inline-block rounded-md bg-amber-500/15 px-3 py-1 text-sm text-amber-700 dark:text-amber-300">
            DEMO MODE ON — API calls return fixtures from{" "}
            <code>src/lib/demo/fixtures.ts</code>
          </p>
        )}
      </header>

      <section className="mb-10">
        <h2 className="mb-4 text-xl font-semibold">Sponsor adapters</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {SPONSOR_INFO.map((s) => {
            const on = sponsors[s.key];
            return (
              <div
                key={s.key}
                className="flex items-start justify-between rounded-lg border p-4"
              >
                <div>
                  <p className="font-medium">{s.name}</p>
                  <p className="text-sm text-muted-foreground">{s.role}</p>
                </div>
                <span
                  className={
                    on
                      ? "rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300"
                      : "rounded-full bg-zinc-500/15 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:text-zinc-300"
                  }
                >
                  {on ? "configured" : "not set"}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-4 text-xl font-semibold">Quick links</h2>
        <ul className="space-y-2 text-sm">
          <li>
            <Link className="underline-offset-4 hover:underline" href="/template">
              → Open the empty track template
            </Link>
          </li>
          <li>
            <a className="underline-offset-4 hover:underline" href="/api/health" target="_blank">
              → Check API health endpoint
            </a>
          </li>
          <li>
            <a
              className="underline-offset-4 hover:underline"
              href="https://github.com/weijt606/paris-ai-hackathon-2026"
              target="_blank"
              rel="noreferrer"
            >
              → GitHub repo
            </a>
          </li>
        </ul>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Sprint day playbook</h2>
        <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
          <li>10:45 — confirm track + product in <code>src/app/(track)/</code></li>
          <li>11:15 — feature sprint 1 (core loop)</li>
          <li>13:00 — feature sprint 2 (sponsor integration depth)</li>
          <li>15:30 — UI polish + demo fixtures</li>
          <li>16:30 — live demo rehearsal × 3</li>
          <li>17:30 — submit · 18:00 — present</li>
        </ol>
      </section>
    </main>
  );
}
