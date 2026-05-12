import { MicCapture } from "@/components/voice/MicCapture";

/**
 * Empty track template — copy this folder on event day:
 *   cp -r src/app/(track)/template src/app/(track)/<your-track>
 *
 * Replace the demo widgets below with the actual product.
 *
 * Available adapters (all env-gated, see src/lib/env.ts):
 *   - POST /api/chat       → LLM (OpenAI ↔ Anthropic with auto-fallback)
 *   - POST /api/image      → Fal image generation
 *   - POST /api/stt        → Gradium speech-to-text
 *   - POST /api/tts        → Gradium text-to-speech
 *
 * For real-time voice agents, see src/lib/voice/slng.ts.
 * For chat history persistence, see src/lib/db/schema.ts.
 */
export default function TrackTemplatePage() {
  return (
    <main className="container mx-auto max-w-3xl px-6 py-12">
      <header className="mb-8">
        <p className="text-sm uppercase tracking-widest text-muted-foreground">Track</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Template (replace me)</h1>
        <p className="mt-2 text-muted-foreground">
          This is a starter screen with a working mic capture component wired to{" "}
          <code>/api/stt</code>. Replace it with your actual product on event day.
        </p>
      </header>

      <section className="rounded-lg border p-6">
        <h2 className="mb-4 text-lg font-semibold">Mic → STT demo</h2>
        <MicCapture />
      </section>
    </main>
  );
}
