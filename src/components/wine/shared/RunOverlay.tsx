"use client";

import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n/Provider";
import {
  WorkflowTrace,
  type NodeDetail,
  type NodeKey,
  type WorkflowState,
} from "@/components/wine/shared/WorkflowTrace";

interface Props {
  open: boolean;
  state: WorkflowState;
  details?: Partial<Record<NodeKey, NodeDetail>>;
}

/**
 * Full-screen analyse overlay — shown while loading=true. Renders the
 * workflow visualization centre-stage with a thin top progress bar +
 * elapsed timer so the wait feels like the system is actively working,
 * not frozen. Backdrop blur softens the dashboard behind.
 */
export function RunOverlay({ open, state, details }: Props) {
  const t = useT();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!open) {
      setElapsed(0);
      return;
    }
    const startedAt = performance.now();
    const id = window.setInterval(() => {
      setElapsed(Math.round(performance.now() - startedAt));
    }, 200);
    return () => window.clearInterval(id);
  }, [open]);

  if (!open) return null;

  const values = Object.values(state);
  const nonSkipped = values.filter((s) => s !== "skipped").length;
  const done = values.filter((s) => s === "ok" || s === "fail").length;
  const pct = nonSkipped > 0 ? (done / nonSkipped) * 100 : 0;
  const seconds = (elapsed / 1000).toFixed(1);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-foreground/40 p-4 backdrop-blur-md md:p-12">
      <div className="w-full max-w-md animate-scale-in space-y-4">
        <div className="rounded-md border bg-background p-5 shadow-xl">
          <div className="flex items-baseline justify-between">
            <p className="text-[10px] uppercase tracking-luxe text-muted-foreground">
              {t("common.running")}
            </p>
            <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
              {seconds}s
            </span>
          </div>
          <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-2 font-mono text-[10px] tabular-nums text-muted-foreground">
            {done} / {nonSkipped} · {Math.round(pct)}%
          </p>
        </div>

        <WorkflowTrace state={state} details={details} />
      </div>
    </div>
  );
}
