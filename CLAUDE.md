# CLAUDE.md — Paris AI Hackathon 2026

This file is loaded into every Claude Code session in this repo.

## Project context

- **Event:** Paris AI Hackathon 2026 — single-day sprint hosted by {Tech: Europe} + Hexa
- **Format:** ~7h coding window (10:45 → 17:30), Live demo at 18:00
- **Chosen product:** Wine intelligence — risk + market signals for Burgundy & Bordeaux, dual persona (vineyard | trade).
- **Sponsors:** OpenAI · Tavily · Pioneer.ai
- **Architecture:** Orchestrator agent (OpenAI Chat Completions tool-use loop) → weather/geo/tavily sub-agents → extraction_agent → dashboard. Pioneer.ai GLiNER2 classifier consumed via `classify()` from extraction / feature agents.
- **Repo visibility:** Shared with teammates AND hackathon organizers — never commit secrets or PII.
- **Collab doc:** [`docs/AGENTS.md`](docs/AGENTS.md) — architecture, file map, SubAgent contract.
- **Sponsor doc:** [`docs/SPONSORS.md`](docs/SPONSORS.md) — OpenAI / Tavily / Pioneer.ai usage + degradation ladder.

## Stack

- Next.js 15 (App Router) + React 19 + TypeScript (strict)
- Tailwind v3
- `openai` SDK (Chat Completions tool-use orchestrator)
- Tavily (public-web grounding, called via `fetch`)
- Pioneer.ai GLiNER2 inference API (called via `fetch`)
- `zod` for env + API validation
- pnpm (`>=10`), node `>=20`

No DB, no Vercel AI SDK, no shadcn — kept tight to what the agents actually need.

## Sprint-day workflow

Pre-event:
1. `pnpm install`
2. `cp .env.example .env.local`, fill `OPENAI_API_KEY` (required), `TAVILY_API_KEY` + `PIONEER_API_KEY` + `PIONEER_MODEL_ID` (optional)
3. `pnpm check:env` to verify OpenAI actually pings
4. `pnpm dev` and confirm `/api/health` returns 200
5. Set `NEXT_PUBLIC_DEMO_MODE=true` and re-test `/api/analyze` end-to-end on fixtures — this is the rehearsal fallback

On the day:
1. Each sub-agent owner pulls latest, branches `agent/<name>`, replaces stub body in `src/lib/agents/sub-agents/<name>.ts`
2. Honor the SubAgent contract — orchestrator + types are off-limits
3. Add a demo fixture branch for every new external call (H3)
4. Feature freeze at T-1h before submission. Switch to demo-mode rehearsal.
5. Live demo at 18:00 — practice the script ≥3 times.

## Project rules

These rules apply to every task in this project unless explicitly overridden.
Bias: caution over speed on non-trivial work. Use judgment on trivial tasks.

### Rule 1 — Think Before Coding
State assumptions explicitly. If uncertain, ask rather than guess.
Present multiple interpretations when ambiguity exists.
Push back when a simpler approach exists.
Stop when confused. Name what's unclear.

### Rule 2 — Simplicity First
Minimum code that solves the problem. Nothing speculative.
No features beyond what was asked. No abstractions for single-use code.
Test: would a senior engineer say this is overcomplicated? If yes, simplify.

### Rule 3 — Surgical Changes
Touch only what you must. Clean up only your own mess.
Don't "improve" adjacent code, comments, or formatting.
Don't refactor what isn't broken. Match existing style.

### Rule 4 — Goal-Driven Execution
Define success criteria. Loop until verified.
Don't follow steps. Define success and iterate.
Strong success criteria let you loop independently.

### Rule 5 — Use the model only for judgment calls
Use the LLM for: classification, drafting, summarization, extraction.
Do NOT use the LLM for: routing, retries, deterministic transforms.
If code can answer, code answers.

### Rule 6 — Token budgets are not advisory
Per-task: 4,000 tokens. Per-session: 30,000 tokens.
If approaching budget, summarize and start fresh.
Surface the breach. Do not silently overrun.

### Rule 7 — Surface conflicts, don't average them
If two patterns contradict, pick one (more recent / more tested).
Explain why. Flag the other for cleanup.
Don't blend conflicting patterns.

### Rule 8 — Read before you write
Before adding code, read exports, immediate callers, shared utilities.
"Looks orthogonal" is dangerous. If unsure why code is structured a way, ask.

### Rule 9 — Tests verify intent, not just behavior
Tests must encode WHY behavior matters, not just WHAT it does.
A test that can't fail when business logic changes is wrong.

### Rule 10 — Checkpoint after every significant step
Summarize what was done, what's verified, what's left.
Don't continue from a state you can't describe back.
If you lose track, stop and restate.

### Rule 11 — Match the codebase's conventions, even if you disagree
Conformance > taste inside the codebase.
If you genuinely think a convention is harmful, surface it. Don't fork silently.

### Rule 12 — Fail loud
"Completed" is wrong if anything was skipped silently.
"Tests pass" is wrong if any were skipped.
Default to surfacing uncertainty, not hiding it.

## Hackathon-specific rules

### Rule H1 — Public-safe commits
This repo is shared with hackathon organizers. Never commit:
- `.env*` files (only `.env.example` is allowed)
- Personal info (real names beyond GitHub handle, addresses, phone, internal Slack handles)
- API keys, OAuth secrets, JWT secrets, credentials
- Internal-team document links
Run `git diff --cached` and scan for tokens before committing. If unsure, ask.

### Rule H2 — Adapters are gated
Every external API call must go through `src/lib/{ai,training}/` or a sub-agent under
`src/lib/agents/sub-agents/`. Missing keys must return 503 or degrade to a stub —
never crash. Rate limits and outages happen during demos — assume the worst.

### Rule H3 — Demo mode is sacred
`NEXT_PUBLIC_DEMO_MODE=true` must always produce a functional end-to-end flow against
`src/lib/demo/fixtures.ts`. This is the offline-rehearsal contract. Every new sponsor call
must add a fixture branch.

### Rule H4 — No GTM, no SEO, no payment, no auth
Unless the chosen product truly demands it. Hackathon scoring is product + demo,
not distribution. Time spent on `deployment-handbook` infra is time stolen from the feature.

### Rule H5 — No "Co-Authored-By: Claude" trailers
Plain `git commit -m "..."`. No AI-attribution trailer in this repo.
