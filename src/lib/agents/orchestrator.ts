import "server-only";
import type OpenAI from "openai";
import { env, isDemoMode, sponsors } from "@/lib/env";
import { openaiClient } from "@/lib/ai/openai";
import { demoWineAnalysis } from "@/lib/demo/fixtures";
import {
  type AgentContext,
  type AgentResult,
  type SubAgent,
  runAgentSafely,
} from "@/lib/agents/types";
import { weatherAgent } from "@/lib/agents/sub-agents/weather";
import { geoAgent } from "@/lib/agents/sub-agents/geo";
import { tavilyAgent } from "@/lib/agents/sub-agents/tavily";
import { extractionAgent } from "@/lib/agents/extraction";
import { featureAgent } from "@/lib/agents/feature";
import type {
  AnalyzeInput,
  AnalyzeResult,
  AgentStepTrace,
  FeatureSummary,
  GeoSnapshot,
  Recommendation,
  RiskDriver,
} from "@/lib/wine/types";
import { bandOf } from "@/lib/wine/types";
import type { ExtractionOutput } from "@/lib/agents/extraction";

/**
 * Orchestrator — OpenAI Chat Completions tool-use loop.
 *
 * Routing layer ONLY: registers sub-agents as OpenAI function tools,
 * dispatches by name, collects a structured trace, harvests the final
 * result from the extraction_agent's last successful call. Sub-agent
 * bodies are stubs owned by the dev team — replace them without touching
 * this file.
 *
 * Degradation order:
 *   1. demo mode   → fixture
 *   2. no OpenAI   → fixture (orchestrator brain missing; flagged as partial)
 *   3. step budget → harvest whatever extraction produced; band reflects it
 */

type AnyAgent = SubAgent<unknown, unknown>;

const REGISTRY = new Map<string, AnyAgent>();
function register<I, D>(a: SubAgent<I, D>): void {
  REGISTRY.set(a.name, a as unknown as AnyAgent);
}
register(weatherAgent);
register(geoAgent);
register(tavilyAgent);
register(extractionAgent);
register(featureAgent);

function toolDescriptors(): OpenAI.Chat.Completions.ChatCompletionTool[] {
  return Array.from(REGISTRY.values()).map((a) => ({
    type: "function",
    function: {
      name: a.name,
      description: a.description,
      parameters: a.input_schema as Record<string, unknown>,
    },
  }));
}

const SYSTEM_PROMPT = `You are the wine-intelligence orchestrator. You evaluate cultivation and market risk for a French wine region by calling the registered sub-agent tools.

Procedure:
1. Call weather_agent, geo_agent, and tavily_agent — they can be invoked in parallel (emit multiple tool_calls in one turn).
2. Once all three have returned, call extraction_agent with COMPACT summaries (1–2 sentences each) of the upstream findings. Do not paste raw JSON.
3. Once extraction_agent returns, call feature_agent. Pass:
   - regionId and persona (unchanged from the host input)
   - score (extraction's risk score)
   - qualityBand (extraction's qualityBand)
   - driversSummary: a single-sentence summary of extraction's top drivers
   - recommendationsSummary: a single-sentence summary of extraction's recommendations
   - rationale: extraction's rationale (verbatim if short, else compressed)
4. After feature_agent returns, end the turn with one short sentence. The host harvests both extraction and feature outputs from the tool trace.

Rules:
- Never call extraction_agent before the three upstream agents have returned.
- Never call feature_agent before extraction_agent has returned.
- Always pass the regionId the host provided; never invent one.
- If a sub-agent fails, proceed and note the gap to extraction_agent.
- Be concise. No marketing copy.`;

const MAX_STEPS = 10;

export async function analyze(
  input: AnalyzeInput,
  opts: { signal?: AbortSignal } = {},
): Promise<AnalyzeResult> {
  if (isDemoMode) return demoWineAnalysis(input);
  if (!sponsors.openai) {
    const fixture = demoWineAnalysis(input);
    return { ...fixture, isDemoOrPartial: true };
  }

  const ctx: AgentContext = {
    region: input.region,
    timeframe: input.timeframe,
    persona: input.persona,
    uploads: input.uploads,
    signal: opts.signal ?? new AbortController().signal,
  };

  const trace: AgentResult[] = [];
  const client = openaiClient();

  const bootstrap = [
    `Region: ${input.region.name} (id=${input.region.id}, parent=${input.region.parent})`,
    `Timeframe: ${input.timeframe.start} → ${input.timeframe.end}`,
    `Persona: ${input.persona}`,
    input.question ? `Refinement: ${input.question}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: bootstrap },
  ];

  for (let step = 0; step < MAX_STEPS; step++) {
    if (opts.signal?.aborted) throw new Error("Aborted");

    const res = await client.chat.completions.create(
      {
        model: env.OPENAI_MODEL,
        messages,
        tools: toolDescriptors(),
        tool_choice: "auto",
      },
      { signal: opts.signal },
    );

    const msg = res.choices[0]?.message;
    if (!msg) throw new Error("Orchestrator: empty completion");

    const toolCalls = msg.tool_calls ?? [];
    if (toolCalls.length === 0) break;

    messages.push(msg);

    const toolMessages: OpenAI.Chat.Completions.ChatCompletionToolMessageParam[] =
      await Promise.all(
        toolCalls.map(async (tc) => {
          if (tc.type !== "function") {
            return {
              role: "tool",
              tool_call_id: tc.id,
              content: `Unsupported tool call type: ${tc.type}`,
            };
          }
          const agent = REGISTRY.get(tc.function.name);
          if (!agent) {
            return {
              role: "tool",
              tool_call_id: tc.id,
              content: `Unknown tool: ${tc.function.name}`,
            };
          }
          let parsed: unknown;
          try {
            parsed = JSON.parse(tc.function.arguments || "{}");
          } catch (e) {
            return {
              role: "tool",
              tool_call_id: tc.id,
              content: `Invalid JSON arguments: ${e instanceof Error ? e.message : String(e)}`,
            };
          }
          const result = await runAgentSafely(agent, parsed, ctx);
          trace.push(result);
          return {
            role: "tool",
            tool_call_id: tc.id,
            content: JSON.stringify(result.data ?? { error: result.error }),
          };
        }),
      );

    messages.push(...toolMessages);
  }

  return harvest(input, trace);
}

function harvest(input: AnalyzeInput, trace: AgentResult[]): AnalyzeResult {
  const extraction = [...trace].reverse().find((r) => r.agent === "extraction_agent" && r.ok);
  const feature = [...trace].reverse().find((r) => r.agent === "feature_agent" && r.ok);
  const geo = [...trace].reverse().find((r) => r.agent === "geo_agent" && r.ok);

  const extractionData = extraction?.data as Partial<ExtractionOutput> | undefined;
  const featureData = feature?.data as FeatureSummary | undefined;
  const geoData = geo?.data as GeoSnapshot | undefined;

  const score = extractionData?.score ?? 0;
  const sawFailure = trace.some((r) => !r.ok);

  return {
    region: input.region,
    timeframe: input.timeframe,
    persona: input.persona,
    riskScore: score,
    riskBand: bandOf(score),
    drivers: (extractionData?.drivers as RiskDriver[]) ?? [],
    recommendations: (extractionData?.recommendations as Recommendation[]) ?? [],
    qualityBand: extractionData?.qualityBand,
    activeGates: extractionData?.activeGates,
    rationale: extractionData?.rationale,
    feature: featureData ?? null,
    geoSnapshot: geoData ?? null,
    trace: trace.map<AgentStepTrace>((r) => ({
      agent: r.agent,
      ok: r.ok,
      durationMs: r.durationMs,
      error: r.error,
      summary: r.summary,
    })),
    generatedAt: new Date().toISOString(),
    isDemoOrPartial: sawFailure || !extractionData,
  };
}
