/**
 * i18n dictionary — Chinese (zh) + French (fr) + English (en).
 *
 * Source of truth for every user-facing string. Add a key here, then use
 * `useT()(key)` from any component. Keep keys snake_case + namespaced.
 */

export type Locale = "zh" | "fr" | "en";

export const LOCALES: { code: Locale; label: string; short: string }[] = [
  { code: "fr", label: "Français", short: "FR" },
  { code: "en", label: "English", short: "EN" },
  { code: "zh", label: "中文", short: "中" },
];

export const DEFAULT_LOCALE: Locale = "fr";

export const DICT = {
  // ── common ────────────────────────────────────────────────────────────
  "common.app_name": { zh: "葡萄酒情报", fr: "Wine Signals", en: "Wine Signals" },
  "common.back_home": { zh: "返回首页", fr: "Retour à l'accueil", en: "Back to home" },
  "common.config": { zh: "配置", fr: "Configuration", en: "Configuration" },
  "common.loading": { zh: "加载中…", fr: "Chargement…", en: "Loading…" },
  "common.error": { zh: "出错了", fr: "Erreur", en: "Error" },
  "common.demo_mode": { zh: "演示模式", fr: "Mode démo", en: "Demo mode" },
  "common.run_analysis": { zh: "运行分析", fr: "Lancer l'analyse", en: "Run analysis" },
  "common.running": { zh: "运行中…", fr: "En cours…", en: "Running…" },
  "common.export_report": { zh: "导出报告", fr: "Exporter le rapport", en: "Export report" },
  "common.subscribe": { zh: "订阅邮件", fr: "S'abonner", en: "Subscribe" },
  "common.cancel": { zh: "取消", fr: "Annuler", en: "Cancel" },
  "common.confirm": { zh: "确认", fr: "Confirmer", en: "Confirm" },
  "common.region": { zh: "产区", fr: "Région", en: "Region" },
  "common.timeframe": { zh: "时段", fr: "Période", en: "Timeframe" },
  "common.start_date": { zh: "起始", fr: "Début", en: "From" },
  "common.end_date": { zh: "结束", fr: "Fin", en: "To" },
  "common.question_placeholder": {
    zh: "可选：补充你想重点关注的问题，例如：4 月霜冻风险",
    fr: "Optionnel : précisez votre question, p. ex. risque de gel en avril",
    en: "Optional: a focus question, e.g. frost risk in April",
  },

  // ── timeframe modes ───────────────────────────────────────────────────
  "timeframe.mode.year": { zh: "按年份", fr: "Par année", en: "By year" },
  "timeframe.mode.month": { zh: "按月份", fr: "Par mois", en: "By month" },
  "timeframe.mode.range": { zh: "自定义", fr: "Personnalisé", en: "Custom range" },
  "timeframe.label.year": { zh: "年份", fr: "Année", en: "Year" },
  "timeframe.label.month": { zh: "月份", fr: "Mois", en: "Month" },

  // ── landing ───────────────────────────────────────────────────────────
  "landing.tagline": {
    zh: "勃艮第 & 波尔多 · 多 agent 葡萄酒风险与市场情报",
    fr: "Bourgogne & Bordeaux · Renseignement multi-agent sur le vin",
    en: "Burgundy & Bordeaux · Multi-agent wine risk & market intelligence",
  },
  "landing.choose_entry": {
    zh: "选择你的角色",
    fr: "Choisissez votre profil",
    en: "Choose your role",
  },
  "landing.vineyard.title": { zh: "酒庄", fr: "Domaine viticole", en: "Vineyard" },
  "landing.vineyard.subtitle": {
    zh: "上传你的资料，获取更精准的种植 / 收成风险预测",
    fr: "Téléversez vos données pour affiner les prévisions de risques",
    en: "Upload your records to sharpen cultivation & harvest risk forecasts",
  },
  "landing.vineyard.cta": {
    zh: "进入酒庄面板",
    fr: "Accéder au domaine",
    en: "Enter vineyard panel",
  },
  "landing.trade.title": { zh: "酒商", fr: "Négoce", en: "Trade" },
  "landing.trade.subtitle": {
    zh: "采购商 / 超市 / 餐厅 / 代理商 · 波尔多地图 + 多图表数据看板",
    fr: "Acheteurs · supermarchés · restaurants · agents · carte de Bordeaux + tableau de bord",
    en: "Buyers · supermarkets · restaurants · agents · Bordeaux map + multi-chart dashboard",
  },
  "landing.trade.cta": { zh: "进入酒商看板", fr: "Accéder au négoce", en: "Enter trade dashboard" },

  // ── vineyard ──────────────────────────────────────────────────────────
  "vineyard.title": { zh: "酒庄面板", fr: "Tableau de bord — Domaine", en: "Vineyard dashboard" },
  "vineyard.subtitle": {
    zh: "选择产区与时段，上传你的内部资料来增强分析",
    fr: "Choisissez votre région et téléversez vos documents internes",
    en: "Pick a region and timeframe, upload your internal docs to enhance the analysis",
  },
  "vineyard.upload.title": {
    zh: "上传内部资料",
    fr: "Documents internes",
    en: "Internal documents",
  },
  "vineyard.upload.hint": {
    zh: "拖拽文件到此，或点击选择（PDF / CSV / XLSX / 图片）",
    fr: "Glissez vos fichiers ici ou cliquez (PDF / CSV / XLSX / images)",
    en: "Drag files here or click to pick (PDF / CSV / XLSX / images)",
  },
  "vineyard.upload.empty": { zh: "尚未上传任何资料", fr: "Aucun document", en: "No files yet" },
  "vineyard.upload.remove": { zh: "移除", fr: "Retirer", en: "Remove" },
  "vineyard.upload.context_badge": {
    zh: "{n} 个文件将随分析一起发送",
    fr: "{n} document(s) seront joints à l'analyse",
    en: "{n} file(s) will be attached to the analysis",
  },

  // ── trade ─────────────────────────────────────────────────────────────
  "trade.title": { zh: "酒商看板", fr: "Tableau de bord — Négoce", en: "Trade dashboard" },
  "trade.subtitle": {
    zh: "点击地图选择波尔多产区，多维图表辅助采购 / 库存决策",
    fr: "Cliquez sur la carte pour sélectionner une appellation",
    en: "Click the map to pick a Bordeaux appellation; multi-chart view supports buying decisions",
  },
  "trade.map.title": {
    zh: "波尔多产区地图",
    fr: "Carte des appellations de Bordeaux",
    en: "Bordeaux appellations map",
  },
  "trade.map.legend_low": { zh: "低风险", fr: "Risque faible", en: "Low risk" },
  "trade.map.legend_high": { zh: "高风险", fr: "Risque élevé", en: "High risk" },
  "trade.charts.drivers": {
    zh: "风险驱动因素",
    fr: "Facteurs de risque",
    en: "Risk drivers",
  },
  "trade.charts.weather": {
    zh: "气候趋势（近 6 个月）",
    fr: "Tendances climatiques (6 derniers mois)",
    en: "Weather trends (last 6 months)",
  },
  "trade.charts.regional": {
    zh: "波尔多各产区风险对比",
    fr: "Comparatif des appellations",
    en: "Risk comparison across appellations",
  },
  "trade.charts.sentiment": {
    zh: "市场情绪分布",
    fr: "Sentiment de marché",
    en: "Market sentiment",
  },
  "trade.no_result": {
    zh: "选择产区后点击「运行分析」",
    fr: "Sélectionnez une appellation puis lancez l'analyse",
    en: "Pick an appellation, then click Run analysis",
  },

  // ── results ───────────────────────────────────────────────────────────
  "result.risk_score": { zh: "风险评分", fr: "Score de risque", en: "Risk score" },
  "result.band.low": { zh: "低", fr: "Faible", en: "Low" },
  "result.band.moderate": { zh: "中", fr: "Modéré", en: "Moderate" },
  "result.band.elevated": { zh: "偏高", fr: "Élevé", en: "Elevated" },
  "result.band.high": { zh: "高", fr: "Critique", en: "Critical" },
  "result.drivers": { zh: "驱动因素", fr: "Facteurs", en: "Drivers" },
  "result.recommendations": { zh: "建议", fr: "Recommandations", en: "Recommendations" },
  "result.trace": { zh: "Agent 轨迹", fr: "Trace des agents", en: "Agent trace" },
  "result.partial": {
    zh: "结果为降级输出（演示模式 / 缺少 key / sub-agent 失败）",
    fr: "Résultat partiel (mode démo / clé manquante / sous-agent en échec)",
    en: "Partial result (demo mode / missing key / sub-agent failure)",
  },

  // ── persona ───────────────────────────────────────────────────────────
  "persona.vineyard": { zh: "酒庄", fr: "Domaine", en: "Vineyard" },
  "persona.trade": { zh: "酒商", fr: "Négoce", en: "Trade" },

  // ── subscribe ─────────────────────────────────────────────────────────
  "subscribe.title": {
    zh: "订阅每周报告",
    fr: "Abonnement hebdomadaire",
    en: "Weekly report subscription",
  },
  "subscribe.description": {
    zh: "我们会把你关注的产区周度风险报告发到你的邮箱",
    fr: "Vous recevrez chaque semaine le rapport de risque pour vos régions",
    en: "We'll email you a weekly risk report for your selected regions",
  },
  "subscribe.email_placeholder": {
    zh: "邮箱地址",
    fr: "Adresse e-mail",
    en: "Email address",
  },
  "subscribe.success": {
    zh: "订阅成功！下一份报告将在周一发送。",
    fr: "Abonnement confirmé — prochain rapport lundi.",
    en: "Subscribed! Next report ships Monday.",
  },
} as const;

export type DictKey = keyof typeof DICT;
