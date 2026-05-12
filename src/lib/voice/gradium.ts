import "server-only";
import { env, isDemoMode, sponsors } from "@/lib/env";
import { SponsorUnavailableError } from "@/lib/utils";
import { demoTranscript, demoTtsAudio } from "@/lib/demo/fixtures";

/**
 * Gradium voice adapter — speech-to-text + text-to-speech.
 *
 * The exact endpoint shape varies by Gradium plan; this thin wrapper expects
 * the documented REST surface (/v1/stt, /v1/tts). Adjust paths on event day
 * once the sponsor hands out the actual SDK / docs.
 */

function ensure() {
  if (!sponsors.gradium || !env.GRADIUM_API_KEY) throw new SponsorUnavailableError("gradium");
  return { key: env.GRADIUM_API_KEY, base: env.GRADIUM_BASE_URL };
}

export interface SttInput {
  audio: Blob | ArrayBuffer | Uint8Array;
  language?: string;
  mimeType?: string;
}

export interface SttResult {
  text: string;
  confidence?: number;
  durationMs?: number;
}

export async function speechToText(input: SttInput): Promise<SttResult> {
  if (isDemoMode) return demoTranscript();
  const { key, base } = ensure();

  const blob =
    input.audio instanceof Blob
      ? input.audio
      : new Blob([input.audio as BlobPart], { type: input.mimeType ?? "audio/wav" });

  const form = new FormData();
  form.append("audio", blob, "audio.wav");
  if (input.language) form.append("language", input.language);

  const res = await fetch(`${base}/v1/stt`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}` },
    body: form,
  });
  if (!res.ok) throw new Error(`Gradium STT failed: ${res.status} ${await res.text()}`);
  const json = (await res.json()) as SttResult;
  return json;
}

export interface TtsInput {
  text: string;
  voice?: string;
  format?: "mp3" | "wav" | "ogg";
}

export async function textToSpeech(input: TtsInput): Promise<ArrayBuffer> {
  if (isDemoMode) return demoTtsAudio();
  const { key, base } = ensure();

  const res = await fetch(`${base}/v1/tts`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      text: input.text,
      voice: input.voice ?? "default",
      format: input.format ?? "mp3",
    }),
  });
  if (!res.ok) throw new Error(`Gradium TTS failed: ${res.status} ${await res.text()}`);
  return await res.arrayBuffer();
}
