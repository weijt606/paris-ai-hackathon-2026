"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useT } from "@/lib/i18n/Provider";
import type { RiskDriver } from "@/lib/wine/types";

const COLORS: Record<RiskDriver["source"], string> = {
  weather: "#3b82f6",
  geo: "#a855f7",
  tavily: "#f59e0b",
  extraction: "#ef4444",
};

export function DriverBarChart({ drivers }: { drivers: RiskDriver[] }) {
  const t = useT();
  const data = drivers.map((d) => ({
    name: d.source,
    weight: Math.round(d.weight * 100),
    signal: d.signal,
    fill: COLORS[d.source],
  }));
  return (
    <div className="rounded-xl border p-4">
      <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {t("trade.charts.drivers")}
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} layout="vertical" margin={{ left: 12, right: 24 }}>
          <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} fontSize={10} />
          <YAxis type="category" dataKey="name" fontSize={11} width={70} />
          <Tooltip
            cursor={{ fill: "var(--muted)" }}
            contentStyle={{
              background: "hsl(var(--background))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(value, _name, item) => {
              const signal = (item?.payload as { signal?: string } | undefined)?.signal;
              return [`${value}% · ${signal ?? ""}`, "weight"];
            }}
          />
          <Bar dataKey="weight" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
