/**
 * Client-safe env shims. Only NEXT_PUBLIC_* vars belong here.
 * Importable from "use client" components without leaking server secrets.
 */
export const publicEnv = {
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? "Paris Hack 2026",
  demoMode: process.env.NEXT_PUBLIC_DEMO_MODE === "true",
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
} as const;
