/**
 * i18n dictionary — Chinese (zh) + French (fr).
 *
 * Source of truth for every user-facing string. Add a key here, then use
 * `useT()(key)` from any component. Keep keys snake_case + namespaced.
 */

export type Locale = "zh" | "fr";

export const LOCALES: { code: Locale; label: string; short: string }[] = [
  { code: "fr", label: "Français", short: "FR" },
  { code: "zh", label: "中文", short: "中" },
];

export const DEFAULT_LOCALE: Locale = "fr";

export const DICT = {
  // ── common ────────────────────────────────────────────────────────────
  "common.app_name": { zh: "葡萄酒情报", fr: "Wine Signals" },
  "common.back_home": { zh: "返回首页", fr: "Retour à l'accueil" },
  "common.config": { zh: "配置", fr: "Configuration" },
  "common.loading": { zh: "加载中…", fr: "Chargement…" },
  "common.error": { zh: "出错了", fr: "Erreur" },
  "common.demo_mode": { zh: "演示模式", fr: "Mode démo" },
  "common.run_analysis": { zh: "运行分析", fr: "Lancer l'analyse" },
  "common.running": { zh: "运行中…", fr: "En cours…" },
  "common.export_report": { zh: "导出报告", fr: "Exporter le rapport" },
  "common.subscribe": { zh: "订阅邮件", fr: "S'abonner" },
  "common.cancel": { zh: "取消", fr: "Annuler" },
  "common.confirm": { zh: "确认", fr: "Confirmer" },
  "common.region": { zh: "产区", fr: "Région" },
  "common.timeframe": { zh: "时段", fr: "Période" },
  "common.start_date": { zh: "起始", fr: "Début" },
  "common.end_date": { zh: "结束", fr: "Fin" },
  "common.question_placeholder": {
    zh: "可选：补充你想重点关注的问题，例如：4 月霜冻风险",
    fr: "Optionnel : précisez votre question, p. ex. risque de gel en avril",
  },

  // ── landing ───────────────────────────────────────────────────────────
  "landing.tagline": {
    zh: "勃艮第 & 波尔多 · 多 agent 葡萄酒风险与市场情报",
    fr: "Bourgogne & Bordeaux · Renseignement multi-agent sur le vin",
  },
  "landing.choose_entry": {
    zh: "选择你的角色",
    fr: "Choisissez votre profil",
  },
  "landing.vineyard.title": { zh: "酒庄", fr: "Domaine viticole" },
  "landing.vineyard.subtitle": {
    zh: "上传你的资料，获取更精准的种植 / 收成风险预测",
    fr: "Téléversez vos données pour affiner les prévisions de risques",
  },
  "landing.vineyard.cta": { zh: "进入酒庄面板", fr: "Accéder au domaine" },
  "landing.trade.title": { zh: "酒商", fr: "Négoce" },
  "landing.trade.subtitle": {
    zh: "采购商 / 超市 / 餐厅 / 代理商 · 波尔多地图 + 多图表数据看板",
    fr: "Acheteurs · supermarchés · restaurants · agents · carte de Bordeaux + tableau de bord",
  },
  "landing.trade.cta": { zh: "进入酒商看板", fr: "Accéder au négoce" },

  // ── vineyard ──────────────────────────────────────────────────────────
  "vineyard.title": { zh: "酒庄面板", fr: "Tableau de bord — Domaine" },
  "vineyard.subtitle": {
    zh: "选择产区与时段，上传你的内部资料来增强分析",
    fr: "Choisissez votre région et téléversez vos documents internes",
  },
  "vineyard.upload.title": { zh: "上传内部资料", fr: "Documents internes" },
  "vineyard.upload.hint": {
    zh: "拖拽文件到此，或点击选择（PDF / CSV / XLSX / 图片）",
    fr: "Glissez vos fichiers ici ou cliquez (PDF / CSV / XLSX / images)",
  },
  "vineyard.upload.empty": { zh: "尚未上传任何资料", fr: "Aucun document" },
  "vineyard.upload.remove": { zh: "移除", fr: "Retirer" },
  "vineyard.upload.context_badge": {
    zh: "{n} 个文件将随分析一起发送",
    fr: "{n} document(s) seront joints à l'analyse",
  },

  // ── trade ─────────────────────────────────────────────────────────────
  "trade.title": { zh: "酒商看板", fr: "Tableau de bord — Négoce" },
  "trade.subtitle": {
    zh: "点击地图选择波尔多产区，多维图表辅助采购 / 库存决策",
    fr: "Cliquez sur la carte pour sélectionner une appellation",
  },
  "trade.map.title": { zh: "波尔多产区地图", fr: "Carte des appellations de Bordeaux" },
  "trade.map.legend_low": { zh: "低风险", fr: "Risque faible" },
  "trade.map.legend_high": { zh: "高风险", fr: "Risque élevé" },
  "trade.charts.drivers": { zh: "风险驱动因素", fr: "Facteurs de risque" },
  "trade.charts.weather": { zh: "气候趋势（近 6 个月）", fr: "Tendances climatiques (6 derniers mois)" },
  "trade.charts.regional": { zh: "波尔多各产区风险对比", fr: "Comparatif des appellations" },
  "trade.charts.sentiment": { zh: "市场情绪分布", fr: "Sentiment de marché" },
  "trade.no_result": {
    zh: "选择产区后点击「运行分析」",
    fr: "Sélectionnez une appellation puis lancez l'analyse",
  },

  // ── results ───────────────────────────────────────────────────────────
  "result.risk_score": { zh: "风险评分", fr: "Score de risque" },
  "result.band.low": { zh: "低", fr: "Faible" },
  "result.band.moderate": { zh: "中", fr: "Modéré" },
  "result.band.elevated": { zh: "偏高", fr: "Élevé" },
  "result.band.high": { zh: "高", fr: "Critique" },
  "result.drivers": { zh: "驱动因素", fr: "Facteurs" },
  "result.recommendations": { zh: "建议", fr: "Recommandations" },
  "result.trace": { zh: "Agent 轨迹", fr: "Trace des agents" },
  "result.partial": {
    zh: "结果为降级输出（演示模式 / 缺少 key / sub-agent 失败）",
    fr: "Résultat partiel (mode démo / clé manquante / sous-agent en échec)",
  },

  // ── persona ───────────────────────────────────────────────────────────
  "persona.vineyard": { zh: "酒庄", fr: "Domaine" },
  "persona.trade": { zh: "酒商", fr: "Négoce" },

  // ── subscribe ─────────────────────────────────────────────────────────
  "subscribe.title": { zh: "订阅每周报告", fr: "Abonnement hebdomadaire" },
  "subscribe.description": {
    zh: "我们会把你关注的产区周度风险报告发到你的邮箱",
    fr: "Vous recevrez chaque semaine le rapport de risque pour vos régions",
  },
  "subscribe.email_placeholder": { zh: "邮箱地址", fr: "Adresse e-mail" },
  "subscribe.success": {
    zh: "订阅成功！下一份报告将在周一发送。",
    fr: "Abonnement confirmé — prochain rapport lundi.",
  },
} as const;

export type DictKey = keyof typeof DICT;
