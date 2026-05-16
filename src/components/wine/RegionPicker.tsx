"use client";

import { REGIONS } from "@/lib/wine/regions";
import type { Region } from "@/lib/wine/types";

interface Props {
  value: string;
  onChange: (r: Pick<Region, "id" | "name" | "parent">) => void;
}

export function RegionPicker({ value, onChange }: Props) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">Region</span>
      <select
        value={value}
        onChange={(e) => {
          const r = REGIONS.find((x) => x.id === e.target.value);
          if (r) onChange({ id: r.id, name: r.name, parent: r.parent });
        }}
        className="rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <optgroup label="Burgundy">
          {REGIONS.filter((r) => r.parent === "burgundy").map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </optgroup>
        <optgroup label="Bordeaux">
          {REGIONS.filter((r) => r.parent === "bordeaux").map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </optgroup>
      </select>
    </label>
  );
}
