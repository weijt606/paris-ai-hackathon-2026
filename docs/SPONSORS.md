# Sponsors — integration notes

Confirmed at the event: OpenAI, Anthropic, Fal, Gradium, Slng.ai. Free credits handed out at check-in.

## OpenAI

- **Adapter:** `src/lib/ai/openai.ts`
- **Route:** `POST /api/chat` (provider=openai)
- **Env:** `OPENAI_API_KEY`, `OPENAI_MODEL` (default `gpt-4o-mini`)
- **Notes:**
  - Bump `OPENAI_MODEL` to whatever GA model is current on the day. Avoid preview/beta in the demo path (Berlin lesson).
  - For structured output, use `response_format: { type: "json_schema", json_schema: {...} }` directly via the client — the adapter exposes the raw OpenAI SDK so you can extend.

## Anthropic

- **Adapter:** `src/lib/ai/anthropic.ts`
- **Route:** `POST /api/chat` (provider=anthropic)
- **Env:** `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` (default `claude-sonnet-4-6`)
- **Notes:**
  - System prompt is auto-extracted from any `{ role: "system" }` message.
  - For prompt caching, use the underlying `@anthropic-ai/sdk` client directly and pass `cache_control: { type: "ephemeral" }` on message blocks.

## Fal (image / video generation)

- **Adapter:** `src/lib/media/fal.ts`
- **Route:** `POST /api/image`
- **Env:** `FAL_KEY`, `FAL_IMAGE_MODEL` (default `fal-ai/flux/schnell`)
- **Notes:**
  - `flux/schnell` is fast/cheap; `flux/dev` is slower/higher quality. Decide based on demo cadence.
  - Models taking >10s should be invoked async via `fal.queue.submit` instead of `fal.subscribe` to avoid blocking route handlers.
  - For video, swap the model id (e.g., `fal-ai/luma-dream-machine`) — `generateImage` returns the same `{ url }` shape.

## Gradium (voice — TTS + STT)

- **Adapter:** `src/lib/voice/gradium.ts`
- **Routes:** `POST /api/stt` (multipart audio), `POST /api/tts` (JSON)
- **Env:** `GRADIUM_API_KEY`, `GRADIUM_BASE_URL` (default `https://api.gradium.ai`)
- **Notes:**
  - Endpoints assumed: `POST /v1/stt` (multipart `audio` field) and `POST /v1/tts` (JSON body).
  - **Verify on event day** — adjust paths/headers once the sponsor confirms their REST surface.
  - Berlin lesson: an enhancement model that helps clean speech may **hurt** STT for short/staccato commands. Add an A/B toggle in your UI if voice quality matters.

## Slng.ai (real-time voice agents)

- **Adapter:** `src/lib/voice/slng.ts`
- **Env:** `SLNG_API_KEY`, `SLNG_BASE_URL` (default `https://api.slng.ai`)
- **Notes:**
  - Only `createAgent` is stubbed (REST). For full real-time, ask for their official SDK at check-in — it's likely WebRTC- or WebSocket-based.
  - If your track uses voice agents, pair Slng.ai with Gradium TTS for output and OpenAI/Anthropic for reasoning.

## Multi-sponsor strategy (Berlin lesson)

Berlin's overall winner combined **two sponsors deeply** (telli + ai-coustics) on a high-emotional-resonance product. Track winners typically integrate ≥2 sponsors. For Paris, prefer products that naturally combine:

- **Fal + OpenAI/Anthropic** → multimodal content (text → image → narrative)
- **Gradium + Anthropic/OpenAI** → voice-in/voice-out agent
- **Slng.ai + Anthropic/OpenAI** → real-time conversational agent (highest demo wow factor)
- **Fal + Gradium** → voice prompt → image/video story
