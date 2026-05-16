"use client";

import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useT } from "@/lib/i18n/Provider";
import CHATEAUX from "@/lib/wine/chateaux-static.json";

interface Props {
  selectedChateau?: string | null;
  onChateauSelect?: (
    chateau: { name: string; aoc: string; regionId: string; regionName: string } | null,
  ) => void;
}

interface ChateauPoint {
  name: string;
  aoc: string;
  growth: string;
  growth_num: number;
  commune: string;
  lat: number;
  lon: number;
  elevation_m: number | null;
  dist_gironde_km: number | null;
}

// 1855 growth-number → wine-palette (kept in sync with workflow + charts).
const GROWTH_COLORS: Record<number, string> = {
  1: "hsl(40 50% 48%)", //  Premier Cru — gold
  2: "hsl(28 50% 42%)", //  2e Cru     — cognac
  3: "hsl(350 55% 32%)", // 3e Cru     — bordeaux
  4: "hsl(150 22% 38%)", // 4e Cru     — sage
  5: "hsl(220 30% 32%)", // 5e Cru     — navy
};

const GROWTH_LABEL: Record<number, string> = {
  1: "Premier",
  2: "Deuxième",
  3: "Troisième",
  4: "Quatrième",
  5: "Cinquième",
};

/** Map a château's AOC to its parent region id used by the dashboard. */
function regionFromAoc(aoc: string): { id: string; name: string } {
  if (aoc === "Pessac-Léognan") return { id: "bordeaux-graves", name: "Graves" };
  return { id: "bordeaux-medoc", name: "Médoc" };
}

export function BordeauxMap({ selectedChateau, onChateauSelect }: Props) {
  const t = useT();
  const chateauNorm = (selectedChateau ?? "").toLowerCase();
  const chateaux = CHATEAUX as ChateauPoint[];

  return (
    <figure className="rounded-md border bg-card p-6">
      <figcaption className="mb-1 text-[10px] uppercase tracking-luxe text-muted-foreground">
        {t("trade.map.title")}
      </figcaption>
      <p className="mb-3 text-[10px] text-muted-foreground">
        61 × 1855 classés · scroll / pinch to zoom · click château to focus
      </p>

      <div className="aspect-[5/4] w-full overflow-hidden rounded-md border bg-muted/30">
        <MapContainer
          center={[45.05, -0.7]}
          zoom={9}
          minZoom={8}
          maxZoom={13}
          scrollWheelZoom
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> · <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            subdomains={["a", "b", "c", "d"]}
          />

          {chateaux.map((c) => {
            const isActive =
              chateauNorm.length > 0 && c.name.toLowerCase().includes(chateauNorm);
            const baseR = c.growth_num === 1 ? 7 : 5;
            const r = isActive ? baseR + 2 : baseR;
            const color = GROWTH_COLORS[c.growth_num] ?? "#888";

            return (
              <CircleMarker
                key={c.name}
                center={[c.lat, c.lon]}
                radius={r}
                pathOptions={{
                  color: isActive ? "#000" : "#fff",
                  weight: isActive ? 2 : 1,
                  fillColor: color,
                  fillOpacity: 0.88,
                }}
                eventHandlers={{
                  click: () => {
                    if (!onChateauSelect) return;
                    if (isActive) {
                      onChateauSelect(null);
                    } else {
                      const region = regionFromAoc(c.aoc);
                      onChateauSelect({
                        name: c.name,
                        aoc: c.aoc,
                        regionId: region.id,
                        regionName: region.name,
                      });
                    }
                  },
                }}
              >
                <Popup>
                  <div className="text-xs leading-relaxed">
                    <div className="text-[13px] font-semibold">{c.name}</div>
                    <div className="mt-0.5 text-muted-foreground">
                      {GROWTH_LABEL[c.growth_num] ?? `${c.growth_num}e`} Cru · {c.aoc}
                    </div>
                    <div className="text-muted-foreground">{c.commune}</div>
                    {(c.elevation_m !== null || c.dist_gironde_km !== null) && (
                      <div className="mt-1.5 font-mono text-[10px] text-muted-foreground">
                        {c.elevation_m !== null && `${Math.round(c.elevation_m)} m`}
                        {c.elevation_m !== null && c.dist_gironde_km !== null && " · "}
                        {c.dist_gironde_km !== null &&
                          `${c.dist_gironde_km.toFixed(1)} km from Gironde`}
                      </div>
                    )}
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[9px] uppercase tracking-luxe text-muted-foreground">
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
    </figure>
  );
}
