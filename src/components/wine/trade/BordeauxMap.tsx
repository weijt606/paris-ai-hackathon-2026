"use client";

import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import { useT } from "@/lib/i18n/Provider";
import { BORDEAUX_BENCHMARKS } from "@/lib/wine/bordeaux-benchmarks";
import { FRANCE_GEO } from "@/lib/wine/bordeaux-geo";
import CHATEAUX from "@/lib/wine/chateaux-static.json";

interface Props {
  selectedId: string;
  onSelect: (id: string, name: string) => void;
}

interface ChateauPoint {
  name: string;
  aoc: string;
  growth: string;
  growth_num: number;
  lat: number;
  lon: number;
}

// 1855 growth-number → wine-palette
const GROWTH_COLORS: Record<number, string> = {
  1: "hsl(var(--chart-5))", // Premier Cru → gold
  2: "hsl(var(--chart-2))", // 2e Cru → cognac
  3: "hsl(var(--chart-1))", // 3e Cru → bordeaux
  4: "hsl(var(--chart-3))", // 4e Cru → sage
  5: "hsl(var(--chart-4))", // 5e Cru → navy
};

// Aggregate AOC markers (existing, clickable) take their colour from the
// risk band. Match RegionalRiskChart palette for visual coherence.
function colorForScore(score: number): string {
  if (score < 40) return "hsl(var(--chart-3))";
  if (score < 55) return "hsl(var(--chart-5))";
  if (score < 70) return "hsl(var(--chart-2))";
  return "hsl(var(--chart-1))";
}

export function BordeauxMap({ selectedId, onSelect }: Props) {
  const t = useT();
  const chateaux = CHATEAUX as ChateauPoint[];

  return (
    <figure className="rounded-md border bg-card p-6">
      <figcaption className="mb-1 text-[10px] uppercase tracking-luxe text-muted-foreground">
        {t("trade.map.title")}
      </figcaption>
      <p className="mb-3 text-[10px] text-muted-foreground">
        61 × 1855 classés · 6 AOC aggregates
      </p>
      <div className="aspect-[5/4] w-full overflow-hidden">
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
                  fill="hsl(var(--muted))"
                  fillOpacity={0.45}
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

          {/* 61 individual châteaux — informational dots, sized + coloured by 1855 growth */}
          {chateaux.map((c) => (
            <Marker key={c.name} coordinates={[c.lon, c.lat]}>
              <circle
                r={c.growth_num === 1 ? 2.6 : 1.7}
                fill={GROWTH_COLORS[c.growth_num] ?? "hsl(var(--muted-foreground))"}
                fillOpacity={c.growth_num <= 2 ? 0.9 : 0.7}
                stroke="hsl(var(--background))"
                strokeWidth={0.4}
                style={{ pointerEvents: "auto" }}
              >
                <title>{`${c.name} · ${c.aoc} · ${c.growth}`}</title>
              </circle>
            </Marker>
          ))}

          {/* 6 AOC aggregate markers (clickable — drives selection / analyze) */}
          {BORDEAUX_BENCHMARKS.map((b) => {
            const active = b.id === selectedId;
            const color = colorForScore(b.score);
            return (
              <Marker key={b.id} coordinates={[b.lng, b.lat]}>
                {active && (
                  <circle
                    r={18}
                    fill={color}
                    fillOpacity={0.18}
                    style={{ transition: "all 300ms ease-out" }}
                  />
                )}
                <circle
                  r={active ? 7 : 5}
                  fill={color}
                  stroke="hsl(var(--background))"
                  strokeWidth={1.5}
                  className="cursor-pointer"
                  style={{ transition: "r 250ms ease-out, fill 250ms ease-out" }}
                  onClick={() => onSelect(b.id, b.name)}
                />
                <text
                  textAnchor="middle"
                  y={active ? -14 : -11}
                  className="pointer-events-none select-none fill-foreground"
                  style={{
                    fontSize: 9.5,
                    fontWeight: active ? 600 : 400,
                    letterSpacing: "0.02em",
                    transition: "all 250ms ease-out",
                  }}
                >
                  {b.name}
                </text>
              </Marker>
            );
          })}
        </ComposableMap>
      </div>

      {/* legend — two rows: 1855 growths (top) + AOC risk bands (bottom) */}
      <div className="mt-3 space-y-1.5">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[9px] uppercase tracking-luxe text-muted-foreground">
          <span className="font-medium">1855 cru</span>
          {[1, 2, 3, 4, 5].map((g) => (
            <span key={g} className="inline-flex items-center gap-1">
              <span
                className="inline-block rounded-full"
                style={{
                  width: g === 1 ? 6 : 4,
                  height: g === 1 ? 6 : 4,
                  background: GROWTH_COLORS[g],
                }}
              />
              {g === 1 ? "Premier" : `${g}e`}
            </span>
          ))}
        </div>
        <div className="flex items-center justify-end gap-4 text-[9px] uppercase tracking-luxe text-muted-foreground">
          <span className="font-medium">AOC risk</span>
          <span className="inline-flex items-center gap-1">
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{ background: "hsl(var(--chart-3))" }}
            />
            {t("trade.map.legend_low")}
          </span>
          <span className="inline-flex items-center gap-1">
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{ background: "hsl(var(--chart-1))" }}
            />
            {t("trade.map.legend_high")}
          </span>
        </div>
      </div>
    </figure>
  );
}
