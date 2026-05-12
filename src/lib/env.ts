import "server-only";
import { z } from "zod";

const serverSchema = z.object({
  OPENAI_API_KEY: z.string().min(1).optional(),
  OPENAI_MODEL: z.string().min(1).default("gpt-4o-mini"),

  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  ANTHROPIC_MODEL: z.string().min(1).default("claude-sonnet-4-6"),

  FAL_KEY: z.string().min(1).optional(),
  FAL_IMAGE_MODEL: z.string().min(1).default("fal-ai/flux/schnell"),

  GRADIUM_API_KEY: z.string().min(1).optional(),
  GRADIUM_BASE_URL: z.string().url().default("https://api.gradium.ai"),

  SLNG_API_KEY: z.string().min(1).optional(),
  SLNG_BASE_URL: z.string().url().default("https://api.slng.ai"),

  DATABASE_URL: z.string().min(1).default("file:./data/dev.db"),
});

const publicSchema = z.object({
  NEXT_PUBLIC_APP_NAME: z.string().default("Paris Hack 2026"),
  NEXT_PUBLIC_DEMO_MODE: z
    .union([z.literal("true"), z.literal("false"), z.literal("")])
    .default("false")
    .transform((v) => v === "true"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
});

function parseEnv() {
  const server = serverSchema.safeParse(process.env);
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
  anthropic: Boolean(env.ANTHROPIC_API_KEY),
  fal: Boolean(env.FAL_KEY),
  gradium: Boolean(env.GRADIUM_API_KEY),
  slng: Boolean(env.SLNG_API_KEY),
} as const;

export const isDemoMode = env.NEXT_PUBLIC_DEMO_MODE;

export type SponsorKey = keyof typeof sponsors;
