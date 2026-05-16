import "server-only";
import { z } from "zod";

const serverSchema = z.object({
  OPENAI_API_KEY: z.string().min(1).optional(),
  OPENAI_MODEL: z.string().min(1).default("gpt-4o-mini"),

  TAVILY_API_KEY: z.string().min(1).optional(),

  PIONEER_API_KEY: z.string().min(1).optional(),
  PIONEER_BASE_URL: z.string().url().default("https://api.pioneer.ai"),
  PIONEER_MODEL_ID: z.string().min(1).optional(),
});

const publicSchema = z.object({
  NEXT_PUBLIC_APP_NAME: z.string().default("Wine Signals"),
  NEXT_PUBLIC_DEMO_MODE: z
    .union([z.literal("true"), z.literal("false"), z.literal("")])
    .default("false")
    .transform((v) => v === "true"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
});

function parseEnv() {
  // Empty-string env vars (common when a placeholder line like `KEY=` is
  // left in .env.local) should be treated as unset, not as values that
  // fail .min(1). Filter them out before validation.
  const cleanedEnv = Object.fromEntries(
    Object.entries(process.env).filter(([, v]) => v !== ""),
  );
  const server = serverSchema.safeParse(cleanedEnv);
  if (!server.success) {
    console.error("❌ Invalid server env:", server.error.flatten().fieldErrors);
    throw new Error("Invalid server environment variables");
  }
  const pub = publicSchema.safeParse({
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_DEMO_MODE: process.env.NEXT_PUBLIC_DEMO_MODE,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  });
  if (!pub.success) {
    console.error("❌ Invalid public env:", pub.error.flatten().fieldErrors);
    throw new Error("Invalid public environment variables");
  }
  return { ...server.data, ...pub.data };
}

export const env = parseEnv();

export const sponsors = {
  openai: Boolean(env.OPENAI_API_KEY),
  tavily: Boolean(env.TAVILY_API_KEY),
  pioneer: Boolean(env.PIONEER_API_KEY),
} as const;

/** Convenience alias — same map, different reading. */
export const integrations = sponsors;

export const isDemoMode = env.NEXT_PUBLIC_DEMO_MODE;

export type SponsorKey = keyof typeof sponsors;
