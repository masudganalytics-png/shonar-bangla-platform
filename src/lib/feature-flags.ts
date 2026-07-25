/**
 * Feature flags — MVP simplification.
 * Advanced features are implemented but hidden from the initial UI.
 * Flip to `true` (or gate behind admin role) to re-enable later.
 */
export const FEATURES = {
  ocr: false,
  aiInsights: false,
  advancedAnalytics: false,
  charts: false,
  unionRanking: false,
  exportCsv: false,
  exportExcel: false,
  notifications: false,
  adminDashboard: true, // still reachable via profile menu for admins
  futureUtilities: false,
  prediction: false,
  trendAnalysis: false,
  advancedReports: false,
  newsModule: false,
} as const;

export type FeatureFlag = keyof typeof FEATURES;
export const isEnabled = (f: FeatureFlag) => FEATURES[f];
