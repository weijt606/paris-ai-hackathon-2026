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
    <div className="rounded-xl border p-4">
      <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {t("trade.charts.weather")}
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ left: 0, right: 12, top: 6 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="month" fontSize={10} />
          <YAxis yAxisId="temp" orientation="left" fontSize={10} />
          <YAxis yAxisId="precip" orientation="right" fontSize={10} />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--background))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Line
            yAxisId="temp"
            type="monotone"
            dataKey="tempAnomalyC"
            stroke="#ef4444"
            strokeWidth={2}
            dot={false}
            name="Δ°C"
          />
          <Line
            yAxisId="precip"
            type="monotone"
            dataKey="precipMm"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            name="mm"
          />
          <Line
            yAxisId="temp"
            type="monotone"
            dataKey="frostDays"
            stroke="#a855f7"
            strokeWidth={2}
            strokeDasharray="4 2"
            dot={false}
            name="frost d."
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
