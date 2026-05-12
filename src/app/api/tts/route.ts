import { NextResponse } from "next/server";
import { z } from "zod";
import { textToSpeech } from "@/lib/voice/gradium";
import { SponsorUnavailableError } from "@/lib/utils";

export const runtime = "nodejs";

const Body = z.object({
  text: z.string().min(1).max(4000),
  voice: z.string().optional(),
  format: z.enum(["mp3", "wav", "ogg"]).optional(),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const buf = await textToSpeech(parsed.data);
    const fmt = parsed.data.format ?? "mp3";
    const ct =
      fmt === "mp3" ? "audio/mpeg" : fmt === "wav" ? "audio/wav" : "audio/ogg";
    return new NextResponse(buf, { headers: { "Content-Type": ct } });
  } catch (err) {
    if (err instanceof SponsorUnavailableError) {
      return NextResponse.json({ error: err.message, sponsor: err.sponsor }, { status: 503 });
    }
    console.error("[/api/tts]", err);
    return NextResponse.json({ error: "TTS failed" }, { status: 500 });
  }
}
