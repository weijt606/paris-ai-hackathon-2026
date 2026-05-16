import { cn } from "@/lib/utils";
import type { AnalyzeResult, RiskBand } from "@/lib/wine/types";

const BAND_STYLES: Record<RiskBand, string> = {
  low: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  moderate: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  elevated: "bg-orange-500/15 text-orange-700 dark:text-orange-300",
  high: "bg-red-500/15 text-red-700 dark:text-red-300",
};

export function RiskCard({ result }: { result: AnalyzeResult }) {
  return (
    <div className="rounded-xl border p-6">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Risk score</p>
          <p className="mt-1 text-5xl font-bold tabular-nums">{result.riskScore}</p>
        </div>
        <span
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wide",
            BAND_STYLES[result.riskBand],
          )}
        >
          {result.riskBand}
        </span>
      </div>

      {result.drivers.length > 0 && (
        <div className="mt-6">
          <p className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">
            Top drivers
          </p>
          <ul className="space-y-2">
            {result.drivers.map((d, i) => (
              <li key={i} className="flex items-start gap-3 text-sm">
                <span className="mt-0.5 rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] uppercase">
                  {d.source}
                </span>
                <span className="flex-1">{d.signal}</span>
                <span className="font-mono text-xs tabular-nums text-muted-foreground">
                  {(d.weight * 100).toFixed(0)}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {result.recommendations.length > 0 && (
        <div className="mt-6">
          <p className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">
            Recommendations ({result.persona})
          </p>
          <ul className="space-y-2 text-sm">
            {result.recommendations.map((r, i) => (
              <li key={i} className="rounded-md border bg-muted/30 px-3 py-2">
                <p>{r.action}</p>
                {r.evidence && (
                  <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                    ↳ {r.evidence}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {result.isDemoOrPartial && (
        <p className="mt-4 text-xs text-amber-700 dark:text-amber-300">
          ⚠ Result is partial (demo mode, missing key, or a sub-agent failed). Check the trace.
        </p>
      )}
    </div>
  );
}
