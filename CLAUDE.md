# CLAUDE.md — Paris AI Hackathon 2026

This file is loaded into every Claude Code session in this repo.

## Project context

- **Event:** Paris AI Hackathon 2026 — single-day sprint hosted by {Tech: Europe} + Hexa
- **Format:** ~7h coding window (10:45 → 17:30), Live demo at 18:00, max 80 attendees
- **Sponsors with credits:** OpenAI, Anthropic, Fal (image/video), Gradium (TTS/STT), Slng.ai (voice infra)
- **Repo visibility:** Shared with teammates AND hackathon organizers — never commit secrets or PII
- **Goal of this scaffold:** Pre-wire infrastructure so the 7h sprint is pure product work, not boilerplate

## Stack

- Next.js 15 (App Router) + React 19 + TypeScript (strict)
- Tailwind v3 + shadcn-style primitives
- Vercel AI SDK + direct SDKs for each sponsor (env-gated adapters under `src/lib/`)
- Drizzle + better-sqlite3 (local-first DB; cloud DB only if a feature needs it)
- pnpm (`>=10`), node `>=20`

## Sprint-day workflow

Pre-event:
1. `pnpm install` (do this BEFORE the event — don't waste sprint time on dependency resolution)
2. `cp .env.example .env.local` and fill in sponsor keys received from organizers
3. `pnpm check:env` to verify each key actually works — don't trust "key present"; verify it pings
4. `pnpm dev` and confirm `/api/health` shows all sponsors `configured: true`
5. Set `NEXT_PUBLIC_DEMO_MODE=true` and re-test end-to-end on fixtures alone — this is the rehearsal fallback

On the day:
1. Confirm track at 10:45 → copy `src/app/(track)/_template/` to `src/app/(track)/<your-track>/`
2. Build core loop inside that folder; use adapters from `src/lib/`, do not call sponsor SDKs directly elsewhere
3. Feature freeze at T-1h before submission. Switch to demo-mode rehearsal.
4. Live demo at 18:00 — practice the script ≥3 times.

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

### Rule H2 — Sponsor adapters are gated
Every sponsor call must go through `src/lib/{ai,media,voice}/`. Missing keys must return 503,
not crash. Rate limits and outages happen during demos — assume the worst.

### Rule H3 — Demo mode is sacred
`NEXT_PUBLIC_DEMO_MODE=true` must always produce a functional end-to-end flow against
`src/lib/demo/fixtures.ts`. This is the offline-rehearsal contract. Every new sponsor call
must add a fixture branch.

### Rule H4 — No GTM, no SEO, no payment, no auth
Unless the chosen product truly demands it. Hackathon scoring is product + demo,
not distribution. Time spent on `deployment-handbook` infra is time stolen from the feature.

### Rule H5 — No "Co-Authored-By: Claude" trailers
Plain `git commit -m "..."`. No AI-attribution trailer in this repo.
