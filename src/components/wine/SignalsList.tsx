import { cn } from "@/lib/utils";
import type { AgentStepTrace } from "@/lib/wine/types";

export function SignalsList({ trace }: { trace: AgentStepTrace[] }) {
  if (trace.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No agent trace yet — run an analysis.</p>
    );
  }
  return (
    <ol className="space-y-2">
      {trace.map((t, i) => (
        <li key={i} className="flex items-center gap-3 rounded-md border bg-background px-3 py-2">
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              t.ok ? "bg-emerald-500" : "bg-red-500",
            )}
            aria-hidden
          />
          <code className="text-sm">{t.agent}</code>
          <span className="flex-1 truncate text-xs text-muted-foreground">
            {t.summary ?? t.error ?? ""}
          </span>
          <span className="font-mono text-xs tabular-nums text-muted-foreground">
            {t.durationMs}ms
          </span>
        </li>
      ))}
    </ol>
  );
}
