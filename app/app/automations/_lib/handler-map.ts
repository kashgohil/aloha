import type { AutomationKind } from "./templates";

// Maps each template's node positions to an execution handler slug. Keeping
// this separate from `templates.ts` keeps that file focused on UX metadata
// and this one on execution wiring. When you add a template, add its
// handler slugs here in the same order as the template's `nodes` array.
export const HANDLERS_BY_TEMPLATE: Record<AutomationKind, string[]> = {
  welcome_email: ["subscriber_joined", "send_email"],
  post_announcement: ["post_published", "post_to_slack"],
  weekly_digest: ["schedule", "send_digest_email"],
  weekly_insights: ["schedule", "send_insights_digest"],
  reply_auto: ["new_follower", "send_dm"],
  scheduled_repost: ["schedule", "repost_top"],
  tag_on_keyword: ["subscriber_joined", "keyword_match", "add_tag"],
  reengage_stale: ["schedule", "find_stale_subscribers", "send_email"],
  weekly_muse_draft: [
    "schedule",
    "muse_draft_post",
    "wait_fixed",
    "approval_status",
    "publish_post",
    "save_as_draft",
  ],
  unsubscribe_spike_alert: ["schedule", "rate_over_threshold", "send_alert"],
  auto_broadcast_on_verify: ["domain_verified", "wait_fixed", "send_broadcast"],
};

export function handlerFor(
  templateKind: AutomationKind,
  index: number,
): string {
  return HANDLERS_BY_TEMPLATE[templateKind]?.[index] ?? `unknown:${index}`;
}

// Reverse lookup: for a given event (e.g. `subscriber_joined`), which
// templates fire when they have that trigger at step 0? Used by the event
// dispatcher to find active automations.
export function templatesWithTrigger(triggerKind: string): AutomationKind[] {
  const out: AutomationKind[] = [];
  for (const [tpl, handlers] of Object.entries(HANDLERS_BY_TEMPLATE)) {
    if (handlers[0] === triggerKind) out.push(tpl as AutomationKind);
  }
  return out;
}
