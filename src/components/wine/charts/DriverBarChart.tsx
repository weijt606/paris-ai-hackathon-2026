"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useT } from "@/lib/i18n/Provider";
import type { RiskDriver } from "@/lib/wine/types";

// Source-coded palette aligned with the wine theme tokens.
const COLORS: Record<RiskDriver["source"], string> = {
  weather: "hsl(var(--chart-4))",     // navy
  geo: "hsl(var(--chart-2))",         // cognac
  tavily: "hsl(var(--chart-5))",      // gold
  extraction: "hsl(var(--chart-1))",  // bordeaux
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
    <figure className="rounded-md border bg-card p-6">
      <figcaption className="mb-4 text-[10px] uppercase tracking-luxe text-muted-foreground">
        {t("trade.charts.drivers")}
      </figcaption>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} layout="vertical" margin={{ left: 4, right: 12 }}>
          <XAxis
            type="number"
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
            stroke="hsl(var(--muted-foreground))"
            fontSize={10}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            stroke="hsl(var(--muted-foreground))"
            fontSize={11}
            width={70}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            cursor={{ fill: "hsl(var(--muted))", opacity: 0.5 }}
            contentStyle={{
              background: "hsl(var(--background))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 6,
              fontSize: 12,
              padding: "8px 12px",
            }}
            formatter={(value, _name, item) => {
              const signal = (item?.payload as { signal?: string } | undefined)?.signal;
              return [`${value}% · ${signal ?? ""}`, "weight"];
            }}
          />
          <Bar
            dataKey="weight"
            radius={[0, 3, 3, 0]}
            animationDuration={800}
            animationEasing="ease-out"
          />
        </BarChart>
      </ResponsiveContainer>
    </figure>
  );
}
