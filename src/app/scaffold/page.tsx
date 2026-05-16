import Link from "next/link";
import { sponsors, integrations, isDemoMode } from "@/lib/env";

const PROVIDER_INFO: { key: keyof typeof sponsors; name: string; role: string }[] = [
  { key: "anthropic", name: "Anthropic", role: "Orchestrator brain (Claude tool-use)" },
];

const INTEGRATION_INFO: { key: keyof typeof integrations; name: string; role: string }[] = [
  { key: "tavily", name: "Tavily", role: "Public-web grounding for tavily_agent" },
  { key: "pioneer", name: "Pioneer.ai", role: "Post-training / self-evolving (stub)" },
];

export default function ScaffoldPage() {
  return (
    <main className="container mx-auto max-w-4xl px-6 py-16">
      <header className="mb-12">
        <p className="text-sm uppercase tracking-widest text-muted-foreground">Config status</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Providers & integrations</h1>
        <p className="mt-3 text-muted-foreground">
          Env-gated. Drop a key into <code>.env.local</code> to enable.
        </p>
        {isDemoMode && (
          <p className="mt-4 inline-block rounded-md bg-amber-500/15 px-3 py-1 text-sm text-amber-700 dark:text-amber-300">
            DEMO MODE ON — orchestrator returns fixtures from{" "}
            <code>src/lib/demo/fixtures.ts</code>
          </p>
        )}
      </header>

      <section className="mb-10">
        <h2 className="mb-4 text-xl font-semibold">Orchestrator</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {PROVIDER_INFO.map((s) => (
            <Card key={s.key} name={s.name} role={s.role} on={sponsors[s.key]} />
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-4 text-xl font-semibold">Sub-agent integrations</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {INTEGRATION_INFO.map((s) => (
            <Card key={s.key} name={s.name} role={s.role} on={integrations[s.key]} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Quick links</h2>
        <ul className="space-y-2 text-sm">
          <li>
            <Link className="underline-offset-4 hover:underline" href="/">
              → Wine dashboard
            </Link>
          </li>
          <li>
            <a className="underline-offset-4 hover:underline" href="/api/health" target="_blank">
              → API health endpoint
            </a>
          </li>
        </ul>
      </section>
    </main>
  );
}

function Card({ name, role, on }: { name: string; role: string; on: boolean }) {
  return (
    <div className="flex items-start justify-between rounded-lg border p-4">
      <div>
        <p className="font-medium">{name}</p>
        <p className="text-sm text-muted-foreground">{role}</p>
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
}
