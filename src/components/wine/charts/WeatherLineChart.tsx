"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import { useT } from "@/lib/i18n/Provider";
import { demoWeatherTimeseries } from "@/lib/demo/charts";

export function WeatherLineChart({ regionId }: { regionId: string }) {
  const t = useT();
  const data = demoWeatherTimeseries(regionId);
  return (
    <figure className="rounded-md border bg-card p-6">
      <figcaption className="mb-4 text-[10px] uppercase tracking-luxe text-muted-foreground">
        {t("trade.charts.weather")}
      </figcaption>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ left: 0, right: 12, top: 4 }}>
          <CartesianGrid strokeDasharray="2 4" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="month"
            stroke="hsl(var(--muted-foreground))"
            fontSize={10}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            yAxisId="temp"
            orientation="left"
            stroke="hsl(var(--muted-foreground))"
            fontSize={10}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            yAxisId="precip"
            orientation="right"
            stroke="hsl(var(--muted-foreground))"
            fontSize={10}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--background))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 6,
              fontSize: 12,
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em" }}
            iconType="line"
          />
          <Line
            yAxisId="temp"
            type="monotone"
            dataKey="tempAnomalyC"
            stroke="hsl(var(--chart-1))"
            strokeWidth={2}
            dot={false}
            name="Δ °C"
            animationDuration={900}
            animationEasing="ease-out"
          />
          <Line
            yAxisId="precip"
            type="monotone"
            dataKey="precipMm"
            stroke="hsl(var(--chart-4))"
            strokeWidth={2}
            dot={false}
            name="mm"
            animationDuration={900}
            animationEasing="ease-out"
          />
          <Line
            yAxisId="temp"
            type="monotone"
            dataKey="frostDays"
            stroke="hsl(var(--chart-3))"
            strokeWidth={1.5}
            strokeDasharray="4 3"
            dot={false}
            name="frost d."
            animationDuration={900}
            animationEasing="ease-out"
          />
        </LineChart>
      </ResponsiveContainer>
    </figure>
  );
}
