"use client";

import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useT } from "@/lib/i18n/Provider";
import { BORDEAUX_BENCHMARKS } from "@/lib/wine/bordeaux-benchmarks";

function color(score: number): string {
  if (score < 40) return "#10b981";
  if (score < 55) return "#f59e0b";
  if (score < 70) return "#ef4444";
  return "#7f1d1d";
}

export function RegionalRiskChart({ selectedId }: { selectedId: string }) {
  const t = useT();
  const data = BORDEAUX_BENCHMARKS.map((b) => ({
    name: b.name,
    score: b.score,
    active: b.id === selectedId,
  }));
  return (
    <div className="rounded-xl border p-4">
      <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {t("trade.charts.regional")}
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ left: 0, right: 12, top: 6 }}>
          <XAxis dataKey="name" interval={0} fontSize={10} angle={-15} textAnchor="end" height={50} />
          <YAxis domain={[0, 100]} fontSize={10} />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--background))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(v) => [`${v}`, "score"]}
          />
          <Bar dataKey="score" radius={[4, 4, 0, 0]}>
            {data.map((d) => (
              <Cell
                key={d.name}
                fill={color(d.score)}
                stroke={d.active ? "hsl(var(--foreground))" : undefined}
                strokeWidth={d.active ? 2 : 0}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
