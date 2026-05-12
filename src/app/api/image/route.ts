import { NextResponse } from "next/server";
import { z } from "zod";
import { generateImage } from "@/lib/media/fal";
import { SponsorUnavailableError } from "@/lib/utils";

export const runtime = "nodejs";

const Body = z.object({
  prompt: z.string().min(1).max(2000),
  model: z.string().optional(),
  imageSize: z
    .enum(["square", "portrait_4_3", "landscape_4_3", "landscape_16_9"])
    .optional(),
  numImages: z.number().int().min(1).max(4).optional(),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const result = await generateImage(parsed.data);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof SponsorUnavailableError) {
      return NextResponse.json({ error: err.message, sponsor: err.sponsor }, { status: 503 });
    }
    console.error("[/api/image]", err);
    return NextResponse.json({ error: "Image generation failed" }, { status: 500 });
  }
}
