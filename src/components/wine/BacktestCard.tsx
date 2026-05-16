"use client";

import { useT } from "@/lib/i18n/Provider";
import { cn } from "@/lib/utils";
import type { BacktestSnapshot } from "@/lib/wine/types";

interface Props {
  backtest: BacktestSnapshot;
}

const VERDICT_STYLE: Record<BacktestSnapshot["verdict"], string> = {
  high_agreement: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  moderate_agreement: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  divergent: "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30",
};

const VERDICT_KEY: Record<BacktestSnapshot["verdict"], `backtest.verdict.${BacktestSnapshot["verdict"]}`> = {
  high_agreement: "backtest.verdict.high_agreement",
  moderate_agreement: "backtest.verdict.moderate_agreement",
  divergent: "backtest.verdict.divergent",
};

/**
 * Side-by-side comparison of our predicted score vs the real-world critic
 * + market reaction harvested by backtest_agent (via Tavily + OpenAI).
 * Only mounted when result.backtest exists (timeframe.end < today).
 */
export function BacktestCard({ backtest }: Props) {
  const t = useT();
  return (
    <article className="rounded-md border bg-card p-6">
      <header className="flex flex-wrap items-baseline justify-between gap-3 border-b pb-3">
        <div>
          <p className="text-[10px] uppercase tracking-luxe text-muted-foreground">
            {t("backtest.title")}
          </p>
          <p className="mt-1 font-mono text-[11px] tabular-nums text-muted-foreground">
            vintage {backtest.year}
          </p>
        </div>
        <span
          className={cn(
            "rounded-full border px-3 py-1 text-[10px] uppercase tracking-luxe",
            VERDICT_STYLE[backtest.verdict],
          )}
        >
          {t(VERDICT_KEY[backtest.verdict])}
        </span>
      </header>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {/* Predicted */}
        <div className="rounded-sm border bg-muted/30 p-5">
          <p className="text-[10px] uppercase tracking-luxe text-muted-foreground">
            {t("backtest.predicted")}
          </p>
          <p className="mt-3 font-serif text-5xl font-medium tabular-nums">
            {backtest.predictedScore}
          </p>
          {backtest.predictedBand && (
            <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
              {backtest.predictedBand}
            </p>
          )}
        </div>

        {/* Actual — critics list */}
        <div className="rounded-sm border bg-muted/30 p-5">
          <p className="text-[10px] uppercase tracking-luxe text-muted-foreground">
            {t("backtest.actual")}
          </p>
          {backtest.critics.length === 0 ? (
            <p className="mt-3 text-sm italic text-muted-foreground">
              {t("backtest.no_critics")}
            </p>
          ) : (
            <ul className="mt-3 space-y-2.5">
              {backtest.critics.slice(0, 4).map((c, i) => (
                <li key={i} className="flex items-baseline gap-3 text-sm">
                  <span className="min-w-[80px] shrink-0 text-[10px] uppercase tracking-luxe text-muted-foreground">
                    {c.source}
                  </span>
                  <span className="font-mono text-xs tabular-nums">
                    {c.score !== undefined ? `${c.score}` : ""}
                    {c.scale ? ` ${c.scale}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Accuracy paragraph */}
      <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
        {backtest.accuracySummary}
      </p>

      {/* Quotes */}
      {backtest.critics.some((c) => c.quote) && (
        <ul className="mt-5 space-y-3 border-t pt-5">
          {backtest.critics.map((c, i) =>
            c.quote ? (
              <li key={i} className="text-sm leading-relaxed">
                <p className="text-[10px] uppercase tracking-luxe text-muted-foreground">
                  {c.source}
                  {c.url && (
                    <>
                      {" · "}
                      <a
                        href={c.url}
                        target="_blank"
                        rel="noreferrer"
                        className="underline-offset-2 hover:underline"
                      >
                        source
                      </a>
                    </>
                  )}
                </p>
                <p className="mt-1 text-foreground/90">&ldquo;{c.quote}&rdquo;</p>
              </li>
            ) : null,
          )}
        </ul>
      )}
    </article>
  );
}
