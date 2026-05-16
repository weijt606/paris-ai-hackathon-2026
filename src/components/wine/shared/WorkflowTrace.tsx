"use client";

import { useT } from "@/lib/i18n/Provider";
import { cn } from "@/lib/utils";

export type NodeKey =
  | "orchestrator"
  | "weather_agent"
  | "geo_agent"
  | "tavily_agent"
  | "extraction_agent";

export type AgentState = "pending" | "running" | "ok" | "fail";

export interface WorkflowState {
  orchestrator: AgentState;
  weather_agent: AgentState;
  geo_agent: AgentState;
  tavily_agent: AgentState;
  extraction_agent: AgentState;
}

export const INITIAL_WORKFLOW: WorkflowState = {
  orchestrator: "pending",
  weather_agent: "pending",
  geo_agent: "pending",
  tavily_agent: "pending",
  extraction_agent: "pending",
};

export interface NodeDetail {
  durationMs?: number;
  summary?: string;
  error?: string;
}

interface Props {
  state: WorkflowState;
  details?: Partial<Record<NodeKey, NodeDetail>>;
}

const NODES: Array<{ key: NodeKey; cx: number; cy: number; label: string }> = [
  { key: "orchestrator", cx: 50, cy: 10, label: "orchestrator" },
  { key: "weather_agent", cx: 14, cy: 40, label: "weather" },
  { key: "geo_agent", cx: 50, cy: 40, label: "geo" },
  { key: "tavily_agent", cx: 86, cy: 40, label: "tavily" },
  { key: "extraction_agent", cx: 50, cy: 72, label: "extraction" },
];

// Source → target wiring. Used to fade-in connectors based on source state.
const EDGES: Array<{ from: NodeKey; to: NodeKey; d: string }> = [
  { from: "orchestrator", to: "weather_agent", d: "M 50 12 Q 32 26 14 38" },
  { from: "orchestrator", to: "geo_agent", d: "M 50 12 L 50 38" },
  { from: "orchestrator", to: "tavily_agent", d: "M 50 12 Q 68 26 86 38" },
  { from: "weather_agent", to: "extraction_agent", d: "M 14 42 Q 32 56 50 70" },
  { from: "geo_agent", to: "extraction_agent", d: "M 50 42 L 50 70" },
  { from: "tavily_agent", to: "extraction_agent", d: "M 86 42 Q 68 56 50 70" },
];

export function WorkflowTrace({ state, details }: Props) {
  const t = useT();
  const totalMs = Object.values(details ?? {}).reduce(
    (acc, d) => acc + (d?.durationMs ?? 0),
    0,
  );
  const doneCount = (Object.values(state) as AgentState[]).filter(
    (s) => s === "ok" || s === "fail",
  ).length;
  const total = NODES.length;

  return (
    <section className="rounded-md border bg-card p-5">
      <header className="mb-3 flex items-baseline justify-between gap-3">
        <span className="text-[10px] uppercase tracking-luxe text-muted-foreground">
          {t("workflow.title")}
        </span>
        <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
          {doneCount}/{total}
          {totalMs > 0 && ` · ${totalMs}ms`}
        </span>
      </header>

      <svg
        viewBox="0 0 100 84"
        className="block w-full"
        role="img"
        aria-label={t("workflow.title")}
      >
        <defs>
          <marker
            id="wf-arrow"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="4"
            markerHeight="4"
            orient="auto"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="hsl(var(--border))" />
          </marker>
        </defs>

        {/* Edges */}
        <g fill="none" strokeWidth="0.4">
          {EDGES.map((e, i) => {
            const fromState = state[e.from];
            const active = fromState === "ok" || fromState === "running";
            return (
              <path
                key={i}
                d={e.d}
                stroke={
                  active ? "hsl(var(--foreground))" : "hsl(var(--border))"
                }
                strokeOpacity={active ? 0.55 : 1}
                strokeDasharray={fromState === "pending" ? "1.5 1.5" : undefined}
                markerEnd="url(#wf-arrow)"
                style={{ transition: "stroke 400ms, stroke-opacity 400ms" }}
              />
            );
          })}
        </g>

        {/* Nodes */}
        {NODES.map((n) => (
          <Node key={n.key} cx={n.cx} cy={n.cy} label={n.label} state={state[n.key]} />
        ))}
      </svg>

      {/* Compact step-detail list — updates as the flow progresses. */}
      <ul className="mt-4 space-y-1.5 text-[11px]">
        {NODES.filter((n) => n.key !== "orchestrator").map((n) => {
          const s = state[n.key];
          const d = details?.[n.key];
          return (
            <li key={n.key} className="flex items-center gap-2.5">
              <Dot state={s} />
              <span className="w-[68px] shrink-0 text-[10px] uppercase tracking-luxe text-muted-foreground">
                {n.label}
              </span>
              <span
                className={cn(
                  "min-w-0 flex-1 truncate",
                  s === "fail" ? "text-destructive" : "text-muted-foreground",
                )}
                title={d?.error ?? d?.summary ?? ""}
              >
                {s === "pending" && "—"}
                {s === "running" && (
                  <span className="italic">{t("workflow.state.running")}…</span>
                )}
                {(s === "ok" || s === "fail") && (d?.error ?? d?.summary ?? "—")}
              </span>
              <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
                {d?.durationMs !== undefined ? `${d.durationMs}ms` : ""}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Node({
  cx,
  cy,
  label,
  state,
}: {
  cx: number;
  cy: number;
  label: string;
  state: AgentState;
}) {
  const fill =
    state === "ok"
      ? "hsl(var(--foreground))"
      : state === "fail"
        ? "hsl(var(--destructive))"
        : state === "running"
          ? "hsl(var(--chart-1))"
          : "hsl(var(--background))";

  const stroke =
    state === "pending" ? "hsl(var(--muted-foreground))" : "hsl(var(--card))";

  return (
    <g>
      {state === "running" && (
        // pulsing halo — feels "live"
        <circle cx={cx} cy={cy} r={2.6} fill="none" stroke="hsl(var(--chart-1))" strokeWidth="0.5">
          <animate
            attributeName="r"
            from="2.6"
            to="7"
            dur="1.4s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            from="0.7"
            to="0"
            dur="1.4s"
            repeatCount="indefinite"
          />
        </circle>
      )}
      <circle
        cx={cx}
        cy={cy}
        r={2.6}
        fill={fill}
        stroke={stroke}
        strokeWidth={0.7}
        style={{ transition: "fill 350ms" }}
      />
      <text
        x={cx}
        y={cy + 6.5}
        textAnchor="middle"
        fontSize={3.4}
        fill="hsl(var(--muted-foreground))"
        style={{ letterSpacing: "0.16em", textTransform: "uppercase" }}
      >
        {label}
      </text>
    </g>
  );
}

function Dot({ state }: { state: AgentState }) {
  return (
    <span
      className={cn(
        "inline-block h-1.5 w-1.5 shrink-0 rounded-full",
        state === "pending" && "border border-muted-foreground/40 bg-transparent",
        state === "running" && "animate-pulse bg-[hsl(var(--chart-1))]",
        state === "ok" && "bg-foreground",
        state === "fail" && "bg-destructive",
      )}
    />
  );
}
