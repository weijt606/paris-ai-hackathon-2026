/**
 * i18n dictionary — English (en) + French (fr).
 *
 * Source of truth for every user-facing string. Add a key here, then use
 * `useT()(key)` from any component. Keep keys snake_case + namespaced.
 */

export type Locale = "en" | "fr";

export const LOCALES: { code: Locale; label: string; short: string }[] = [
  { code: "en", label: "English", short: "EN" },
  { code: "fr", label: "Français", short: "FR" },
];

export const DEFAULT_LOCALE: Locale = "en";

export const DICT = {
  // ── common ────────────────────────────────────────────────────────────
  "common.app_name": { fr: "Wine Signals", en: "Wine Signals" },
  "common.back_home": { fr: "Retour à l'accueil", en: "Back to home" },
  "common.config": { fr: "Configuration", en: "Configuration" },
  "common.loading": { fr: "Chargement…", en: "Loading…" },
  "common.error": { fr: "Erreur", en: "Error" },
  "common.demo_mode": { fr: "Mode démo", en: "Demo mode" },
  "common.run_analysis": { fr: "Lancer l'analyse", en: "Run analysis" },
  "common.running": { fr: "En cours…", en: "Running…" },
  "common.export_report": { fr: "Exporter le rapport", en: "Export report" },
  "common.subscribe": { fr: "S'abonner", en: "Subscribe" },
  "common.cancel": { fr: "Annuler", en: "Cancel" },
  "common.confirm": { fr: "Confirmer", en: "Confirm" },
  "common.region": { fr: "Région", en: "Region" },
  "common.timeframe": { fr: "Période", en: "Timeframe" },
  "common.start_date": { fr: "Début", en: "From" },
  "common.end_date": { fr: "Fin", en: "To" },
  "common.search": { fr: "Rechercher", en: "Search" },
  "common.clear": { fr: "Effacer", en: "Clear" },
  "common.close": { fr: "Fermer", en: "Close" },
  "common.fullscreen": { fr: "Plein écran", en: "Fullscreen" },
  "common.exit_fullscreen": { fr: "Quitter le plein écran", en: "Exit fullscreen" },
  "common.question_placeholder": {
    fr: "Optionnel : précisez votre question, p. ex. risque de gel en avril",
    en: "Optional: focus question, e.g. frost risk in April",
  },

  // ── timeframe modes ───────────────────────────────────────────────────
  "timeframe.mode.year": { fr: "Par année", en: "By year" },
  "timeframe.mode.month": { fr: "Par mois", en: "By month" },
  "timeframe.mode.range": { fr: "Personnalisé", en: "Custom range" },
  "timeframe.label.year": { fr: "Année", en: "Year" },
  "timeframe.label.month": { fr: "Mois", en: "Month" },

  // ── landing ───────────────────────────────────────────────────────────
  "landing.tagline": {
    fr: "Bourgogne & Bordeaux · Renseignement multi-agent sur le vin",
    en: "Burgundy & Bordeaux · Multi-agent wine risk & market intelligence",
  },
  "landing.choose_entry": {
    fr: "Choisissez votre profil",
    en: "Choose your role",
  },
  "landing.vineyard.title": { fr: "Domaine viticole", en: "Vineyard" },
  "landing.vineyard.subtitle": {
    fr: "Téléversez vos données pour affiner les prévisions de risques",
    en: "Upload your records to sharpen cultivation & harvest risk forecasts",
  },
  "landing.vineyard.cta": {
    fr: "Accéder au domaine",
    en: "Open the vineyard panel",
  },
  "landing.trade.title": { fr: "Négoce", en: "Trade" },
  "landing.trade.subtitle": {
    fr: "Acheteurs · supermarchés · restaurants · agents · carte de Bordeaux + tableau de bord",
    en: "Buyers · supermarkets · restaurants · agents · Bordeaux map + multi-chart dashboard",
  },
  "landing.trade.cta": {
    fr: "Accéder au négoce",
    en: "Open the trade dashboard",
  },

  // ── vineyard ──────────────────────────────────────────────────────────
  "vineyard.title": {
    fr: "Tableau de bord — Domaine",
    en: "Vineyard dashboard",
  },
  "vineyard.subtitle": {
    fr: "Choisissez votre région et téléversez vos documents internes",
    en: "Pick a region and timeframe, then upload your internal docs to enrich the analysis",
  },
  "vineyard.upload.title": {
    fr: "Documents internes",
    en: "Internal documents",
  },
  "vineyard.upload.hint": {
    fr: "Glissez vos fichiers ici ou cliquez (PDF / CSV / XLSX / images)",
    en: "Drag files here or click to pick (PDF / CSV / XLSX / images)",
  },
  "vineyard.upload.empty": { fr: "Aucun document", en: "No files yet" },
  "vineyard.upload.remove": { fr: "Retirer", en: "Remove" },
  "vineyard.upload.context_badge": {
    fr: "{n} document(s) seront joints à l'analyse",
    en: "{n} file(s) will be attached to the analysis",
  },

  // ── trade ─────────────────────────────────────────────────────────────
  "trade.title": {
    fr: "Tableau de bord — Négoce",
    en: "Trade dashboard",
  },
  "trade.subtitle": {
    fr: "Cliquez sur la carte pour sélectionner une appellation",
    en: "Click the map to pick a Bordeaux appellation; multi-chart view supports buying decisions",
  },
  "trade.map.title": {
    fr: "Carte des appellations de Bordeaux",
    en: "Bordeaux appellations map",
  },
  "trade.map.search_placeholder": {
    fr: "Rechercher un château, AOC ou commune…",
    en: "Search a château, AOC or commune…",
  },
  "trade.map.no_match": { fr: "Aucun résultat", en: "No match" },
  "trade.map.legend_low": { fr: "Risque faible", en: "Low risk" },
  "trade.map.legend_high": { fr: "Risque élevé", en: "High risk" },
  "trade.charts.drivers": { fr: "Facteurs de risque", en: "Risk drivers" },
  "trade.charts.weather": {
    fr: "Tendances climatiques (12 derniers mois)",
    en: "Weather trends (last 12 months)",
  },
  "trade.charts.weather.temp": { fr: "Anomalie thermique", en: "Temp anomaly" },
  "trade.charts.weather.precip": { fr: "Précipitations", en: "Precipitation" },
  "trade.charts.weather.frost": { fr: "Jours de gel", en: "Frost days" },
  "trade.charts.weather.avg_temp": { fr: "Anomalie moy.", en: "Avg Δ temp" },
  "trade.charts.weather.total_precip": { fr: "Précip. totale", en: "Total precip." },
  "trade.charts.weather.total_frost": { fr: "Jours de gel", en: "Frost days" },
  "trade.charts.regional": {
    fr: "Comparatif des appellations",
    en: "Risk comparison across appellations",
  },
  "trade.charts.sentiment": { fr: "Sentiment de marché", en: "Market sentiment" },
  "trade.no_result": {
    fr: "Sélectionnez une appellation puis lancez l'analyse",
    en: "Pick an appellation, then click Run analysis",
  },
  "trade.focus_chateau": { fr: "Château ciblé", en: "Focus château" },

  // ── results ───────────────────────────────────────────────────────────
  "result.risk_score": { fr: "Score de risque", en: "Risk score" },
  "result.band.low": { fr: "Faible", en: "Low" },
  "result.band.moderate": { fr: "Modéré", en: "Moderate" },
  "result.band.elevated": { fr: "Élevé", en: "Elevated" },
  "result.band.high": { fr: "Critique", en: "Critical" },
  "result.drivers": { fr: "Facteurs", en: "Drivers" },
  "result.recommendations": { fr: "Recommandations", en: "Recommendations" },
  "result.trace": { fr: "Trace des agents", en: "Agent trace" },
  "result.partial": {
    fr: "Résultat partiel (mode démo / clé manquante / sous-agent en échec)",
    en: "Partial result (demo mode / missing key / sub-agent failure)",
  },

  // ── feature ───────────────────────────────────────────────────────────
  "feature.summary.title": { fr: "Synthèse", en: "Executive summary" },
  "terroir.title": { fr: "Terroir", en: "Terroir snapshot" },
  "feature.report.download": {
    fr: "Télécharger le rapport",
    en: "Download report",
  },
  "subscribe.preview_label": {
    fr: "Vous recevrez un digest comme celui-ci :",
    en: "You'll receive a digest like this:",
  },

  // ── workflow ──────────────────────────────────────────────────────────
  "workflow.title": { fr: "Flux de travail", en: "Workflow" },
  "workflow.state.pending": { fr: "En attente", en: "Pending" },
  "workflow.state.running": { fr: "En cours", en: "Running" },
  "workflow.state.ok": { fr: "Terminé", en: "Done" },
  "workflow.state.fail": { fr: "Échec", en: "Failed" },

  // ── persona ───────────────────────────────────────────────────────────
  "persona.vineyard": { fr: "Domaine", en: "Vineyard" },
  "persona.trade": { fr: "Négoce", en: "Trade" },

  // ── subscribe ─────────────────────────────────────────────────────────
  "subscribe.title": {
    fr: "Abonnement hebdomadaire",
    en: "Weekly report subscription",
  },
  "subscribe.description": {
    fr: "Vous recevrez chaque semaine le rapport de risque pour vos régions",
    en: "Receive a weekly risk report for the regions you follow",
  },
  "subscribe.email_placeholder": { fr: "Adresse e-mail", en: "Email address" },
  "subscribe.success": {
    fr: "Abonnement confirmé — prochain rapport lundi.",
    en: "Subscribed — next report ships Monday.",
  },
} as const;

export type DictKey = keyof typeof DICT;
