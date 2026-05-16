# 🍇 Wine Intelligence Agents — 协作开发指南

本仓库当前选定方向：**法国勃艮第 + 波尔多产区葡萄酒种植/市场风险预测**，面向酒庄与行业买家双 persona。本文档说明 **agent 架构**、**dev team 分工**、以及每个 agent 的契约边界。

> 通用脚手架信息（环境、调试、demo mode 等）见 [`DEVELOPMENT.md`](DEVELOPMENT.md)。
> 本文档只讲 agent 层。

---

## 1. 系统架构（一图概览）

```
┌──────────────────────────────────────────────────────────────────┐
│  Landing  /                — EntryChoice (酒庄 / 酒商) + 中/FR 切换 │
├──────────────────────────────────────────────────────────────────┤
│  /vineyard                                  /trade                 │
│   • UploadArea (drag-drop)                   • Bordeaux Map        │
│   • Region picker                              (react-simple-maps) │
│   • RiskCard + 2 charts                      • 4-chart grid        │
│   • Export + Subscribe                         + Export + Subscribe│
└────────────────────────┬─────────────────────────────────────────┘
                         │ POST /api/analyze
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│  Orchestrator  (src/lib/agents/orchestrator.ts)                  │
│   OpenAI Chat Completions tool-use 循环 · 路由层 · 不要改它          │
│   • 注册 SubAgent → 转 OpenAI function tool                       │
│   • dispatch tool_calls → runAgentSafely → 收集 trace              │
│   • 末尾 harvest extraction_agent 输出 → AnalyzeResult            │
└────────────────────────┬─────────────────────────────────────────┘
                         │ 并行调用
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
  weather_agent     geo_agent       tavily_agent       ◄── 三个 sub-agent
  (气候 + 预报)     (地理 + 风土)   (公开网络情报)         dev team 各认领一个
        │                │                │
        └────────────────┼────────────────┘
                         ▼
                  extraction_agent                     ◄── 风险评估
                  (打分 + drivers + recommendations)      dev team 认领
                         │
                         ▼
                   feature_agent                       ◄── 待定义
                   (TBD)                                  调 pioneer.classify()
                         │
                         ▼
                   Pioneer.ai GLiNER2                  ◄── 行业数据分类器
                   (classify({text,task,labels}))        在 Pioneer 平台离线训练
```

**关键原则：**
- **Orchestrator 是路由层，不写业务逻辑** — sub-agent 谁也不要去改它。
- Sub-agent 之间**无依赖**（除了 extraction 依赖前三个）。可以三个人完全并行开发。
- 每个 sub-agent **替换 `run()` body 即可**，契约不变就不会影响下游。

---

**UI 模块（已搭好骨架，dev team 可迭代视觉/交互）：**

| 入口 | 文件 | 关键组件 |
|---|---|---|
| 落地 | `src/app/page.tsx` | `EntryChoice` 两个 CTA 卡 |
| 酒庄 | `src/app/vineyard/page.tsx` | `VineyardDashboard`, `UploadArea`（拖拽上传，文件元数据进入 AnalyzeInput.uploads） |
| 酒商 | `src/app/trade/page.tsx` | `TradeDashboard`, `BordeauxMap`（react-simple-maps + inline GeoJSON）, 4 个 Recharts |
| 国际化 | `src/lib/i18n/{dict,Provider}.tsx` | `useT()` hook + `LocaleSwitcher` |
| 共享 | `src/components/wine/shared/` | `ExportButton`（window.print）, `SubscribeDialog`（→ `/api/subscribe` stub） |

## 2. 文件地图与 Owner

| 文件 | 用途 | 状态 | 推荐 Owner |
|---|---|---|---|
| `src/lib/agents/orchestrator.ts` | OpenAI tool-use 路由循环 | ✅ 完成 | — (勿改) |
| `src/lib/agents/types.ts` | SubAgent 契约 + AgentResult | ✅ 完成 | — (勿改) |
| `src/lib/agents/sub-agents/weather.ts` | 历史气候 + 官方预报 | 🟡 stub | **Dev A** |
| `src/lib/agents/sub-agents/geo.ts` | 地理 / 风土 / appellation 边界 | 🟡 stub | **Dev B** |
| `src/lib/agents/sub-agents/tavily.ts` | 公开网络搜索（酒庄/媒体/政府/论坛） | 🟡 stub | **Dev C** |
| `src/lib/agents/extraction.ts` | 风险打分 + 推荐生成 | 🟡 heuristic stub | **Dev D**（模型方向） |
| `src/lib/agents/feature.ts` | 特征层（待定义） | 🟡 stub | **TBD（owner 后续给）** |
| `src/lib/training/pioneer.ts` | Pioneer GLiNER2 classifier (`classify()`) | ✅ 完成 | data team 训练模型，dev 接入 |
| `src/lib/wine/types.ts` | 域类型（AnalyzeInput/Result 等） | ✅ 完成 | — (共享) |
| `src/lib/wine/regions.ts` | Burgundy + Bordeaux 静态产区清单 | ✅ 完成 | 可扩展 |
| `src/app/api/analyze/route.ts` | POST 入口 | ✅ 完成 | — (勿改) |
| `src/components/wine/*` | Dashboard UI | ✅ 完成 | 可迭代 |
| `src/lib/demo/fixtures.ts` | demo mode fixture | ✅ 完成 | 新 sub-agent 需补 fixture 分支 |

---

## 3. SubAgent 契约（每个 sub-agent 必读）

每个 sub-agent 都是这个接口的实现（见 `src/lib/agents/types.ts`）：

```ts
export interface SubAgent<TInput, TData> {
  name: string;              // snake_case，必须唯一，传给 OpenAI 当 tool name
  description: string;       // 告诉 OpenAI WHEN to call this，要具体
  input_schema: JsonSchema;  // tool 输入的 JSON-schema，OpenAI 据此填参数
  run(input: TInput, ctx: AgentContext): Promise<AgentResult<TData>>;
}
```

**Orchestrator 的承诺**：
- 不会让 sub-agent 之间互相调用 —— 所有协调由 OpenAI 在 tool-use 循环里完成。
- 单个 sub-agent 抛错不会让整个 loop 崩溃（`runAgentSafely` 包了 try/catch）。
- `ctx.signal: AbortSignal` 会在请求被取消 / 超时时触发，长任务请 honor 它。

**你的 sub-agent 必须保证**：
- ✅ `run()` 永远 resolve，永远不要 reject（错误用 `{ ok: false, error: "..." }`）。
- ✅ 返回的 `data` 类型与你声明的 `TData` 一致 —— extraction_agent 会按此读取。
- ✅ `input_schema` 描述准确 —— OpenAI 看 description + schema 决定怎么调你。
- ❌ 不要在 sub-agent 里调 OpenAI 做"主决策" —— 那是 orchestrator 的职责。
- ❌ 不要往 `src/lib/agents/orchestrator.ts` 里加分支 —— 替换 stub body 即可。

---

## 4. 怎么开发一个 sub-agent（以 weather_agent 为例）

### 步骤 1：替换 `run()` body

`src/lib/agents/sub-agents/weather.ts` 当前：

```ts
async run(input) {
  return {
    agent: "weather_agent",
    ok: true,
    durationMs: 0,
    data: { /* stub */ },
    summary: "stub climate metrics",
  };
}
```

替换为真实实现，例如调 Open-Meteo：

```ts
async run(input, ctx) {
  const t0 = Date.now();
  try {
    const region = findRegion(input.regionId);
    if (!region) throw new Error(`Unknown region: ${input.regionId}`);

    const res = await fetch(buildOpenMeteoUrl(region.centroid, input.start, input.end), {
      signal: ctx.signal,
    });
    if (!res.ok) throw new Error(`Open-Meteo HTTP ${res.status}`);
    const raw = await res.json();

    const metrics = aggregateMetrics(raw);     // GDD / frost days / 异常
    return {
      agent: "weather_agent",
      ok: true,
      durationMs: Date.now() - t0,
      data: {
        summary: `${region.name}: GDD ${metrics.gdd}, frost ${metrics.frostDays}d`,
        metrics: [...],
        notes: [...],
      },
      summary: `GDD=${metrics.gdd}`,
    };
  } catch (err) {
    return {
      agent: "weather_agent",
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      durationMs: Date.now() - t0,
    };
  }
}
```

### 步骤 2：补 demo fixture 分支

在 `src/lib/demo/fixtures.ts` 加（如果你的 agent 需要独立 fixture）：

```ts
export function demoWeatherSignals(regionId: string): WeatherSignals { ... }
```

然后在 sub-agent 顶部加：

```ts
if (isDemoMode) return { agent: "weather_agent", ok: true, durationMs: 0, data: demoWeatherSignals(input.regionId) };
```

> **为什么**：H3 — demo mode 是 demo rehearsal 的保险，每个 sub-agent 必须有 fixture 分支。

### 步骤 3：env-gate（如果用了外部 API）

如果需要 API key，加到 `src/lib/env.ts` 的 `serverSchema`，再到 `integrations`：

```ts
// env.ts
WEATHER_API_KEY: z.string().min(1).optional(),
// ...
export const integrations = {
  tavily: Boolean(env.TAVILY_API_KEY),
  pioneer: Boolean(env.PIONEER_API_KEY),
  weather: Boolean(env.WEATHER_API_KEY),  // 新增
};
```

也要更新 `.env.example`。Sub-agent 检查 `integrations.weather`，缺 key 时走 fallback（不要 throw）。

### 步骤 4：本地验证

```bash
# 单元测试你的 agent（建议）
pnpm tsx scripts/test-agent.ts weather  # 自己写一个小 runner

# 端到端
pnpm dev
curl -X POST http://localhost:3000/api/analyze \
  -H 'content-type: application/json' \
  -d '{"region":{"id":"burgundy-cote-de-nuits","name":"Côte de Nuits","parent":"burgundy"},
       "timeframe":{"start":"2026-05-16","end":"2026-08-14"},
       "persona":"vineyard"}'
```

查 response 里 `trace[]`，找你 agent 的那一条 → `ok: true` 且 `summary` 是你期望的内容。

---

## 5. Extraction Agent 特别说明（Dev D 看）

`extraction.ts` 当前是**确定性启发式**（计 3 个上游 ok 数 × 10 + 30），目的是让 orchestrator 端到端跑通。

**真实实现建议** — 三选一或组合：

**(a) OpenAI structured output（推荐起步方案）**

```ts
import { openaiClient } from "@/lib/ai/openai";

async run(input) {
  if (!sponsors.openai) return heuristicFallback(input);

  const client = openaiClient();
  const res = await client.chat.completions.create({
    model: env.OPENAI_MODEL,
    messages: [
      { role: "system", content: EXTRACTION_SYSTEM_PROMPT },
      { role: "user", content: buildExtractionPrompt(input) },  // 拼 weather/geo/tavily summaries
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "risk_assessment",
        strict: true,
        schema: RISK_SCHEMA,   // score / drivers / recommendations / rationale
      },
    },
  });
  return parseStructuredOutput(res);
}
```

**(b) Pioneer GLiNER2 classifier（如果 data team 已经训好模型）**

```ts
import { classify } from "@/lib/training/pioneer";

async run(input) {
  const cls = await classify({
    text: buildExtractionPrompt(input),
    task: "risk_band",
    labels: ["low", "moderate", "elevated", "high"],
  });
  // cls?.label = 训练好的 wine-domain 分类器输出
  // 把 band 映射到 score（如 "high" → 78），drivers 用启发式拆分
  if (!cls?.label) return heuristicFallback(input);
  return mapBandToOutput(cls.label, input);
}
```

**(c) 混合**：Pioneer 出 band（结构化、确定性强），OpenAI 出 driver/recommendation narrative（自由文本灵活）。

**契约必须满足**：
- `score` ∈ [0, 100]
- `drivers[].weight` 之和 ≤ 1.0
- `recommendations[].persona` 全等于 `input.persona`
- 即使 LLM/classifier 调用失败，也要返回 heuristic fallback，不能 reject

---

## 6. Feature Agent（待定义）

Owner 待定。当前是 passthrough stub。两个候选方向：

- **A — 预测维度展开**：把单一 riskScore 拆成多维（产量风险 / 价格风险 / 物流风险 / 法规风险），每个维度有独立分数。
- **B — Pioneer 特征分类**：调 `classify({text, task, labels})` 让 Pioneer 上训好的行业分类器给每条 driver 打标（"frost_event" / "demand_softness" / "regulation_change"…），输出更结构化的 feature payload。

定义后请：
1. 改 `FeatureInput` / `FeatureOutput` 类型
2. 更新 `description` 让 OpenAI 知道何时调
3. 在 orchestrator 的 SYSTEM_PROMPT 里加一行 procedure（"4. After extraction_agent, call feature_agent..."）

---

## 7. Pioneer.ai 集成

Pioneer.ai 是 **OpenAI-compatible LLM hosting**（POST `/v1/chat/completions`，Bearer 鉴权）。
文档：https://docs.pioneer.ai/

**当前定位（feature_agent tier-1 LLM）：**

```
extraction (OpenAI gpt-4o-mini · schema-grounded JSON)
        │
        ▼
feature (3-tier)
  ├─ tier 1 → Pioneer-hosted 开源模型（Qwen / GLM / Llama 7-8B 类）
  │           — 小模型负责"包装"（exec summary · report · digest）
  │           — response_format: json_object + 提示明确 JSON 契约
  │           — 比 gpt-4o-mini 快 / 便宜，演示故事更紧
  ├─ tier 2 → OpenAI structured output (json_schema strict) fallback
  └─ tier 3 → deterministic template，从 extraction 输出拼装
```

**为什么这样分工**：
- gpt 类大模型做**重推理**（extraction 走 schema 算分，需要遵循复杂规则）
- Pioneer host 的小开源 LLM 做**轻量包装/生成**（feature 把数字翻成 markdown）
- Pioneer 当前 hosted gpt-5.5 不可微调；**Pioneer 本地模型可微调** —— dev/data team 拿葡萄酒行业语料训练一个 wine-domain 本地模型后，**swap PIONEER_MODEL_ID 就生效，feature.ts 代码 0 改动**
- Sponsor 集成有实际功能价值，不是装饰

Adapter `src/lib/training/pioneer.ts` 对外只暴露 **一个函数**：

```ts
pioneerChat(messages: PioneerChatMessage[], opts?: {
  modelId?: string;       // 覆盖 env PIONEER_MODEL_ID（用于 A/B）
  timeoutMs?: number;     // 默认 15000
  responseFormat?: object; // OpenAI 兼容的 response_format（json_object / json_schema）
  temperature?: number;
}): Promise<{ content: string; modelId: string; latencyMs: number } | null>
```

**约定**：
- 任何失败（缺 key/model_id、超时、网络错误、空响应）都返回 `null`。**不抛错** —— caller 无脑 fallback。
- 内部用 `AbortController` + 15 秒上限；`signal: ctrl.signal` 已传入 fetch。

**典型 caller**：

```ts
// feature_agent (tier-1, 当前主调用方)
import { pioneerChat } from "@/lib/training/pioneer";

const res = await pioneerChat(
  [
    { role: "system", content: "...Output STRICTLY this JSON: {executiveSummary, reportMarkdown, emailDigest}..." },
    { role: "user", content: buildExtractionSummaryFromInput(input) },
  ],
  { responseFormat: { type: "json_object" }, temperature: 0.2 },
);
if (res) return JSON.parse(res.content);
// 否则降级到 tier-2 OpenAI structured，再失败到 tier-3 template
```

**Env 配置**：
- `PIONEER_API_KEY` — Pioneer dashboard 拿，形如 `pio_sk_xxxxx`。**只放 `.env.local`，绝不入 git**
- `PIONEER_MODEL_ID` — Pioneer dashboard 里选好 model 后拿到的 UUID
- `PIONEER_BASE_URL` — 默认 `https://api.pioneer.ai`，一般无需改

---

## 8. API 契约（前后端共享）

### POST `/api/analyze`

**Request:**
```json
{
  "region":    { "id": "burgundy-cote-de-nuits", "name": "Côte de Nuits", "parent": "burgundy" },
  "timeframe": { "start": "2026-05-16", "end": "2026-08-14" },
  "persona":   "vineyard",
  "question":  "focus on frost risk in April"
}
```

**Response (200):**
```ts
interface AnalyzeResult {
  region: { id: string; name: string; parent: "burgundy" | "bordeaux" };
  timeframe: { start: string; end: string };
  persona: "vineyard" | "trade";
  riskScore: number;          // 0–100
  riskBand: "low" | "moderate" | "elevated" | "high";
  drivers: Array<{ source: "weather"|"geo"|"tavily"|"extraction"; signal: string; weight: number }>;
  recommendations: Array<{ persona: "vineyard"|"trade"; action: string; evidence?: string }>;
  trace: Array<{ agent: string; ok: boolean; durationMs: number; summary?: string; error?: string }>;
  generatedAt: string;        // ISO
  isDemoOrPartial: boolean;   // true 表示降级（demo / 缺 key / sub-agent 失败）
}
```

**Errors:**
- `400` — zod 校验失败
- `503` — `SponsorUnavailableError`（关键 sponsor 缺 key）
- `500` — 其他 throw

类型定义在 `src/lib/wine/types.ts`，前后端**共享同一文件**（无 `server-only` 导入）。

---

## 9. Demo Mode（不要破坏）

`NEXT_PUBLIC_DEMO_MODE=true` 时：
- Orchestrator 直接返回 `demoWineAnalysis(input)`，不调 OpenAI，不调 sub-agent。
- 每个 sub-agent **应该**在 `run()` 开头检查 `isDemoMode` 并返回独立 fixture（虽然 orchestrator 已经短路，但单元测试时会用到）。

**测试 demo mode：**
```bash
NEXT_PUBLIC_DEMO_MODE=true pnpm dev
# 然后访问 http://localhost:3000，点 "Run analysis"
# 或 curl /api/analyze（见上节）
```

**为什么重要**：现场 demo 时 sponsor API 可能限流 / 挂掉。Demo mode 是保险绳。

---

## 10. 协作规约

- **分支策略**：每个 sub-agent 一个 feature 分支，例如 `agent/weather`、`agent/geo`、`agent/tavily`、`agent/extraction`。
- **PR 标题**：`feat(agent): wire weather_agent to Open-Meteo` 这种。
- **每个 PR 必须包含**：
  - sub-agent 真实实现
  - demo fixture 分支
  - `pnpm typecheck` 通过
  - `pnpm lint` 通过
  - `curl /api/analyze` 截图（response 里你的 trace 行 `ok: true`）

- **不要碰**：
  - `orchestrator.ts`（如要改路由，先开 issue 讨论）
  - `types.ts`（SubAgent 契约）
  - `analyze/route.ts`（API surface）

- **可以扩展**：
  - `regions.ts`（加更多产区）
  - `components/wine/*`（UI 迭代）
  - `fixtures.ts`（更丰富的 demo 数据）

- **Commit 规则**：
  - 遵循 H1（不提交 secret / PII）— commit 前 `git diff --cached` 自查
  - 遵循 H5（不带 `Co-Authored-By: Claude` 尾巴）

---

## 11. 一图小抄

```
看完这个文档你应该知道：
  ↓
1. 我负责改哪个文件？     → §2 文件地图
2. 我要满足什么契约？     → §3 SubAgent 契约
3. 怎么落地？            → §4 步骤 1-4
4. 我的输出会被怎么用？   → §5 extraction / §8 API 契约
5. 测试怎么搞？          → §4 步骤 4 + §9 demo mode
6. 合并怎么走？          → §10 协作规约
```

有疑问开 issue 或 PR draft，不要堵在群里 ping。
