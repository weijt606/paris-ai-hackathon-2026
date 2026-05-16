"use client";

import { useT } from "@/lib/i18n/Provider";

export function ExportButton() {
  const t = useT();
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-sm border bg-background px-4 py-2 text-[10px] uppercase tracking-luxe transition-colors hover:bg-muted print:hidden"
    >
      {t("common.export_report")}
    </button>
  );
}
