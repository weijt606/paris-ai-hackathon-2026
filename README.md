# 🍇 Wine Signals — Paris AI Hackathon 2026

Multi-agent risk + market intelligence for French wine regions (Burgundy & Bordeaux). Built for the Paris AI Hackathon 2026.

**Sponsors:** OpenAI · Tavily · Pioneer.ai
**Architecture:** Orchestrator (OpenAI Chat Completions tool-use loop) → weather / geo / tavily sub-agents → extraction_agent → dashboard. Pioneer.ai GLiNER2 classifier (trained on wine-industry data) consumed via `classify()` from extraction / feature agents.

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

## Project layout

```
src/
├── app/
│   ├── api/
│   │   ├── analyze/route.ts       # POST → orchestrator
│   │   └── health/route.ts
│   ├── scaffold/page.tsx          # provider/integration status
│   ├── page.tsx                   # wine dashboard
│   ├── layout.tsx · globals.css
├── components/wine/               # dashboard UI
│   ├── AnalyzePanel.tsx           # parent: state + fetch
│   ├── PersonaToggle.tsx          # vineyard | trade
│   ├── RegionPicker.tsx           # Burgundy / Bordeaux
│   ├── RiskCard.tsx               # score, drivers, recommendations
│   └── SignalsList.tsx            # agent trace
├── lib/
│   ├── agents/                    # ← agent framework
│   │   ├── orchestrator.ts        # OpenAI tool-use loop (routing layer)
│   │   ├── types.ts               # SubAgent contract, runAgentSafely
│   │   ├── extraction.ts          # risk evaluator (heuristic stub)
│   │   ├── feature.ts             # feature layer (TBD)
│   │   └── sub-agents/
│   │       ├── weather.ts         # climate + forecast (stub)
│   │       ├── geo.ts             # terroir + appellation (stub)
│   │       └── tavily.ts          # public-web grounding (stub)
│   ├── ai/openai.ts               # lazy OpenAI client (used by orchestrator)
│   ├── training/pioneer.ts        # Pioneer GLiNER2 classifier (classify())
│   ├── wine/                      # domain
│   │   ├── types.ts               # AnalyzeInput, AnalyzeResult, etc.
│   │   └── regions.ts             # static Burgundy + Bordeaux list
│   ├── demo/fixtures.ts           # demo-mode AnalyzeResult
│   ├── env.ts                     # zod-validated env
│   └── utils.ts                   # cn() + SponsorUnavailableError
docs/AGENTS.zh.md                  # collab guide (Chinese)
scripts/check-env.ts               # pre-flight key check
CLAUDE.md                          # project rules (loaded into every AI session)
```

## API contract

`POST /api/analyze` — see [`docs/AGENTS.zh.md` §8](docs/AGENTS.zh.md) for the full request/response shape. Demo-mode and missing-key fallbacks return `isDemoOrPartial: true` so the UI can flag degraded results.

## For collaborators

Read [`docs/AGENTS.zh.md`](docs/AGENTS.zh.md) first — it lays out who owns which sub-agent, the SubAgent contract, the 4-step recipe to replace a stub, and the PR checklist.

## Conventions

- Strict TypeScript, no `any`, `noUncheckedIndexedAccess` on.
- Server-only modules import `"server-only"` at the top.
- Every sub-agent: env-gated, demo-mode aware, lazy client init.
- Never commit `.env*` (only `.env.example`). Plain commits, no AI co-author trailer.

## License

MIT
