import "server-only";
import type Anthropic from "@anthropic-ai/sdk";
import { env, isDemoMode, sponsors } from "@/lib/env";
import { anthropicClient } from "@/lib/ai/anthropic";
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
  Recommendation,
  RiskDriver,
} from "@/lib/wine/types";
import { bandOf } from "@/lib/wine/types";

/**
 * Orchestrator — Claude tool-use loop.
 *
 * Routing layer ONLY: registers sub-agents as Claude tools, dispatches by
 * name, collects a structured trace, harvests the final result from the
 * extraction_agent's last successful call. Sub-agent bodies are stubs owned
 * by the dev team — replace them without touching this file.
 *
 * Degradation order:
 *   1. demo mode      → fixture
 *   2. no Anthropic   → fixture (orchestrator brain missing; flagged as partial)
 *   3. step budget    → harvest whatever extraction produced; band reflects it
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

function toolDescriptors(): Anthropic.Tool[] {
  return Array.from(REGISTRY.values()).map((a) => ({
    name: a.name,
    description: a.description,
    input_schema: a.input_schema as Anthropic.Tool["input_schema"],
  }));
}

const SYSTEM_PROMPT = `You are the wine-intelligence orchestrator. You evaluate cultivation and market risk for a French wine region by calling the registered sub-agent tools.

Procedure:
1. Call weather_agent, geo_agent, and tavily_agent — they can be invoked in parallel.
2. Once all three have returned, call extraction_agent with COMPACT summaries (1–2 sentences each) of the upstream findings. Do not paste raw JSON.
3. After extraction_agent returns, end the turn with one short sentence. Do not reformat extraction's output — the host harvests it from the tool trace.

Rules:
- Never call extraction_agent before the three upstream agents have returned.
- Always pass the regionId the host provided; never invent one.
- If a sub-agent fails (ok:false), proceed and note the gap to extraction_agent.
- Be concise. No marketing copy.`;

const MAX_STEPS = 8;

export async function analyze(
  input: AnalyzeInput,
  opts: { signal?: AbortSignal } = {},
): Promise<AnalyzeResult> {
  if (isDemoMode) return demoWineAnalysis(input);
  if (!sponsors.anthropic) {
    const fixture = demoWineAnalysis(input);
    return { ...fixture, isDemoOrPartial: true };
  }

  const ctx: AgentContext = {
    region: input.region,
    timeframe: input.timeframe,
    persona: input.persona,
    signal: opts.signal ?? new AbortController().signal,
  };

  const trace: AgentResult[] = [];
  const client = anthropicClient();

  const bootstrap = [
    `Region: ${input.region.name} (id=${input.region.id}, parent=${input.region.parent})`,
    `Timeframe: ${input.timeframe.start} → ${input.timeframe.end}`,
    `Persona: ${input.persona}`,
    input.question ? `Refinement: ${input.question}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const messages: Anthropic.MessageParam[] = [{ role: "user", content: bootstrap }];

  for (let step = 0; step < MAX_STEPS; step++) {
    if (opts.signal?.aborted) throw new Error("Aborted");

    const res = await client.messages.create({
      model: env.ANTHROPIC_MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      tools: toolDescriptors(),
      messages,
    });

    if (res.stop_reason === "end_turn") break;
    if (res.stop_reason !== "tool_use") {
      throw new Error(`Orchestrator: unexpected stop_reason '${res.stop_reason}'`);
    }

    const toolUses = res.content.filter(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
    );
    messages.push({ role: "assistant", content: res.content });

    const toolResults: Anthropic.ToolResultBlockParam[] = await Promise.all(
      toolUses.map(async (tu) => {
        const agent = REGISTRY.get(tu.name);
        if (!agent) {
          return {
            type: "tool_result",
            tool_use_id: tu.id,
            is_error: true,
            content: `Unknown tool: ${tu.name}`,
          };
        }
        const result = await runAgentSafely(agent, tu.input, ctx);
        trace.push(result);
        return {
          type: "tool_result",
          tool_use_id: tu.id,
          is_error: !result.ok,
          content: JSON.stringify(result.data ?? { error: result.error }),
        };
      }),
    );
    messages.push({ role: "user", content: toolResults });
  }

  return harvest(input, trace);
}

function harvest(input: AnalyzeInput, trace: AgentResult[]): AnalyzeResult {
  const extraction = [...trace].reverse().find((r) => r.agent === "extraction_agent" && r.ok);
  const data = extraction?.data as
    | { score: number; drivers: RiskDriver[]; recommendations: Recommendation[] }
    | undefined;

  const score = data?.score ?? 0;
  const sawFailure = trace.some((r) => !r.ok);

  return {
    region: input.region,
    timeframe: input.timeframe,
    persona: input.persona,
    riskScore: score,
    riskBand: bandOf(score),
    drivers: data?.drivers ?? [],
    recommendations: data?.recommendations ?? [],
    trace: trace.map<AgentStepTrace>((r) => ({
      agent: r.agent,
      ok: r.ok,
      durationMs: r.durationMs,
      error: r.error,
      summary: r.summary,
    })),
    generatedAt: new Date().toISOString(),
    isDemoOrPartial: sawFailure || !data,
  };
}
