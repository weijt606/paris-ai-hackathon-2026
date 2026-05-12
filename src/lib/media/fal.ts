import "server-only";
import * as fal from "@fal-ai/serverless-client";
import { env, isDemoMode, sponsors } from "@/lib/env";
import { SponsorUnavailableError } from "@/lib/utils";
import { demoImageUrl } from "@/lib/demo/fixtures";

let _configured = false;

function ensureConfigured() {
  if (_configured) return;
  if (!sponsors.fal || !env.FAL_KEY) throw new SponsorUnavailableError("fal");
  fal.config({ credentials: env.FAL_KEY });
  _configured = true;
}

export interface ImageGenInput {
  prompt: string;
  model?: string;
  imageSize?: "square" | "portrait_4_3" | "landscape_4_3" | "landscape_16_9";
  numImages?: number;
}

export interface ImageGenResult {
  images: { url: string; width?: number; height?: number }[];
  prompt: string;
}

export async function generateImage(input: ImageGenInput): Promise<ImageGenResult> {
  if (isDemoMode) {
    return { images: [{ url: demoImageUrl(input.prompt) }], prompt: input.prompt };
  }
  ensureConfigured();
  const model = input.model ?? env.FAL_IMAGE_MODEL;
  const result = (await fal.subscribe(model, {
    input: {
      prompt: input.prompt,
      image_size: input.imageSize ?? "landscape_16_9",
      num_images: input.numImages ?? 1,
    },
  })) as { images?: { url: string; width?: number; height?: number }[] };
  return { images: result.images ?? [], prompt: input.prompt };
}
