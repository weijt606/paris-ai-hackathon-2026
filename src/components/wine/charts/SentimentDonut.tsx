"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useT } from "@/lib/i18n/Provider";
import { demoSentiment, type SentimentSlice } from "@/lib/demo/charts";

const COLORS: Record<SentimentSlice["label"], string> = {
  positive: "#10b981",
  neutral: "#a1a1aa",
  negative: "#ef4444",
};

export function SentimentDonut({ regionId }: { regionId: string }) {
  const t = useT();
  const data = demoSentiment(regionId);
  return (
    <div className="rounded-xl border p-4">
      <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {t("trade.charts.sentiment")}
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
          >
            {data.map((d) => (
              <Cell key={d.label} fill={COLORS[d.label]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "hsl(var(--background))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(v, n) => [`${v}%`, String(n ?? "")]}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-2 flex justify-center gap-4 text-[10px] uppercase tracking-wide text-muted-foreground">
        {data.map((d) => (
          <span key={d.label} className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full" style={{ background: COLORS[d.label] }} />
            {d.label} {d.value}%
          </span>
        ))}
      </div>
    </div>
  );
}
