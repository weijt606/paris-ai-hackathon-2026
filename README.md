# 🍇 Wine Signals — Paris AI Hackathon 2026

Multi-agent risk + market intelligence for French wine regions (Burgundy & Bordeaux). Built for the Paris AI Hackathon 2026.

**Sponsors:** OpenAI · Tavily · Pioneer.ai
**Architecture:** Input → OpenAI orchestrator (tool-use loop) → three parallel sub-agents (weather · geo · tavily) → schema-grounded extraction (OpenAI + wine-vintage-quality-schema) → feature agent (Pioneer-hosted wine LLM, with OpenAI as fallback) → dashboard + report + email digest.

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
│ src/lib/    │    │ src/lib/    │    │ src/lib/     │
│ agents/sub- │    │ agents/sub- │    │ agents/sub-  │
│ agents/     │    │ agents/     │    │ agents/      │
│ weather.ts  │    │ geo.ts      │    │ tavily.ts    │
│             │    │             │    │              │
│ stub →      │    │ stub →      │    │ stub →       │
│ open-meteo /│    │ INAO geo /  │    │ Tavily       │
│ Météo-France│    │ centroids   │    │ search API   │
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
│    System prompt = data/wine-vintage-quality-schema.json (499-line authoritative│
│    scoring model: 19 weighted features + 6 hard gates + 4 dynamic adjustments). │
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

### LLM call sites

| Agent | Model | Output format | Schema grounding |
|---|---|---|---|
| **Orchestrator** | `OPENAI_MODEL` (gpt-4o-mini default) | tool_calls | tool descriptors built from each SubAgent's `input_schema` |
| **Extraction** | `OPENAI_MODEL` | `response_format: json_schema` (strict) | `data/wine-vintage-quality-schema.json` in system prompt |
| **Feature — tier 1** | `PIONEER_MODEL_ID` (Pioneer-hosted wine LLM — Qwen / GLM / Llama class today; fine-tuned local later) | `response_format: json_object` + prompt-enforced shape | own JSON contract in system prompt |
| **Feature — tier 2** | `OPENAI_MODEL` | `response_format: json_schema` (strict) | own response schema (fallback) |

### Degradation ladder

Every agent falls back gracefully so the dashboard stays demoable:

```
demo mode (NEXT_PUBLIC_DEMO_MODE=true) ────► fixture pipeline (src/lib/demo/fixtures.ts)
missing OPENAI_API_KEY ─────────────────────► fixture pipeline, flagged isDemoOrPartial
extraction OpenAI call fails ───────────────► extraction heuristic stub
schema file missing ────────────────────────► extraction heuristic stub
feature Pioneer call fails / returns null ──► feature tier-2 OpenAI structured output
feature OpenAI tier-2 also fails ───────────► feature tier-3 template (from extraction output)
sub-agent (weather/geo/tavily) errors ──────► trace records ok:false, downstream continues
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

- **Two entry routes**: `/vineyard` (with file upload) and `/trade` (with Bordeaux map + 4-chart dashboard)
- **Trilingual**: FR / EN / 中 toggle in top nav (in-memory, no URL change)
- **Charts**: Recharts (drivers consulting-style donut · weather composed line/area/bar · regional risk · market sentiment)
- **Map**: react-simple-maps with inline France GeoJSON, six Bordeaux markers colored by risk
- **Workflow visualisation**: n8n-style SVG pipeline in the sidebar — live state per agent during analysis
- **Export**: `window.print()` for PDF + direct `.md` report download (when feature_agent ran)
- **Subscribe**: email form → `/api/subscribe`, with feature_agent's email digest shown inline as a preview

## Conventions

- Strict TypeScript, no `any`, `noUncheckedIndexedAccess` on.
- Server-only modules import `"server-only"` at the top.
- Every agent: env-gated, demo-mode aware, lazy client init, graceful fallback (never throws into the orchestrator).
- Never commit `.env*` (only `.env.example`). Plain commits, no AI co-author trailer.
- Branch names ASCII / English only.

## License

MIT
