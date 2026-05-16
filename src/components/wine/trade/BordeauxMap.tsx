"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import type { Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";
import { useT } from "@/lib/i18n/Provider";
import { cn } from "@/lib/utils";
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

// 1855 growth-number → wine-palette (synced with workflow + charts).
const GROWTH_COLORS: Record<number, string> = {
  1: "hsl(40 50% 48%)", // Premier Cru — gold
  2: "hsl(28 50% 42%)", // 2e Cru     — cognac
  3: "hsl(350 55% 32%)", // 3e Cru    — bordeaux
  4: "hsl(150 22% 38%)", // 4e Cru    — sage
  5: "hsl(220 30% 32%)", // 5e Cru    — navy
};

const GROWTH_LABEL: Record<number, string> = {
  1: "Premier",
  2: "Deuxième",
  3: "Troisième",
  4: "Quatrième",
  5: "Cinquième",
};

function regionFromAoc(aoc: string): { id: string; name: string } {
  if (aoc === "Pessac-Léognan") return { id: "bordeaux-graves", name: "Graves" };
  return { id: "bordeaux-medoc", name: "Médoc" };
}

function matchesQuery(c: ChateauPoint, q: string): boolean {
  if (!q) return true;
  const needle = q.toLowerCase();
  return (
    c.name.toLowerCase().includes(needle) ||
    c.aoc.toLowerCase().includes(needle) ||
    c.commune.toLowerCase().includes(needle) ||
    c.growth.toLowerCase().includes(needle)
  );
}

/** Imperative pan/zoom helper — when query has exactly one match, fly to it. */
function FlyTo({ target }: { target: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo(target, 11, { duration: 0.5 });
  }, [target, map]);
  return null;
}

/** Invalidate size after fullscreen toggle so Leaflet re-measures. */
function ResizeHook({ trigger }: { trigger: unknown }) {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 250);
    return () => clearTimeout(t);
  }, [trigger, map]);
  return null;
}

export function BordeauxMap({ selectedChateau, onChateauSelect }: Props) {
  const t = useT();
  const chateaux = CHATEAUX as ChateauPoint[];

  const [query, setQuery] = useState("");
  const [fullscreen, setFullscreen] = useState(false);
  const mapRef = useRef<LeafletMap | null>(null);

  const filtered = useMemo(() => chateaux.filter((c) => matchesQuery(c, query)), [chateaux, query]);
  const flyTarget: [number, number] | null =
    filtered.length === 1 && query.length > 0
      ? [filtered[0]!.lat, filtered[0]!.lon]
      : null;

  // Exit fullscreen on Escape.
  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullscreen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fullscreen]);

  const chateauNorm = (selectedChateau ?? "").toLowerCase();

  const mapBody = (
    <MapContainer
      ref={(m) => {
        mapRef.current = m ?? null;
      }}
      center={[45.05, -0.7]}
      zoom={9}
      minZoom={7}
      maxZoom={14}
      scrollWheelZoom
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> · <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        subdomains={["a", "b", "c", "d"]}
      />
      <FlyTo target={flyTarget} />
      <ResizeHook trigger={fullscreen} />

      {filtered.map((c) => {
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
  );

  const searchBar = (
    <div className="relative">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t("trade.map.search_placeholder")}
        className="w-full rounded-sm border bg-background px-3 py-2 pr-10 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
      />
      {query && (
        <button
          type="button"
          onClick={() => setQuery("")}
          aria-label={t("common.clear")}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full px-1.5 text-[11px] text-muted-foreground hover:text-foreground"
        >
          ×
        </button>
      )}
      {query && (
        <p className="mt-1.5 text-[10px] uppercase tracking-luxe text-muted-foreground">
          {filtered.length > 0
            ? `${filtered.length} ${filtered.length === 1 ? "match" : "matches"}`
            : t("trade.map.no_match")}
        </p>
      )}
    </div>
  );

  const fullscreenBtn = (
    <button
      type="button"
      onClick={() => setFullscreen((v) => !v)}
      aria-label={fullscreen ? t("common.exit_fullscreen") : t("common.fullscreen")}
      className="rounded-sm border bg-background px-2 py-1 text-[10px] uppercase tracking-luxe text-muted-foreground hover:text-foreground"
    >
      {fullscreen ? "× " + t("common.close") : "⤢ " + t("common.fullscreen")}
    </button>
  );

  const legend = (
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
  );

  if (fullscreen) {
    return (
      <div
        className={cn(
          "fixed inset-0 z-50 flex flex-col gap-3 bg-background p-6",
          "animate-in fade-in duration-150",
        )}
      >
        <header className="flex items-baseline justify-between gap-3">
          <p className="text-[10px] uppercase tracking-luxe text-muted-foreground">
            {t("trade.map.title")}
          </p>
          {fullscreenBtn}
        </header>
        {searchBar}
        <div className="flex-1 overflow-hidden rounded-md border bg-muted/30">
          {mapBody}
        </div>
        {legend}
      </div>
    );
  }

  return (
    <figure className="rounded-md border bg-card p-6">
      <header className="mb-1 flex items-baseline justify-between gap-3">
        <p className="text-[10px] uppercase tracking-luxe text-muted-foreground">
          {t("trade.map.title")}
        </p>
        {fullscreenBtn}
      </header>
      <p className="mb-3 text-[10px] text-muted-foreground">
        61 × 1855 classés · scroll to zoom · click to focus
      </p>

      <div className="mb-3">{searchBar}</div>

      <div className="aspect-[5/4] w-full overflow-hidden rounded-md border bg-muted/30">
        {mapBody}
      </div>

      <div className="mt-3">{legend}</div>
    </figure>
  );
}
