"use client";

import { cn } from "@/lib/utils";
import type { Persona } from "@/lib/wine/types";

interface Props {
  value: Persona;
  onChange: (v: Persona) => void;
}

const OPTIONS: { value: Persona; label: string; sub: string }[] = [
  { value: "vineyard", label: "Vineyard", sub: "Operational risk · cultivation" },
  { value: "trade", label: "Trade", sub: "Allocation · pricing · sourcing" },
];

export function PersonaToggle({ value, onChange }: Props) {
  return (
    <div className="inline-flex rounded-lg border bg-background p-1">
      {OPTIONS.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              "flex flex-col items-start rounded-md px-4 py-2 text-left transition",
              active
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            <span className="text-sm font-medium">{o.label}</span>
            <span
              className={cn(
                "text-xs",
                active ? "text-background/70" : "text-muted-foreground",
              )}
            >
              {o.sub}
            </span>
          </button>
        );
      })}
    </div>
  );
}
