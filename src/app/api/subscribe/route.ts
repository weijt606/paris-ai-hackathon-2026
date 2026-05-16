import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const Body = z.object({
  email: z.string().email().max(200),
  regionId: z.string().min(1).max(100).optional(),
  persona: z.enum(["vineyard", "trade"]).optional(),
});

/**
 * Subscribe stub — accepts an email + optional context and logs it. Replace
 * with a real provider (Resend / Postmark / SendGrid) by adding an env-gated
 * adapter under src/lib/email/ and calling it from here. Returns 200 even
 * when stubbed so the UI flow can be demoed end-to-end.
 */
export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  // TODO(dev): wire a real mail provider once a sponsor key is available.
  console.log(
    "[subscribe] stub recorded:",
    JSON.stringify({ ...parsed.data, at: new Date().toISOString() }),
  );
  return NextResponse.json({ ok: true, stub: true });
}
