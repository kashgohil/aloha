// Analytics retention policy — marketing promises "Full 24-month history on
// every plan" (app/(marketing)/analytics/page.tsx). Any future prune/cleanup
// job for platform_insights MUST respect this window regardless of plan.
export const ANALYTICS_RETENTION_MONTHS = 24;

export function analyticsRetentionCutoff(now: Date = new Date()): Date {
  const cutoff = new Date(now);
  cutoff.setUTCMonth(cutoff.getUTCMonth() - ANALYTICS_RETENTION_MONTHS);
  return cutoff;
}
