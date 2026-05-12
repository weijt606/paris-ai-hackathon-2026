import { NextResponse } from "next/server";
import { z } from "zod";
import { chat, type ChatTurn } from "@/lib/ai";
import { SponsorUnavailableError } from "@/lib/utils";

export const runtime = "nodejs";

const Body = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["system", "user", "assistant"]),
        content: z.string().min(1),
      }),
    )
    .min(1),
  provider: z.enum(["openai", "anthropic"]).optional(),
  model: z.string().optional(),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const result = await chat(parsed.data.messages as ChatTurn[], {
      provider: parsed.data.provider,
      model: parsed.data.model,
    });
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof SponsorUnavailableError) {
      return NextResponse.json({ error: err.message, sponsor: err.sponsor }, { status: 503 });
    }
    console.error("[/api/chat]", err);
    return NextResponse.json({ error: "Chat call failed" }, { status: 500 });
  }
}
