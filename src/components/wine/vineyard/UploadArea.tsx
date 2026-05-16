"use client";

import { useRef, useState } from "react";
import { useT } from "@/lib/i18n/Provider";
import { cn } from "@/lib/utils";
import type { UploadMeta } from "@/lib/wine/types";

interface Props {
  uploads: UploadMeta[];
  onChange: (next: UploadMeta[]) => void;
}

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB cap per file (metadata-only path)

export function UploadArea({ uploads, onChange }: Props) {
  const t = useT();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function addFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const additions: UploadMeta[] = [];
    for (const f of Array.from(files)) {
      if (f.size > MAX_SIZE) continue;
      additions.push({
        name: f.name,
        size: f.size,
        mime: f.type || "application/octet-stream",
      });
    }
    onChange([...uploads, ...additions]);
  }

  function remove(idx: number) {
    onChange(uploads.filter((_, i) => i !== idx));
  }

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <span className="text-[10px] uppercase tracking-luxe text-muted-foreground">
          {t("vineyard.upload.title")}
        </span>
        {uploads.length > 0 && (
          <span className="text-[10px] uppercase tracking-luxe text-emerald-700 dark:text-emerald-300">
            ✓ {t("vineyard.upload.context_badge", { n: uploads.length })}
          </span>
        )}
      </div>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          addFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex flex-1 cursor-pointer items-center justify-center rounded-sm border border-dashed px-4 py-5 text-center text-xs transition",
          dragging
            ? "border-foreground bg-muted/50"
            : "border-border text-muted-foreground hover:border-foreground/40 hover:bg-muted/30",
        )}
      >
        <span>{t("vineyard.upload.hint")}</span>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          accept=".pdf,.csv,.xlsx,.png,.jpg,.jpeg"
          onChange={(e) => {
            addFiles(e.target.files);
            if (inputRef.current) inputRef.current.value = "";
          }}
        />
      </div>
      {uploads.length > 0 && (
        <ul className="space-y-1">
          {uploads.map((u, i) => (
            <li
              key={`${u.name}-${i}`}
              className="flex items-center gap-2 rounded-sm border bg-background px-3 py-1.5 text-xs"
            >
              <span className="flex-1 truncate">{u.name}</span>
              <span className="font-mono text-[10px] text-muted-foreground">
                {(u.size / 1024).toFixed(1)} KB
              </span>
              <button
                type="button"
                onClick={() => remove(i)}
                className="ml-1 text-muted-foreground hover:text-destructive"
                aria-label={t("vineyard.upload.remove")}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
