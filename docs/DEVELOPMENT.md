# Development guide

For teammates building on top of this scaffold. Read this once, refer back when stuck.

> If you're trying to **decide what to build**, see [`TRACK_PIVOT_KIT.md`](TRACK_PIVOT_KIT.md).
> If you're trying to **understand why the code is shaped this way**, see [`ARCHITECTURE.md`](ARCHITECTURE.md).
> If you're trying to **demo the product**, see [`DEMO_PLAYBOOK.md`](DEMO_PLAYBOOK.md).
> This doc is about **how we work together in this repo**.

---

## 1. Quick start (30 seconds)

```bash
git clone https://github.com/weijt606/paris-ai-hackathon-2026.git
cd paris-ai-hackathon-2026
pnpm install
cp .env.example .env.local            # leave keys blank if you don't have them yet
pnpm dev                              # → http://localhost:3000
```

The home page shows which sponsors are configured. Everything works with zero keys (demo mode) — set `NEXT_PUBLIC_DEMO_MODE=true` in `.env.local` to force fixture responses.

---

## 2. Mental model — three layers

```
┌─────────────────────────────────────────────────────────┐
│  PRODUCT LAYER         src/app/(track)/<slug>/          │  ← what you build
│  Your pages, your components, your business logic       │
├─────────────────────────────────────────────────────────┤
│  HTTP LAYER            src/app/api/*/route.ts           │  ← stable contracts
│  POST { input } → { output } — never crashes            │
├─────────────────────────────────────────────────────────┤
│  ADAPTER LAYER         src/lib/{ai,media,voice,db}/     │  ← shared infra
│  Sponsor SDK wrappers, env-gated, demo-mode aware       │
└─────────────────────────────────────────────────────────┘
```

**The contract between layers:**

- **Product layer** only imports from `@/lib/*` (typed helpers) or calls `/api/*` over fetch. Never imports `openai` / `@anthropic-ai/sdk` directly.
- **HTTP layer** only imports adapters from `@/lib/*` and validates input with zod. Always catches `SponsorUnavailableError` → 503.
- **Adapter layer** is the only place that touches a sponsor SDK. Every external call has an `if (isDemoMode) return fixture()` branch.

If you stay inside this contract, your code keeps working when:
- A sponsor's API rate-limits you mid-demo (rotate provider via the fallback router)
- You demo from a venue with bad WiFi (flip `DEMO_MODE=true`)
- A teammate is in the middle of refactoring an adapter (you depend on the HTTP route, not the SDK shape)

---

## 3. Pre-existing capabilities (use these before building new ones)

### LLM chat (auto-fallback)

```ts
// Server component / API route
import { chat } from "@/lib/ai";
const { text, provider } = await chat([
  { role: "system", content: "Be concise." },
  { role: "user", content: "Hello from Paris." },
]);
```

```ts
// Client component
const res = await fetch("/api/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    messages: [{ role: "user", content: "Hello" }],
    provider: "anthropic",  // optional; omit for auto
  }),
});
const { text, provider } = await res.json();
```

The router tries the requested provider first, then falls back to the other. Berlin lesson: don't rely on a single provider being up during a demo.

### Image generation

```ts
import { generateImage } from "@/lib/media/fal";
const { images } = await generateImage({ prompt: "a paris cafe at dawn" });
```

Or over HTTP: `POST /api/image` with `{ prompt, imageSize?, numImages? }`.

### Voice (mic → text → audio)

```tsx
// Drop-in component, already wired
import { MicCapture } from "@/components/voice/MicCapture";

export default function Page() {
  return <MicCapture />;
}
```

It hits `/api/stt` (Gradium STT). For text-to-speech:

```ts
const res = await fetch("/api/tts", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ text: "Hello", voice: "default" }),
});
const audioBlob = await res.blob();
new Audio(URL.createObjectURL(audioBlob)).play();
```

### Real-time voice agent (Slng.ai)

```ts
import { createAgent } from "@/lib/voice/slng";
const session = await createAgent({
  name: "Paris demo bot",
  systemPrompt: "You help users explore Paris.",
});
// session.websocketUrl → connect from the browser
```

This is a stub — confirm endpoint shape with the Slng.ai rep on event day.

### Database (only if needed)

```ts
import { db, schema } from "@/lib/db";
await db.insert(schema.messages).values({ sessionId, role: "user", content: "hi" });
const recent = await db.select().from(schema.messages).limit(20);
```

Generate migrations after schema changes:

```bash
pnpm db:generate
pnpm db:migrate
```

---

## 4. Recipes — common tasks

### 4a. Build a new feature page

```bash
# On event day, after picking the product:
cp -r 'src/app/(track)/template' 'src/app/(track)/your-slug'
# Edit src/app/(track)/your-slug/page.tsx with the actual product.
# Available at http://localhost:3000/your-slug
```

Keep `src/app/(track)/template` untouched as a reference.

### 4b. Add a new sponsor adapter

1. Add env vars to `src/lib/env.ts` (server schema) AND `.env.example`:
   ```ts
   NEWSPONSOR_API_KEY: z.string().min(1).optional(),
   NEWSPONSOR_BASE_URL: z.string().url().default("https://api.newsponsor.com"),
   ```
   And in the `sponsors` map:
   ```ts
   newsponsor: Boolean(env.NEWSPONSOR_API_KEY),
   ```

2. Create `src/lib/<category>/newsponsor.ts` following the contract:
   ```ts
   import "server-only";
   import { env, isDemoMode, sponsors } from "@/lib/env";
   import { SponsorUnavailableError } from "@/lib/utils";

   function ensure() {
     if (!sponsors.newsponsor || !env.NEWSPONSOR_API_KEY) {
       throw new SponsorUnavailableError("newsponsor");
     }
     return { key: env.NEWSPONSOR_API_KEY, base: env.NEWSPONSOR_BASE_URL };
   }

   export async function doThing(input: { x: string }) {
     if (isDemoMode) return { result: `(demo) ${input.x}` };
     const { key, base } = ensure();
     const res = await fetch(`${base}/v1/thing`, { /* ... */ });
     if (!res.ok) throw new Error(`NewSponsor failed: ${res.status}`);
     return await res.json();
   }
   ```

3. Add a demo branch to `src/lib/demo/fixtures.ts` (or inline as above).

4. (Optional) Wrap in an HTTP route at `src/app/api/<endpoint>/route.ts` — follow the existing routes as a template.

5. Add a check in `scripts/check-env.ts`.

6. Add a row to the sponsor grid in `src/app/page.tsx`.

### 4c. Add a new API route

```ts
// src/app/api/your-route/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { yourAdapter } from "@/lib/...";
import { SponsorUnavailableError } from "@/lib/utils";

export const runtime = "nodejs";

const Body = z.object({ prompt: z.string().min(1) });

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  try {
    return NextResponse.json(await yourAdapter(parsed.data));
  } catch (err) {
    if (err instanceof SponsorUnavailableError) {
      return NextResponse.json({ error: err.message, sponsor: err.sponsor }, { status: 503 });
    }
    console.error("[/api/your-route]", err);
    return NextResponse.json({ error: "Internal" }, { status: 500 });
  }
}
```

### 4d. Add a client component

```tsx
"use client";
import { useState } from "react";

export function YourThing() {
  const [text, setText] = useState("");
  async function go() {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "user", content: text }] }),
    });
    const { text: reply } = await res.json();
    // ...
  }
  return /* ... */;
}
```

`"use client"` is required for `useState`, event handlers, browser APIs. Server components are the default — don't add `"use client"` if you don't need it.

### 4e. Add a DB table

Edit `src/lib/db/schema.ts`, then:

```bash
pnpm db:generate    # creates migration SQL in src/lib/db/migrations/
pnpm db:migrate     # applies to ./data/dev.db
```

---

## 5. Working in parallel without stepping on each other

For a 2–3 person team in 7 hours, do NOT branch heavily. Use a simple ownership model:

| Layer | Owned by | Touch frequency |
|---|---|---|
| `src/lib/*` (adapters) | 1 person | rarely after sprint 1 |
| `src/app/api/*` | 1 person | rarely after sprint 1 |
| `src/app/(track)/<slug>/` | All teammates | constantly |
| `src/components/<feature>/` | Whoever owns the feature | constantly |
| `docs/`, `README.md` | Anyone | end of day |

### Git workflow

- **Default to `main`.** Push often (every 30 min). Rebase, don't merge.
- **For risky refactors**, branch: `git switch -c refactor/<thing>`. Merge fast (< 30 min).
- **Resolve conflicts immediately.** A 5-minute conflict at hour 6 is a 30-minute conflict.

### Conflict-avoidance rules

1. **One person owns `src/lib/env.ts`** — env changes are sequenced through them.
2. **Components live in feature folders**, not in a flat `src/components/`, so two people don't both edit `Button.tsx`.
3. **Don't touch each other's track folder.** If two people both touch `src/app/(track)/your-slug/page.tsx`, you'll conflict every commit.

---

## 6. Working with Claude Code on this repo

`CLAUDE.md` is auto-loaded by Claude Code every session. It contains:

- **12 vibe-coding rules** (think before coding, surgical changes, fail loud, etc.)
- **5 hackathon-specific rules** (H1–H5):
  - H1 — Public-safe commits
  - H2 — All sponsor calls go through `src/lib/`
  - H3 — Demo mode must always work
  - H4 — No GTM/SEO/auth/payment unless required
  - H5 — No `Co-Authored-By: Claude` trailer

### Prompting patterns that work well here

```
"Add a new API route POST /api/summarize that takes { text } and returns
{ summary }. Use @/lib/ai chat. Follow the existing route pattern."
```

```
"Wire MicCapture into src/app/(track)/voice-bot/page.tsx. When STT comes
back, send the transcript to /api/chat and TTS the response."
```

```
"This is too complicated. Apply Rule 2 (simplicity first) and cut anything
that's not load-bearing for the demo."
```

### Prompting patterns to avoid

- ❌ "Make the code production-ready" — invites scope creep
- ❌ "Add authentication" — violates H4 unless track requires
- ❌ "Refactor this for clarity" — violates Rule 3 (surgical changes)
- ❌ Vague requests like "improve this page" — give specific goals

If Claude starts over-engineering, quote the rule it's violating.

---

## 7. Pre-commit checklist

Before every push, especially before any push to `main`:

```bash
# 1. Type check + lint
pnpm typecheck && pnpm lint

# 2. Scan staged files for secrets / PII
git diff --cached | grep -iE "key|secret|token|password|@gmail|@outlook|api_key" || echo "(clean)"

# 3. Confirm no .env files staged
git diff --cached --name-only | grep -E "^\.env" && echo "STOP — .env staged" || echo "(clean)"

# 4. Confirm build works
pnpm build
```

If any of these fail, **don't push**. Fix it, then commit again.

### Commit message style

Conventional commits, short:

```
feat: add /api/summarize route
fix: clamp MicCapture audio chunks to 25mb
chore: bump openai sdk
docs: update SPONSORS.md with Fal video model
refactor: extract retry logic from anthropic adapter
```

**Never** include `Co-Authored-By: Claude` (rule H5).

---

## 8. Anti-patterns (Berlin retro lessons)

| Anti-pattern | Why it bites | What to do instead |
|---|---|---|
| Relying on a single provider | Rate-limited mid-demo | Use `@/lib/ai` router; both keys live |
| Using preview/beta SDK versions | Quota lower, breaking changes | Pin GA versions in `package.json` |
| No fixture for a new sponsor call | Can't rehearse offline | Add a `demo/fixtures.ts` branch first |
| Adding `Co-Authored-By: Claude` | Reveals AI provenance, may hurt scoring | Plain commits (rule H5) |
| Committing `.env.local` | Public repo + organizer access = disqualifier | Only `.env.example` is allowed |
| Touching `src/lib/*` in last 2 hours | Cascades through every page | Feature freeze. UI only after 15:30. |
| "Just one more feature" at 17:00 | Half-shipped feature looks worse than no feature | Cut, don't add. |
| No demo rehearsal | Live demo is 80% of the score | Practice ≥3 times before submission |

---

## 9. Debug recipes

### "I get 503 from /api/chat"

You haven't set `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` in `.env.local`. Either set one, or set `NEXT_PUBLIC_DEMO_MODE=true` to use fixtures.

### "Mic doesn't work in the browser"

Browsers only allow `getUserMedia` over HTTPS or `localhost`. If you're testing on a LAN IP, switch to localhost or set up a tunnel.

### "next-env.d.ts is missing after clone"

Run `pnpm dev` once — Next.js regenerates it on first build. It's gitignored on purpose.

### "better-sqlite3 fails to load"

The native binding didn't compile. Run `pnpm rebuild better-sqlite3`. Make sure your Node version matches `.nvmrc` (Node 22).

### "Hot reload broke after editing src/lib/env.ts"

Server env changes don't hot-reload in dev. Kill `pnpm dev` and restart.

### "I see `Sponsor unavailable` even though I set the key"

`.env.local` is loaded at server start, not per-request. Restart `pnpm dev`.

### "TypeScript complains about server-only"

You imported a `src/lib/*` server module into a `"use client"` component. Move the call into an API route, then fetch it from the client.

---

## 10. Where to look first when adding X

| You want to add… | Start here |
|---|---|
| A new product screen | `src/app/(track)/template/page.tsx` (clone) |
| An LLM call | `src/lib/ai/index.ts` |
| Image generation | `src/lib/media/fal.ts` |
| Voice in (STT) | `src/components/voice/MicCapture.tsx` + `/api/stt` |
| Voice out (TTS) | `/api/tts` |
| Real-time voice | `src/lib/voice/slng.ts` |
| A new sponsor | Section 4b above |
| A new API route | Section 4c above |
| A new DB table | `src/lib/db/schema.ts` + section 4e |
| Demo fixtures | `src/lib/demo/fixtures.ts` |
| A new doc | `docs/` (link from README) |

---

## 11. Last-resort escape hatches

If everything is on fire 30 minutes before submission:

1. **Flip `DEMO_MODE=true`.** Every call returns fixtures. UI still works. You can demo the *story* even if no backend works.
2. **Push the broken state to a side branch**, then `git revert` to the last green commit on `main`.
3. **Drop a feature.** A polished 1-feature demo beats a broken 3-feature demo. Always.
4. **Switch the demo to your local laptop.** If venue WiFi died, just run `pnpm start` locally and demo from your screen.

The scaffold is designed so #1 is always available. Don't be afraid to use it.
