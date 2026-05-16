"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useT } from "@/lib/i18n/Provider";
import type { RiskDriver } from "@/lib/wine/types";

// Source-coded palette aligned with the wine theme tokens.
const COLORS: Record<RiskDriver["source"], string> = {
  weather: "hsl(var(--chart-4))",    // navy
  geo: "hsl(var(--chart-2))",        // cognac
  tavily: "hsl(var(--chart-5))",     // gold
  extraction: "hsl(var(--chart-1))", // bordeaux
};

export function DriverDonutChart({ drivers }: { drivers: RiskDriver[] }) {
  const t = useT();
  const data = drivers.map((d) => ({
    name: d.source,
    value: Math.round(d.weight * 100),
    signal: d.signal,
    fill: COLORS[d.source],
  }));

  return (
    <figure className="rounded-md border bg-card p-6">
      <figcaption className="mb-4 text-[10px] uppercase tracking-luxe text-muted-foreground">
        {t("trade.charts.drivers")}
      </figcaption>
      <div className="grid items-center gap-6 md:grid-cols-[180px_1fr]">
        <div className="mx-auto">
          <ResponsiveContainer width={180} height={180}>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={78}
                paddingAngle={2}
                stroke="hsl(var(--background))"
                strokeWidth={2}
                animationDuration={900}
                animationEasing="ease-out"
              >
                {data.map((d) => (
                  <Cell key={d.name} fill={d.fill} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 6,
                  fontSize: 12,
                  padding: "8px 12px",
                  maxWidth: 280,
                }}
                formatter={(value, _name, item) => {
                  const signal = (item?.payload as { signal?: string } | undefined)?.signal;
                  return [`${value}% · ${signal ?? ""}`, ""];
                }}
                separator=""
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <ul className="space-y-2.5">
          {data.map((d) => (
            <li key={d.name} className="flex items-start gap-3 text-sm">
              <span
                className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ background: d.fill }}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[10px] uppercase tracking-luxe text-muted-foreground">
                    {d.name}
                  </span>
                  <span className="font-mono text-xs tabular-nums">{d.value}%</span>
                </div>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  {d.signal}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </figure>
  );
}
