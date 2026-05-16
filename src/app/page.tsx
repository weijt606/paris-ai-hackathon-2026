import Link from "next/link";
import { AnalyzePanel } from "@/components/wine/AnalyzePanel";
import { isDemoMode, sponsors } from "@/lib/env";

export default function Home() {
  return (
    <main className="container mx-auto max-w-6xl px-6 py-12">
      <header className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Burgundy · Bordeaux · risk + market intelligence
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Wine signals dashboard</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Orchestrator agent (OpenAI tool calling) routes to weather, geo, and public-web sub-agents,
            then extraction_agent scores cumulative risk. Persona-aware recommendations for
            vineyards and trade buyers.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Badge ok={sponsors.openai} label="orchestrator: openai" />
          <Badge ok={sponsors.tavily} label="tavily" />
          <Badge ok={sponsors.pioneer} label="pioneer.ai" />
          {isDemoMode && (
            <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-amber-700 dark:text-amber-300">
              demo mode
            </span>
          )}
          <Link href="/scaffold" className="underline-offset-4 hover:underline">
            scaffold →
          </Link>
        </div>
      </header>

      <AnalyzePanel />
    </main>
  );
}

function Badge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={
        ok
          ? "rounded-full bg-emerald-500/15 px-2 py-0.5 text-emerald-700 dark:text-emerald-300"
          : "rounded-full bg-zinc-500/15 px-2 py-0.5 text-zinc-700 dark:text-zinc-300"
      }
    >
      {label}
    </span>
  );
}
