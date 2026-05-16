import Link from "next/link";

export const metadata = {
  title: "How Wine Signals works — Blog",
  description: "Architecture, agents, and FAQ behind the Wine Signals multi-agent pipeline.",
};

interface QA {
  q: string;
  a: string;
}

const FAQ: QA[] = [
  {
    q: "What problem does Wine Signals solve?",
    a: "It produces a structured vintage-quality + risk forecast for French wine regions (Burgundy & Bordeaux), aimed at vineyard operators (operational risk) and trade buyers (allocation / pricing decisions). Outputs include a numeric score, drivers, persona-aware recommendations, an executive summary, a downloadable report, an email digest, and — when the requested vintage is historical — a backtest comparing the prediction to real critic + market reactions.",
  },
  {
    q: "Why a multi-agent architecture?",
    a: "Wine quality depends on heterogeneous evidence — climate, geography/terroir, market sentiment, regulation. Each sub-agent owns one evidence channel with its own data source. The orchestrator (an OpenAI tool-use loop) decides when to invoke them, then extraction synthesises everything against the wine-vintage-quality-schema. Splitting the work makes the pipeline easier to debug, test, and progressively upgrade.",
  },
  {
    q: "Where does the climate data come from?",
    a: "weather_agent reads DEM-downscaled ERA5 (1990–2024 historicals) and the ECMWF SEAS5 seasonal ensemble (2026 forecast). Both are bundled CSVs — no network call at request time. Coverage is the 61 left-bank 1855-classed châteaux; right-bank and Burgundy fall through gracefully.",
  },
  {
    q: "What's the wine-vintage-quality-schema?",
    a: "A 1150-line JSON model (data/wine-vintage-quality-schema.json) defining 28 weighted features, 6 hard event gates (catastrophic-vintage caps), and 11 dynamic adjustments. It encodes references like Ashenfelter 1995, Jones 2005, Tonietto & Carbonneau 2004 — and a tavilyAgentFeatureContract for external/market signal integration. extraction_agent passes this schema to OpenAI as system prompt context.",
  },
  {
    q: "How does the orchestrator choose which agents to call?",
    a: "A standard OpenAI Chat Completions tool-use loop. Every sub-agent's input_schema is registered as a function tool. A system prompt enforces order: 1) weather + geo + tavily in parallel, 2) extraction, 3) feature, 4) backtest (only when isBacktest=true), 5) end turn. GPT may call tools in parallel within a single turn.",
  },
  {
    q: "What does the tavily_agent do?",
    a: "Tavily Search API harness covering 5 Bordeaux source channels: sentiment / policy / regulation / winemaker / market. It applies trusted-domain weighting (INAO, agriculture.gouv.fr, Decanter, Jancis Robinson, Wine-Searcher…), URL dedupe, and a quality filter. A SQLite cache (node:sqlite, 7-day TTL) survives across requests so repeat queries hit local storage instead of the API.",
  },
  {
    q: "Why both an OpenAI extraction and a Pioneer feature agent?",
    a: "extraction emits strict JSON against a 5K-token schema — a deterministic structured-output task. We use OpenAI gpt-4o-mini for it (recommended over reasoning models like gpt-5* / o-series, which would take 20-40s per call without quality gain). feature is short-form packaging (2-sentence summary, 250-word report, 5-line digest) where a Pioneer-hosted 7-8B open-source model (Qwen / Llama / GLM class) is sufficient, cheaper, and bakes a path for domain fine-tuning. Pioneer is the preferred tier; OpenAI is the tier-2 fallback; a deterministic template is tier-3 so the dashboard never blanks.",
  },
  {
    q: "Which OpenAI model should OPENAI_MODEL point to?",
    a: "gpt-4o-mini. The orchestrator + extraction + backtest tasks are 'follow the schema, emit JSON' — no chain-of-thought reasoning required. gpt-4o-mini does each call in 3-6s; reasoning models (gpt-5*, o-series) do 20-40s of internal thinking with no quality improvement on these structured tasks, and they reject custom temperature. The orchestrator-level result cache absorbs repeat runs, so first-call latency is the actual demo bottleneck — that's where the model choice matters.",
  },
  {
    q: "What's backtest mode?",
    a: "When the requested timeframe ends before today, the system runs the entire forward-looking pipeline AND additionally calls backtest_agent, which uses Tavily to retrieve real critic scores (Wine Advocate / Decanter / Vinous / Liv-ex / Jancis Robinson…) for that vintage. OpenAI then compares those observations to our prediction and emits one of: high_agreement, moderate_agreement, divergent. The Backtest card on the dashboard renders the side-by-side.",
  },
  {
    q: "Is there a cache?",
    a: "Two layers. (1) An orchestrator-level in-memory result cache keyed on (region · persona · timeframe · question · château · uploads-meta) with a 30-minute TTL and 64-entry LRU — repeated identical requests return instantly. (2) The tavily_agent's SQLite cache (`tavily-cache.ts`) caches individual search queries for 7 days. Together they make demo replays near-instant while still doing fresh work on novel inputs.",
  },
  {
    q: "How are the dashboards different?",
    a: "Same agent pipeline, persona-differentiated outputs. /vineyard emphasises operational signals (frost protection, harvest timing) and supports vineyard-document upload that feeds directly into extraction's prompt. /trade emphasises allocation / pricing decisions, adds a regional risk comparison chart and a market sentiment donut. Both dashboards mount the interactive Leaflet Bordeaux map with 61 1855-classed château markers, search input, and fullscreen toggle.",
  },
  {
    q: "What if an LLM call fails or a key is missing?",
    a: "Every layer has a graceful fallback. demo mode returns hand-tuned fixtures. Missing OPENAI_API_KEY returns the fixture pipeline flagged isDemoOrPartial. extraction's OpenAI failure falls back to a heuristic stub (still returns valid score + drivers). feature falls Pioneer → OpenAI → template. Sub-agent errors are logged in the trace but never crash the orchestrator. The cache only stores complete (non-partial) results so a degraded run doesn't poison subsequent requests.",
  },
  {
    q: "What sponsors are integrated?",
    a: "OpenAI (orchestrator + extraction + feature tier-2 + backtest), Tavily (tavily_agent + backtest_agent search retrieval), Pioneer.ai (feature tier-1 — Pioneer-hosted wine LLM, fine-tunable for domain specialisation).",
  },
];

interface StageBox {
  index: string;
  title: string;
  body: string;
  source: string;
}

const STAGES: StageBox[] = [
  {
    index: "1",
    title: "Input layer",
    body: "User submits region / persona / timeframe (+ optional château, uploads, question) via POST /api/analyze.",
    source: "src/app/api/analyze/route.ts",
  },
  {
    index: "2",
    title: "Orchestrator",
    body: "OpenAI Chat Completions tool-use loop. Each sub-agent is registered as a function tool. System prompt enforces call order.",
    source: "src/lib/agents/orchestrator.ts",
  },
  {
    index: "3a",
    title: "weather_agent — climate signals",
    body: "Reads DEM-downscaled ERA5 (1990–2024 historicals) plus the ECMWF SEAS5 ensemble (2026 seasonal forecast) from bundled CSVs. Returns GST, harvest rain, heat-stress days, frost days, winter rain, diurnal range, and derived Huglin / cool-night indices. Pass a château name for a single-site read; coverage is the 61 left-bank 1855-classed growths.",
    source: "src/lib/agents/sub-agents/weather.ts · src/lib/wine/climate.ts",
  },
  {
    index: "3b",
    title: "geo_agent — terroir context",
    body: "Joins three bundled CSVs (chateaux geocodes / static_geo features / microtopo TPI) on château name. Returns elevation, distance to Gironde + Atlantic, TPI cold-air-pooling signal, slope + aspect, soil clay/sand/silt %, and AOC mix per region. Drives the Terroir card and explains the 'why' behind weather signals.",
    source: "src/lib/agents/sub-agents/geo.ts · src/lib/wine/chateaux.ts",
  },
  {
    index: "3c",
    title: "tavily_agent — public-web grounding",
    body: "Bordeaux-focused harness across five source channels (sentiment / policy / regulation / winemaker / market) with trusted-domain weighting (INAO, agriculture.gouv.fr, Decanter, Jancis Robinson, Wine-Searcher…), URL dedupe, and quality filter. A SQLite cache (node:sqlite, 7-day TTL) survives across requests so repeat queries hit local storage instead of the Tavily API.",
    source: "src/lib/agents/sub-agents/tavily.ts · src/lib/agents/sub-agents/tavily-cache.ts",
  },
  {
    index: "4",
    title: "Extraction",
    body: "OpenAI structured output grounded in the 1150-line wine-vintage-quality-schema. 28 features × 6 gates × 11 dynamic adjustments. Computes quality → inverts to risk.",
    source: "src/lib/agents/extraction.ts",
  },
  {
    index: "5",
    title: "Feature",
    body: "Tiered: Pioneer (preferred) → OpenAI → template. Outputs executive summary + markdown report + email digest.",
    source: "src/lib/agents/feature.ts",
  },
  {
    index: "6",
    title: "Backtest (historical timeframes only)",
    body: "Tavily retrieves real critic scores + market reactions; OpenAI compares to our prediction and emits a directional verdict.",
    source: "src/lib/agents/sub-agents/backtest.ts",
  },
  {
    index: "7",
    title: "Harvest + dashboard",
    body: "AnalyzeResult JSON returned to the client; UI renders summary, risk card, terroir card, charts, workflow trace, and (when present) backtest comparison.",
    source: "src/lib/agents/orchestrator.ts · src/components/wine/*",
  },
];

export default function BlogPage() {
  return (
    <main className="container mx-auto max-w-3xl px-6 py-16">
      <header className="mb-12">
        <p className="text-[10px] uppercase tracking-luxe text-muted-foreground">
          Wine Signals · Engineering blog
        </p>
        <h1 className="mt-3 font-serif text-4xl font-medium leading-tight tracking-tight md:text-5xl">
          How Wine Signals works
        </h1>
        <p className="mt-4 max-w-prose text-sm leading-relaxed text-muted-foreground">
          A multi-agent pipeline that turns climate, terroir, and market signals into a
          vintage-quality forecast for Burgundy &amp; Bordeaux. This page walks through the
          architecture and answers the questions we get most often.
        </p>
      </header>

      <section className="mb-16">
        <h2 className="mb-6 font-serif text-2xl font-medium tracking-tight">Architecture</h2>
        <ol className="space-y-4">
          {STAGES.map((s) => (
            <li
              key={s.index}
              className="grid gap-3 rounded-md border bg-card p-5 md:grid-cols-[32px_1fr]"
            >
              <span className="font-mono text-sm tabular-nums text-muted-foreground">
                {s.index}
              </span>
              <div className="min-w-0">
                <p className="font-medium">{s.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
                <p className="mt-2 font-mono text-[10px] text-muted-foreground">{s.source}</p>
              </div>
            </li>
          ))}
        </ol>

      </section>

      <section className="mb-12">
        <h2 className="mb-6 font-serif text-2xl font-medium tracking-tight">Q&amp;A</h2>
        <div className="space-y-6">
          {FAQ.map((qa, i) => (
            <details
              key={i}
              className="group rounded-md border bg-card p-5 open:bg-muted/30"
            >
              <summary className="cursor-pointer list-none font-medium text-foreground">
                <span className="mr-3 font-mono text-xs tabular-nums text-muted-foreground">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {qa.q}
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{qa.a}</p>
            </details>
          ))}
        </div>
      </section>

      <nav className="border-t pt-8 text-[11px] uppercase tracking-luxe">
        <ul className="flex flex-wrap gap-6 text-muted-foreground">
          <li>
            <Link href="/" className="hover:text-foreground">
              Home
            </Link>
          </li>
          <li>
            <Link href="/vineyard" className="hover:text-foreground">
              Vineyard
            </Link>
          </li>
          <li>
            <Link href="/trade" className="hover:text-foreground">
              Trade
            </Link>
          </li>
          <li>
            <Link href="/scaffold" className="hover:text-foreground">
              Config
            </Link>
          </li>
        </ul>
      </nav>
    </main>
  );
}
