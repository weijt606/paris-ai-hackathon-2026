import { NextResponse } from "next/server";
import { speechToText } from "@/lib/voice/gradium";
import { SponsorUnavailableError } from "@/lib/utils";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  const audio = form?.get("audio");
  if (!audio || !(audio instanceof Blob)) {
    return NextResponse.json({ error: "Expected multipart 'audio' Blob" }, { status: 400 });
  }
  const language = (form?.get("language") as string | null) ?? undefined;

  try {
    const result = await speechToText({ audio, language });
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof SponsorUnavailableError) {
      return NextResponse.json({ error: err.message, sponsor: err.sponsor }, { status: 503 });
    }
    console.error("[/api/stt]", err);
    return NextResponse.json({ error: "STT failed" }, { status: 500 });
  }
}
