"use client";

import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import { useT } from "@/lib/i18n/Provider";
import { BORDEAUX_BENCHMARKS } from "@/lib/wine/bordeaux-benchmarks";
import { FRANCE_GEO } from "@/lib/wine/bordeaux-geo";

interface Props {
  selectedId: string;
  onSelect: (id: string, name: string) => void;
}

function colorForScore(score: number): string {
  if (score < 40) return "#10b981";
  if (score < 55) return "#f59e0b";
  if (score < 70) return "#ef4444";
  return "#7f1d1d";
}

export function BordeauxMap({ selectedId, onSelect }: Props) {
  const t = useT();
  return (
    <div className="rounded-xl border p-4">
      <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {t("trade.map.title")}
      </h3>
      <div className="aspect-[5/4] w-full overflow-hidden rounded-lg bg-muted/30">
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ center: [-0.5, 44.85], scale: 7500 }}
          width={500}
          height={400}
          style={{ width: "100%", height: "100%" }}
        >
          <Geographies geography={FRANCE_GEO as unknown as object}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="hsl(var(--background))"
                  stroke="hsl(var(--border))"
                  strokeWidth={0.6}
                  style={{
                    default: { outline: "none" },
                    hover: { outline: "none" },
                    pressed: { outline: "none" },
                  }}
                />
              ))
            }
          </Geographies>
          {BORDEAUX_BENCHMARKS.map((b) => {
            const active = b.id === selectedId;
            return (
              <Marker key={b.id} coordinates={[b.lng, b.lat]}>
                <circle
                  r={active ? 12 : 8}
                  fill={colorForScore(b.score)}
                  stroke={active ? "hsl(var(--foreground))" : "#fff"}
                  strokeWidth={active ? 2.5 : 1.2}
                  className="cursor-pointer transition-all"
                  style={{ filter: active ? "drop-shadow(0 0 4px rgba(0,0,0,0.3))" : undefined }}
                  onClick={() => onSelect(b.id, b.name)}
                />
                <text
                  textAnchor="middle"
                  y={active ? -16 : -12}
                  className="pointer-events-none select-none fill-current text-[10px] font-medium"
                  style={{ fontWeight: active ? 700 : 500 }}
                >
                  {b.name}
                </text>
              </Marker>
            );
          })}
        </ComposableMap>
      </div>
      <div className="mt-3 flex items-center justify-end gap-4 text-[10px] uppercase tracking-wide text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          {t("trade.map.legend_low")}
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-amber-500" />
          {t("result.band.elevated")}
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-red-600" />
          {t("trade.map.legend_high")}
        </span>
      </div>
    </div>
  );
}
