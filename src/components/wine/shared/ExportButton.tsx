"use client";

import { useT } from "@/lib/i18n/Provider";

export function ExportButton() {
  const t = useT();
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-md border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted print:hidden"
    >
      📄 {t("common.export_report")}
    </button>
  );
}
