# Paris AI Hackathon 2026

Team scaffold for the Paris AI Hackathon — single-day sprint, ~7h coding window, live demo at 18:00.

Sponsor adapters are pre-wired and env-gated. On event day, copy the track template, build inside it, and ship.

## Stack

- Next.js 15 (App Router) + React 19 + TypeScript (strict)
- Tailwind CSS v3
- Vercel AI SDK + direct sponsor SDKs (OpenAI / Anthropic / Fal / Gradium / Slng.ai)
- Drizzle ORM + better-sqlite3 (local DB; only if your product needs persistence)
- pnpm

## Quick start

```bash
pnpm install
cp .env.example .env.local        # fill in any sponsor keys you have
pnpm check:env                    # verify each key actually pings
pnpm dev
```

Open <http://localhost:3000>. The home page shows which sponsors are configured.

## What's pre-wired

| Adapter | Path | Demo route |
|---|---|---|
| OpenAI chat | `src/lib/ai/openai.ts` | `POST /api/chat` (provider=openai) |
| Anthropic chat | `src/lib/ai/anthropic.ts` | `POST /api/chat` (provider=anthropic) |
| Provider-agnostic chat with auto-fallback | `src/lib/ai/index.ts` | `POST /api/chat` |
| Fal image gen | `src/lib/media/fal.ts` | `POST /api/image` |
| Gradium STT | `src/lib/voice/gradium.ts` | `POST /api/stt` (multipart audio) |
| Gradium TTS | `src/lib/voice/gradium.ts` | `POST /api/tts` |
| Slng.ai voice agent (REST stub) | `src/lib/voice/slng.ts` | — |

Adapters all share the same contract: missing env key → throw `SponsorUnavailableError` → API returns `503` with which sponsor is missing.

## Demo mode

Set `NEXT_PUBLIC_DEMO_MODE=true` and every sponsor call returns deterministic fixtures from `src/lib/demo/fixtures.ts`. Use this to rehearse the live demo without burning credits.

## Event-day flow

1. **10:45** — Confirm chosen track. Copy the template:
   ```bash
   cp -r src/app/\(track\)/template src/app/\(track\)/<your-track>
   ```
2. **11:15 → 15:30** — Build inside `src/app/(track)/<your-track>/`. Always import from `src/lib/*`, never call sponsor SDKs directly from components.
3. **15:30 → 16:30** — UI polish, add fixtures for every new sponsor call, set `DEMO_MODE=true`, rehearse.
4. **16:30 → 17:30** — Live-demo rehearsal × 3. Feature freeze.
5. **17:30** — Submit. **18:00** — Live demo.

## Repo layout

```
src/
├── app/
│   ├── api/{chat,image,stt,tts,health}/route.ts   # sponsor-backed HTTP routes
│   ├── (track)/template/                           # copy on event day
│   ├── layout.tsx · page.tsx · globals.css
├── components/voice/MicCapture.tsx                 # browser mic → /api/stt
├── lib/
│   ├── env.ts · env.public.ts                      # zod-validated env, sponsor presence flags
│   ├── ai/{openai,anthropic,index}.ts              # LLM adapters + fallback router
│   ├── media/fal.ts                                # image/video gen
│   ├── voice/{gradium,slng}.ts                     # voice adapters
│   ├── db/{index,schema}.ts                        # Drizzle + sqlite (optional)
│   ├── demo/fixtures.ts                            # demo-mode responses
│   └── utils.ts                                    # cn(), SponsorUnavailableError
docs/                                               # ARCHITECTURE, SPONSORS, DEMO_PLAYBOOK, TRACK_PIVOT_KIT
scripts/check-env.ts                                # pre-flight key check
```

## Conventions

- Strict TypeScript, no `any`. `noUncheckedIndexedAccess` is on.
- Server-only modules import `"server-only"` at the top.
- Every sponsor adapter: lazy client init, env-gated, demo-mode branch.
- Never commit `.env*` (only `.env.example`). Never commit personal info or internal links.
- Plain commit messages. No AI co-author trailer.

## Docs

- [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md) — **Start here if you're a teammate.** Mental model, recipes, parallel-work rules, debug guide.
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — Why this shape, what's intentionally absent
- [`docs/SPONSORS.md`](docs/SPONSORS.md) — Per-sponsor integration notes + gotchas
- [`docs/DEMO_PLAYBOOK.md`](docs/DEMO_PLAYBOOK.md) — Live-demo dos and don'ts (Berlin lessons)
- [`docs/TRACK_PIVOT_KIT.md`](docs/TRACK_PIVOT_KIT.md) — How to fork the template on event day

## License

MIT
