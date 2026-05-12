# Track pivot kit

At 10:45 you confirm the track. From there you have ~6h45m to ship + 1h to rehearse. This document tells you exactly what to do in the first 30 minutes.

## Minute-by-minute (10:45 → 11:15)

```
10:45 – 10:50  Pick the track. Pick the product (one sentence, one feature).
10:50 – 10:55  Sanity check against project_paris_hackathon memory:
                 - Sponsor depth ≥ 2?
                 - Social/emotional hook?
                 - Demo-able in 90 seconds?
                 - 7h feasible?
10:55 – 11:00  Copy the template:
                 cp -r src/app/\(track\)/template src/app/\(track\)/<slug>
                 Edit page.tsx with the product name, drop the demo widgets.
11:00 – 11:10  Wire the core API call. Pick ONE adapter from src/lib/, prove
                 it works end-to-end with a hardcoded prompt.
11:10 – 11:15  Push first commit. Confirm Vercel preview builds.
```

If you're not past "core API call works" by 11:15, you're behind. Cut scope.

## Choosing a stack within the scaffold

| If the track is about… | Use these adapters | Wire order |
|---|---|---|
| Text generation / agents | `lib/ai/index.ts` (auto-fallback) | chat → UI → fixtures |
| Image / video | `lib/media/fal.ts` + `lib/ai/index.ts` for prompts | image → UI → fixtures |
| Voice in / out | `lib/voice/gradium.ts` + `lib/ai/index.ts` | mic UI → STT → LLM → TTS → fixtures |
| Real-time conversation | `lib/voice/slng.ts` + `lib/ai/index.ts` | agent session → UI → fixtures |
| Multimodal storytelling | `lib/ai` + `lib/media/fal` + `lib/voice/gradium` | text → image → voice → fixtures |

## What to leave alone

- Don't touch `src/lib/env.ts` unless you're adding a brand-new sponsor
- Don't add auth/payment/SEO infra (see CLAUDE.md rule H4)
- Don't restructure the adapter pattern — it's the demo-mode contract
- Don't `git push --force`; teammates may be pulling

## Renaming the route group

The template lives at `src/app/(track)/template/`. To create your real product page:

```bash
# from repo root
cp -r 'src/app/(track)/template' 'src/app/(track)/your-slug'
```

`(track)` is a [route group](https://nextjs.org/docs/app/building-your-application/routing/route-groups) — it doesn't appear in the URL. So `src/app/(track)/your-slug/page.tsx` is served at `/your-slug`. Update the Quick links section in `src/app/page.tsx` to link to it.

## When you have ≤2 hours left

Stop adding features. Spend the time on:

1. **Demo fixtures** — every sponsor call must have a `DEMO_MODE` branch
2. **Error handling** — 503s must produce friendly UI, not crashes
3. **Visual polish** — judges form opinions on UI in 5 seconds; clean Tailwind beats fancy interactions
4. **Demo script** — see [DEMO_PLAYBOOK.md](DEMO_PLAYBOOK.md), practice 3×
