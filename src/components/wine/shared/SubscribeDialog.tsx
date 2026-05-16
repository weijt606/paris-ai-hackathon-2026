"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n/Provider";
import type { Persona } from "@/lib/wine/types";

interface Props {
  regionId?: string;
  persona?: Persona;
}

export function SubscribeDialog({ regionId, persona }: Props) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, regionId, persona }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSuccess(true);
      setTimeout(() => {
        setOpen(false);
        setSuccess(false);
        setEmail("");
      }, 1800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Subscribe failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted print:hidden"
      >
        ✉ {t("common.subscribe")}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4 print:hidden"
          onClick={() => !submitting && setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-xl border bg-background p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold">{t("subscribe.title")}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{t("subscribe.description")}</p>

            {success ? (
              <p className="mt-6 rounded-md bg-emerald-500/15 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
                ✓ {t("subscribe.success")}
              </p>
            ) : (
              <form onSubmit={submit} className="mt-4 space-y-3">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("subscribe.email_placeholder")}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  disabled={submitting}
                />
                {error && (
                  <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                    {error}
                  </p>
                )}
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    disabled={submitting}
                    className="rounded-md px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted"
                  >
                    {t("common.cancel")}
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-md bg-foreground px-4 py-1.5 text-xs font-medium text-background hover:opacity-90 disabled:opacity-50"
                  >
                    {submitting ? t("common.running") : t("common.confirm")}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
