import "server-only";
import { z } from "zod";

const serverSchema = z.object({
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  ANTHROPIC_MODEL: z.string().min(1).default("claude-sonnet-4-6"),

  TAVILY_API_KEY: z.string().min(1).optional(),

  PIONEER_API_KEY: z.string().min(1).optional(),
  PIONEER_BASE_URL: z.string().url().default("https://api.pioneer.ai"),
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
  anthropic: Boolean(env.ANTHROPIC_API_KEY),
} as const;

export const integrations = {
  tavily: Boolean(env.TAVILY_API_KEY),
  pioneer: Boolean(env.PIONEER_API_KEY),
} as const;

export const isDemoMode = env.NEXT_PUBLIC_DEMO_MODE;

export type SponsorKey = keyof typeof sponsors;
