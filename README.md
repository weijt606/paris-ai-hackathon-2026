# 🍇 Wine Signals — Paris AI Hackathon 2026

Multi-agent risk + market intelligence for French wine regions (Burgundy & Bordeaux). Built for the Paris AI Hackathon 2026.

**Sponsors:** OpenAI · Tavily · Pioneer.ai
**Architecture:** Input → OpenAI orchestrator (tool-use loop) → three parallel **real** sub-agents (weather: ERA5+SEAS5 climate · geo: 61-château 1855 terroir · tavily: 5-channel Bordeaux harness, SQLite-cached) → schema-grounded extraction (OpenAI + 1150-line wine-vintage-quality-schema, 28 features × 6 hard gates × 11 dynamic adjustments) → feature agent (Pioneer-hosted wine LLM with OpenAI fallback) → dashboard + report + email digest. Orchestrator-level result cache (30 min TTL) makes repeat requests near-instant.

## Quick start

```bash
pnpm install
cp .env.example .env.local       # fill OPENAI_API_KEY (required)
pnpm check:env                   # verify OpenAI + Tavily + Pioneer keys
pnpm dev                         # → http://localhost:3000
```

Demo-mode end-to-end (no keys needed):

```bash
NEXT_PUBLIC_DEMO_MODE=true pnpm dev
# → orchestrator returns fixtures from src/lib/demo/fixtures.ts
```

## Architecture — end-to-end

The system is a pipeline of OpenAI-driven agents wired by a single tool-use loop. Six numbered stages from user click to dashboard render:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ 1. INPUT LAYER                                                                  │
│    Dashboard → POST /api/analyze (zod-validated)                                │
│    Body: { region, persona, timeframe, question?, uploads? }                    │
└────────────────────────────────────┬────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ 2. ORCHESTRATOR — src/lib/agents/orchestrator.ts                                │
│    OpenAI Chat Completions tool-use loop · MAX_STEPS = 10                       │
│    Registers 5 sub-agents as function tools. System prompt enforces order:      │
│      a. weather + geo + tavily (parallel allowed)                               │
│      b. extraction_agent (only after all three return)                          │
│      c. feature_agent (only after extraction)                                   │
│      d. end turn                                                                │
└──┬─────────────────────┬─────────────────────┬──────────────────────────────────┘
   │                     │                     │
   ▼                     ▼                     ▼            (parallel fan-out)
┌─────────────┐    ┌─────────────┐    ┌──────────────┐
│ 3a. weather │    │ 3b. geo     │    │ 3c. tavily   │
│ sub-agent   │    │ sub-agent   │    │ sub-agent    │
│             │    │             │    │              │
│ ERA5 1990-  │    │ 61 × 1855   │    │ Bordeaux     │
│ 2024 DEM-   │    │ classed     │    │ harness:     │
│ downscaled  │    │ growths:    │    │ 5 source     │
│ historicals │    │ elev / TPI /│    │ types        │
│   +         │    │ Gironde dist│    │ (sentiment / │
│ SEAS5 2026  │    │ / soil clay-│    │ policy / reg │
│ ensemble    │    │ sand / aoc  │    │ / winemaker  │
│ forecast    │    │ mix         │    │ / market)    │
│             │    │             │    │ + SQLite 7-d │
│             │    │             │    │ cache layer  │
└─────┬───────┘    └─────┬───────┘    └─────┬────────┘
      │                  │                  │
      │ WeatherSignals   │ GeoSignals       │ TavilySignals
      └──────────────────┼──────────────────┘
                         │  (signals fed back as tool messages,
                         │   GPT compresses them into 1–2 sentence summaries)
                         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ 4. EXTRACTION — src/lib/agents/extraction.ts                                    │
│    Driven by OpenAI Chat Completions · response_format: json_schema (strict)    │
│                                                                                 │
│    System prompt = data/wine-vintage-quality-schema.json (1150-line scoring   │
│    model: 28 features × 6 hard event gates × 11 dynamic adjustments, plus      │
│    tavilyAgentFeatureContract for external/market signals integration).        │
│                                                                                 │
│    Input (from GPT tool-call):                                                  │
│      • regionId · persona                                                       │
│      • weatherSignal · geoSignal · tavilySignal (compact summaries)             │
│                                                                                 │
│    Internal procedure:                                                          │
│      1. Map upstream signals → feature values (gap-aware, neutral on missing)   │
│      2. weightedBaseQuality = Σ(featureScore · weight)                          │
│      3. Apply hard event gates → cap quality                                    │
│      4. Apply dynamic adjustments → ±points                                     │
│      5. risk = 100 − quality, clamp [0, 100]   ← QUALITY→RISK INVERSION         │
│                                                                                 │
│    Direct entry (bypasses GPT routing):                                         │
│      ctx.uploads — vineyard-side user uploads attached to AgentContext.         │
│      Extraction reads them as additional evidence in its OpenAI prompt.         │
│                                                                                 │
│    Output (strict JSON):                                                        │
│      • score (0–100 RISK)        • drivers[] · weights sum ≤ 1                  │
│      • qualityBand               • recommendations[] · persona-bound            │
│      • activeGates[]             • rationale                                    │
│                                                                                 │
│    Fallback ladder:                                                             │
│      tier-1 OpenAI · tier-2 heuristic stub                                      │
└────────────────────────────────────┬────────────────────────────────────────────┘
                                     │ (orchestrator compresses extraction output
                                     │  into ≤1-sentence summaries for the next tool call)
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ 5. FEATURE — src/lib/agents/feature.ts                                          │
│    Tiered LLM strategy with graceful degradation:                               │
│                                                                                 │
│      ┌─────────────────────────────────────┐                                    │
│      │ tier 1 — Pioneer.ai (preferred)     │                                    │
│      │ src/lib/training/pioneer.ts          │                                    │
│      │ OpenAI-compatible chat completions  │                                    │
│      │ hosting smaller open-source LLM     │                                    │
│      │ (Qwen / GLM / Llama 7-8B class).    │                                    │
│      │ response_format: json_object,       │                                    │
│      │ JSON-shape enforced in prompt.      │                                    │
│      │ Future: swap PIONEER_MODEL_ID to    │                                    │
│      │ a Pioneer-fine-tuned wine-domain    │                                    │
│      │ local model — same code path.       │                                    │
│      └─────────────────┬───────────────────┘                                    │
│                        │ (if null / parse fail)                                 │
│                        ▼                                                        │
│      ┌─────────────────────────────────────┐                                    │
│      │ tier 2 — OpenAI structured output   │                                    │
│      │ response_format: json_schema strict │                                    │
│      └─────────────────┬───────────────────┘                                    │
│                        │ (if null / network error)                              │
│                        ▼                                                        │
│      ┌─────────────────────────────────────┐                                    │
│      │ tier 3 — deterministic template     │                                    │
│      │ assembled from extraction output    │                                    │
│      └─────────────────────────────────────┘                                    │
│                                                                                 │
│    Input (from GPT tool-call, sourced from extraction):                         │
│      • regionId · persona · score · qualityBand                                 │
│      • driversSummary · recommendationsSummary · rationale                      │
│                                                                                 │
│    Output (3 artifacts):                                                        │
│      ┌───────────────────────┬───────────────────────┬──────────────────────┐   │
│      │ executiveSummary      │ reportMarkdown        │ emailDigest          │   │
│      │ 2 sentences           │ ~250–400-word md      │ ~5–8 lines md        │   │
│      │ → top of dashboard    │ → download / print    │ → subscribe preview  │   │
│      └───────────────────────┴───────────────────────┴──────────────────────┘   │
└────────────────────────────────────┬────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ 6. HARVEST → orchestrator.harvest()                                             │
│    Collects extraction + feature outputs from the tool trace, builds the        │
│    AnalyzeResult JSON returned to the client:                                   │
│      { riskScore, riskBand, drivers, recommendations,                           │
│        qualityBand, activeGates, rationale,                                     │
│        feature: { executiveSummary, reportMarkdown, emailDigest },              │
│        trace[], generatedAt, isDemoOrPartial }                                  │
└────────────────────────────────────┬────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ 7. UI CONSUMPTION                                                               │
│    Dashboard (vineyard | trade) renders, in order:                              │
│      • ExecutiveSummary card     ← feature.executiveSummary                     │
│      • RiskCard (animated score) ← riskScore + riskBand                         │
│      • DriverDonutChart          ← drivers[] (consulting-style callouts)        │
│      • WeatherLineChart          ← demoWeatherTimeseries (12-month composed)    │
│      • RegionalRiskChart         ← BORDEAUX_BENCHMARKS (trade only)             │
│      • SentimentDonut            ← demoSentiment (trade only)                   │
│      • WorkflowTrace SVG         ← live state machine, sidebar                  │
│      • ExportButton              ← window.print() + .md download from           │
│                                    feature.reportMarkdown                       │
│      • SubscribeDialog           ← POST /api/subscribe, with                    │
│                                    feature.emailDigest as preview               │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### LLM + data call sites

| Agent | Backend | Output format | Source / grounding |
|---|---|---|---|
| **Orchestrator** | OpenAI Chat Completions (`OPENAI_MODEL`, **gpt-4o-mini recommended** — see note below) | `tool_calls` | tool descriptors built from each SubAgent's `input_schema` |
| **weather_agent** | bundled CSV reads (no API) | structured `WeatherSignals` | `data/climate_features_downscaled.csv` (1990-2024 ERA5 DEM-downscaled) + `data/climate_features_forecast_2026.csv` (ECMWF SEAS5 ensemble) |
| **geo_agent** | bundled CSV reads (no API) | structured `GeoSignals` | `data/{chateaux,static_geo,microtopo}.csv` joined on château name |
| **tavily_agent** | Tavily Search API (real) | structured `TavilySignals` | 5-channel Bordeaux harness (sentiment / policy / regulation / winemaker / market) with trusted-domain weights; **SQLite 7-day cache** (`tavily-cache.ts`, `node:sqlite`) so repeat queries are free |
| **Extraction** | OpenAI Chat Completions (`OPENAI_MODEL`) | `response_format: json_schema` (strict) | `data/wine-vintage-quality-schema.json` (1150 lines) in system prompt |
| **Feature — tier 1** | Pioneer.ai chat completions (`PIONEER_MODEL_ID`) | `response_format: json_object` + prompt-enforced shape | own JSON contract in system prompt |
| **Feature — tier 2** | OpenAI Chat Completions (`OPENAI_MODEL`) | `response_format: json_schema` (strict) | own response schema (fallback) |
| **Orchestrator result cache** | in-memory `Map` | `AnalyzeResult` | keyed on (region · persona · timeframe · question · château · uploads-meta); 30 min TTL, LRU 64 entries |

**Model choice note** — pick `gpt-4o-mini` for `OPENAI_MODEL`. Reasoning models (gpt-5*, o-series) take **20–40s per call** because they do internal "thinking" before responding, AND they reject custom temperature, AND they don't improve quality on this task (structured JSON emission against a deterministic schema). gpt-4o-mini does the same work in ~3–6s. The orchestrator-level cache absorbs second-runs anyway, so saving the first-run latency matters most.

### Degradation ladder

Every agent falls back gracefully so the dashboard stays demoable:

```
cache hit on prior identical request ───────► return cached AnalyzeResult instantly
demo mode (NEXT_PUBLIC_DEMO_MODE=true) ────► fixture pipeline (src/lib/demo/fixtures.ts)
missing OPENAI_API_KEY ─────────────────────► fixture pipeline, flagged isDemoOrPartial
weather/geo data not in CSV ────────────────► graceful "no coverage" reply, ok:true
tavily TAVILY_API_KEY missing ──────────────► [stub] empty signals
tavily query already in SQLite cache ───────► instant return (no API call)
extraction OpenAI call fails ───────────────► extraction heuristic stub (ok:true, error logged)
schema file missing ────────────────────────► extraction heuristic stub
feature Pioneer call fails / returns null ──► feature tier-2 OpenAI structured output
feature OpenAI tier-2 also fails ───────────► feature tier-3 template (from extraction output)
sub-agent errors ───────────────────────────► trace records error, harvest still picks up data
```

## Project layout

```
src/
├── app/
│   ├── api/
│   │   ├── analyze/route.ts       # POST → orchestrator
│   │   ├── subscribe/route.ts     # POST → email subscribe (stub)
│   │   └── health/route.ts
│   ├── vineyard/page.tsx          # vineyard dashboard (with upload)
│   ├── trade/page.tsx             # trade dashboard (with Bordeaux map + charts)
│   ├── scaffold/page.tsx          # provider/integration status
│   ├── page.tsx                   # landing — entry choice
│   ├── layout.tsx · globals.css   # I18nProvider + top nav
├── components/
│   ├── i18n/LocaleSwitcher.tsx    # FR / EN / 中 toggle
│   └── wine/
│       ├── EntryChoice.tsx        # landing CTA cards
│       ├── ExecutiveSummary.tsx   # feature.executiveSummary (above RiskCard)
│       ├── RegionPicker.tsx · RiskCard.tsx
│       ├── vineyard/
│       │   ├── VineyardDashboard.tsx
│       │   └── UploadArea.tsx     # drag-drop, in-memory only
│       ├── trade/
│       │   ├── TradeDashboard.tsx
│       │   └── BordeauxMap.tsx    # react-simple-maps + inline GeoJSON
│       ├── charts/
│       │   ├── DriverDonutChart.tsx · WeatherLineChart.tsx
│       │   ├── RegionalRiskChart.tsx · SentimentDonut.tsx
│       └── shared/
│           ├── ExportButton.tsx       # window.print() + .md download
│           ├── SubscribeDialog.tsx    # form + digest preview
│           ├── TimeframePicker.tsx    # year / month / custom range
│           └── WorkflowTrace.tsx      # n8n-style SVG pipeline visual
├── lib/
│   ├── agents/                    # agent framework
│   │   ├── orchestrator.ts        # OpenAI tool-use routing loop
│   │   ├── types.ts               # SubAgent contract, runAgentSafely
│   │   ├── extraction.ts          # ← OpenAI + wine-vintage-quality-schema
│   │   ├── feature.ts             # ← OpenAI, produces summary/report/digest
│   │   └── sub-agents/
│   │       ├── weather.ts         # climate + forecast (stub)
│   │       ├── geo.ts             # terroir + appellation (stub)
│   │       └── tavily.ts          # public-web grounding (stub)
│   ├── ai/openai.ts               # lazy OpenAI client
│   ├── training/pioneer.ts        # Pioneer chat completions adapter
│   ├── i18n/                      # zh + fr + en dictionary, React provider
│   ├── wine/
│   │   ├── types.ts               # AnalyzeInput, AnalyzeResult, FeatureSummary
│   │   ├── regions.ts             # static Burgundy + Bordeaux list
│   │   ├── bordeaux-geo.ts        # inline France GeoJSON (~30 vertices)
│   │   └── bordeaux-benchmarks.ts # static appellation scores for map + chart
│   ├── demo/
│   │   ├── fixtures.ts            # demo-mode AnalyzeResult (incl. feature payload)
│   │   └── charts.ts              # client-safe chart fixtures
│   ├── hooks/
│   │   ├── useAnalysisFlow.ts     # phased state machine driving WorkflowTrace
│   │   └── useAnimatedNumber.ts   # RAF-based count-up
│   ├── env.ts                     # zod-validated env
│   └── utils.ts                   # cn() + SponsorUnavailableError
data/
└── wine-vintage-quality-schema.json   # 499-line scoring schema (extraction context)
docs/AGENTS.zh.md                      # collab guide (Chinese)
scripts/check-env.ts                   # pre-flight key check
CLAUDE.md                              # project rules (loaded into every AI session)
```

## API contract

`POST /api/analyze` — see [`docs/AGENTS.zh.md` §8](docs/AGENTS.zh.md) for the full request/response shape. The response now includes `qualityBand`, `activeGates`, `rationale`, and a `feature` object with `executiveSummary` / `reportMarkdown` / `emailDigest`. Demo-mode and missing-key fallbacks return `isDemoOrPartial: true`.

## For collaborators

Read [`docs/AGENTS.zh.md`](docs/AGENTS.zh.md) first — it lays out who owns which sub-agent, the SubAgent contract, the 4-step recipe to replace a stub, and the PR checklist.

## UI

- **Two entry routes**: `/vineyard` (with file upload) and `/trade`. Both now mount the **interactive Leaflet Bordeaux map** in the sidebar.
- **Bilingual**: EN (default) / FR toggle in top nav, in-memory.
- **Charts**: Recharts — consulting-style drivers donut · weather composed line/area/bar · regional risk · market sentiment.
- **Map**: react-leaflet over CARTO online tiles. 61 1855-classed château markers coloured by `growth_num`, click-to-focus. **Search input** filters by château / AOC / commune / cru (live count + auto fly-to single match). **Fullscreen toggle** for picking on a viewport-sized canvas.
- **Workflow visualisation**: n8n-style SVG pipeline in the sidebar — live state per agent during analysis. Step details rendered two-line so long summaries + 5-digit durations don't collide.
- **Terroir card**: structured geo_agent output (elevation, soil, Gironde distance, frost-pocket signals, AOC mix) rendered above the driver donut on both dashboards.
- **Export**: `window.print()` for PDF + direct `.md` report download (when feature_agent ran).
- **Subscribe**: email form → `/api/subscribe`, with feature_agent's email digest shown inline as a preview.

## Conventions

- Strict TypeScript, no `any`, `noUncheckedIndexedAccess` on.
- Server-only modules import `"server-only"` at the top.
- Every agent: env-gated, demo-mode aware, lazy client init, graceful fallback (never throws into the orchestrator).
- Never commit `.env*` (only `.env.example`). Plain commits, no AI co-author trailer.
- Branch names ASCII / English only.

## License

MIT
