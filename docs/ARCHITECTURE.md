# Architecture

## Why this shape

The hackathon is **one day** with **~7 hours** of actual coding. The scaffold's job is to absorb every infrastructure decision in advance so the sprint is pure feature work.

Three principles:

1. **Sponsor-agnostic** — Don't bet on a specific track/sponsor before the event. Pre-wire every sponsor; let the chosen product decide on the day.
2. **Env-gated everything** — Missing keys must return `503`, not crash. The repo must run on zero keys (demo mode).
3. **Public-safe** — Shared with organizers. No secrets, no internal links, no PII.

## Module map

```
src/lib/
├── env.ts          # zod-validated server env + sponsors presence map
├── env.public.ts   # client-safe subset (NEXT_PUBLIC_* only)
├── utils.ts        # cn() + SponsorUnavailableError
├── ai/             # text generation
│   ├── openai.ts
│   ├── anthropic.ts
│   └── index.ts    # provider-router with fallback
├── media/
│   └── fal.ts      # image/video
├── voice/
│   ├── gradium.ts  # STT + TTS
│   └── slng.ts     # real-time voice agent
├── db/             # Drizzle + sqlite, optional
└── demo/
    └── fixtures.ts # demo-mode deterministic responses
```

### Adapter contract

Every adapter file follows the same shape:

```ts
import "server-only";
import { env, isDemoMode, sponsors } from "@/lib/env";
import { SponsorUnavailableError } from "@/lib/utils";

let _client: Client | null = null;

function ensure(): Client {
  if (!sponsors.<name> || !env.<NAME>_API_KEY) throw new SponsorUnavailableError("<name>");
  if (!_client) _client = new Client(...);
  return _client;
}

export async function someCall(input): Promise<SomeOutput> {
  if (isDemoMode) return demoFixture(input);
  const client = ensure();
  return await client.do(input);
}
```

This guarantees:
- Adapters never crash on import (no top-level connection)
- A clear error path for missing config (`503` in routes)
- A demo-mode branch on every external call

### API route contract

```ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { SponsorUnavailableError } from "@/lib/utils";

export const runtime = "nodejs";

const Body = z.object({ /* ... */ });

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  try {
    return NextResponse.json(await someAdapterCall(parsed.data));
  } catch (err) {
    if (err instanceof SponsorUnavailableError) {
      return NextResponse.json({ error: err.message, sponsor: err.sponsor }, { status: 503 });
    }
    console.error(err);
    return NextResponse.json({ error: "Internal" }, { status: 500 });
  }
}
```

## What's intentionally NOT here

| Absent | Why |
|---|---|
| Auth (Clerk, NextAuth, Lucia) | A demo doesn't need users. Add only if the chosen product requires it. |
| Payment (Stripe, Paddle) | Hackathon, not SaaS launch. |
| GTM / SEO / OG / sitemap | Time stolen from the feature. |
| Postgres / cloud DB | sqlite is enough for a 7h demo. Migrate only if scale matters in the demo. |
| Auto-deploy CI/CD | `git push` + Vercel "import repo" covers it. Pre-link before the event. |
| Multi-region, CDN tuning | Out of scope. Vercel defaults are fine. |
| E2E test suite | Demo IS the test. Manual rehearsal × 3. |

## Adding a new sponsor adapter (template)

1. Add the env vars in `src/lib/env.ts` (server schema) and `.env.example`.
2. Create `src/lib/<category>/<sponsor>.ts` following the adapter contract.
3. Add a fixture branch in `src/lib/demo/fixtures.ts`.
4. (Optional) Create `src/app/api/<endpoint>/route.ts` if it needs an HTTP surface.
5. Add a check in `scripts/check-env.ts` so pre-flight verifies the key.
6. Add a row to the home page sponsor grid in `src/app/page.tsx`.
