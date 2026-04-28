import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  BellRing,
  CalendarClock,
  CheckCircle2,
  Clock,
  Filter,
  GitBranch,
  Globe,
  Heart,
  Mail,
  Megaphone,
  MessageSquare,
  PenSquare,
  Repeat2,
  Send,
  Sparkles,
  Tag,
  TrendingDown,
  UserMinus,
  UserPlus,
} from "lucide-react";

export type AutomationKind =
  | "welcome_email"
  | "post_announcement"
  | "weekly_digest"
  | "weekly_insights"
  | "reply_auto"
  | "scheduled_repost"
  | "tag_on_keyword"
  | "reengage_stale"
  | "weekly_muse_draft"
  | "unsubscribe_spike_alert"
  | "auto_broadcast_on_verify";

export type ConfigField =
  | {
      key: string;
      type: "text";
      label: string;
      placeholder?: string;
      help?: string;
      default?: string;
      required?: boolean;
    }
  | {
      key: string;
      type: "textarea";
      label: string;
      placeholder?: string;
      help?: string;
      default?: string;
      required?: boolean;
    }
  | {
      key: string;
      type: "select";
      label: string;
      help?: string;
      options: { value: string; label: string }[];
      default?: string;
      required?: boolean;
    }
  | {
      key: string;
      type: "schedule";
      label: string;
      help?: string;
      default?: { day: string; hour: number };
    };

// A template node can represent a trigger, a plain action, a conditional
// fork, or a wait/delay. Branch targets are expressed as `branches` on the
// stored step (see `StoredFlowStep`); the renderer walks those to build lanes.
export type FlowNodeType = "trigger" | "action" | "condition" | "delay";

export type FlowNode = {
  type: FlowNodeType;
  icon: LucideIcon;
  title: string;
  detail: string;
  fields?: ConfigField[];
  // Only meaningful when `type === "condition"`. Each entry is the 0-based
  // index (relative to this template's `nodes` array) that the branch lane
  // contains. When absent, the renderer treats the condition like a no-op.
  branches?: { yes?: number[]; no?: number[] };
};

export type AutomationTemplate = {
  kind: AutomationKind;
  name: string;
  summary: string;
  icon: LucideIcon;
  nodes: FlowNode[];
};

export const TEMPLATES: Record<AutomationKind, AutomationTemplate> = {
  welcome_email: {
    kind: "welcome_email",
    name: "Welcome new subscribers",
    summary:
      "Send a short, personal welcome the moment someone joins your list.",
    icon: Mail,
    nodes: [
      {
        type: "trigger",
        icon: UserPlus,
        title: "Subscriber joined",
        detail: "When a new person opts in from your public page",
      },
      {
        type: "action",
        icon: Send,
        title: "Send welcome email",
        detail: "Delivers your welcome template within 60 seconds",
        fields: [
          {
            key: "fromName",
            type: "text",
            label: "From name",
            placeholder: "Jamie at Aloha",
            required: true,
          },
          {
            key: "subject",
            type: "text",
            label: "Subject line",
            placeholder: "Welcome — here's what to expect",
            required: true,
          },
          {
            key: "body",
            type: "textarea",
            label: "Body",
            placeholder: "Short, personal, signed by you.",
            help: "Plain text. We'll add an unsubscribe footer automatically.",
            required: true,
          },
        ],
      },
    ],
  },
  post_announcement: {
    kind: "post_announcement",
    name: "Tell the team when a post is live",
    summary:
      "Get a quiet ping in Slack each time Aloha publishes on your behalf.",
    icon: BellRing,
    nodes: [
      {
        type: "trigger",
        icon: PenSquare,
        title: "Post published",
        detail: "After a scheduled post successfully goes out",
      },
      {
        type: "action",
        icon: MessageSquare,
        title: "Post to Slack",
        detail: "Notify your workspace's configured channel",
        fields: [
          {
            key: "channel",
            type: "text",
            label: "Channel",
            placeholder: "#marketing",
            default: "#general",
            required: true,
          },
          {
            key: "tone",
            type: "select",
            label: "Tone",
            options: [
              { value: "neutral", label: "Neutral headline" },
              { value: "celebratory", label: "Celebratory" },
              { value: "minimal", label: "Minimal — link only" },
            ],
            default: "neutral",
          },
        ],
      },
    ],
  },
  weekly_insights: {
    kind: "weekly_insights",
    name: "Weekly Insights to me",
    summary:
      "Monday-morning retro: top three posts and a couple of concrete suggestions for what to do more of next week.",
    icon: Sparkles,
    nodes: [
      {
        type: "trigger",
        icon: Clock,
        title: "Every Monday, 8am",
        detail: "Uses your workspace timezone",
        fields: [
          {
            key: "schedule",
            type: "schedule",
            label: "When to send",
            default: { day: "mon", hour: 8 },
          },
        ],
      },
      {
        type: "action",
        icon: Mail,
        title: "Send Insights digest",
        detail:
          "Emails workspace owners and admins. Skips the send when there's not enough data to say anything useful.",
      },
    ],
  },
  weekly_digest: {
    kind: "weekly_digest",
    name: "Weekly digest to subscribers",
    summary:
      "Collect the week's posts and send them as one tidy newsletter each Sunday.",
    icon: CalendarClock,
    nodes: [
      {
        type: "trigger",
        icon: Clock,
        title: "Every Sunday, 10am",
        detail: "Uses your workspace timezone",
        fields: [
          {
            key: "schedule",
            type: "schedule",
            label: "When to send",
            default: { day: "sun", hour: 10 },
          },
        ],
      },
      {
        type: "action",
        icon: Mail,
        title: "Email digest",
        detail: "Compiles the week's posts into a single email",
        fields: [
          {
            key: "subject",
            type: "text",
            label: "Subject line",
            placeholder: "This week on {{workspace}}",
            default: "This week's posts",
            required: true,
          },
          {
            key: "audience",
            type: "select",
            label: "Audience",
            options: [
              { value: "all", label: "All subscribers" },
              { value: "verified", label: "Verified only" },
            ],
            default: "all",
          },
        ],
      },
    ],
  },
  reply_auto: {
    kind: "reply_auto",
    name: "Reply to first-time followers",
    summary:
      "Send a short thank-you DM when someone follows one of your channels.",
    icon: MessageSquare,
    nodes: [
      {
        type: "trigger",
        icon: UserPlus,
        title: "New follower",
        detail: "Detected across your connected channels",
      },
      {
        type: "action",
        icon: MessageSquare,
        title: "Send DM",
        detail: "Your saved first-reply template, personalized with their name",
        fields: [
          {
            key: "message",
            type: "textarea",
            label: "DM template",
            placeholder: "Hey {{name}} — thanks for the follow!",
            help: "Use {{name}} to personalize.",
            required: true,
          },
        ],
      },
    ],
  },
  scheduled_repost: {
    kind: "scheduled_repost",
    name: "Repost your top performer",
    summary:
      "Every two weeks, re-share the best-performing post from the prior window.",
    icon: Repeat2,
    nodes: [
      {
        type: "trigger",
        icon: Clock,
        title: "Every 14 days",
        detail: "Measured against the previous cycle",
        fields: [
          {
            key: "intervalDays",
            type: "select",
            label: "Cadence",
            options: [
              { value: "7", label: "Every 7 days" },
              { value: "14", label: "Every 14 days" },
              { value: "30", label: "Every 30 days" },
            ],
            default: "14",
          },
        ],
      },
      {
        type: "action",
        icon: Send,
        title: "Repost winner",
        detail: "Re-queues with a fresh caption",
        fields: [
          {
            key: "captionMode",
            type: "select",
            label: "Caption",
            options: [
              { value: "keep", label: "Keep original" },
              { value: "rewrite", label: "Rewrite with a fresh angle" },
            ],
            default: "rewrite",
          },
        ],
      },
    ],
  },

  tag_on_keyword: {
    kind: "tag_on_keyword",
    name: "Tag new subscribers by keyword",
    summary:
      "When a new subscriber joins, auto-tag them if their name or email matches a keyword you care about.",
    icon: Tag,
    nodes: [
      {
        type: "trigger",
        icon: UserPlus,
        title: "Subscriber joined",
        detail: "Fires once per new opt-in",
      },
      {
        type: "condition",
        icon: GitBranch,
        title: "Matches keyword?",
        detail: "Compares against the field you pick",
        fields: [
          {
            key: "keyword",
            type: "text",
            label: "Keyword",
            placeholder: "founder",
            required: true,
          },
          {
            key: "field",
            type: "select",
            label: "Check against",
            options: [
              { value: "email", label: "Email address" },
              { value: "name", label: "Display name" },
              { value: "both", label: "Either" },
            ],
            default: "both",
          },
        ],
        branches: { yes: [2] },
      },
      {
        type: "action",
        icon: Tag,
        title: "Add tag",
        detail: "Applied to the subscriber record",
        fields: [
          {
            key: "tag",
            type: "text",
            label: "Tag",
            placeholder: "founder",
            required: true,
          },
        ],
      },
    ],
  },

  reengage_stale: {
    kind: "reengage_stale",
    name: "Re-engage stale subscribers",
    summary:
      "Find subscribers who haven't opened anything in a while and send a short check-in email.",
    icon: Heart,
    nodes: [
      {
        type: "trigger",
        icon: Clock,
        title: "Weekly check",
        detail: "Runs at the time you pick",
        fields: [
          {
            key: "schedule",
            type: "schedule",
            label: "When to scan",
            default: { day: "mon", hour: 9 },
          },
        ],
      },
      {
        type: "action",
        icon: Filter,
        title: "Find stale subscribers",
        detail: "Filters your list by inactivity window",
        fields: [
          {
            key: "inactiveDays",
            type: "select",
            label: "Inactive for at least",
            options: [
              { value: "30", label: "30 days" },
              { value: "60", label: "60 days" },
              { value: "90", label: "90 days" },
            ],
            default: "60",
          },
        ],
      },
      {
        type: "action",
        icon: UserMinus,
        title: "Send re-engage email",
        detail: "A short 'still here?' note with one link",
        fields: [
          {
            key: "subject",
            type: "text",
            label: "Subject",
            default: "Still want these in your inbox?",
            required: true,
          },
          {
            key: "body",
            type: "textarea",
            label: "Body",
            placeholder:
              "Hey — just checking in. If these still land well, no action needed.",
            required: true,
          },
        ],
      },
    ],
  },

  weekly_muse_draft: {
    kind: "weekly_muse_draft",
    name: "Weekly Muse draft",
    summary:
      "Every week, have Muse draft a post in your voice, hold it for review, and publish if you approve.",
    icon: Sparkles,
    nodes: [
      {
        type: "trigger",
        icon: Clock,
        title: "Weekly schedule",
        detail: "Muse drafts on the cadence you pick",
        fields: [
          {
            key: "schedule",
            type: "schedule",
            label: "Draft on",
            default: { day: "fri", hour: 8 },
          },
        ],
      },
      {
        type: "action",
        icon: PenSquare,
        title: "Draft a post",
        detail: "Saved as a draft — nothing is published yet",
        fields: [
          {
            key: "topic",
            type: "text",
            label: "Topic hint",
            placeholder: "What you're building this week",
            help: "Muse uses this as a starting angle.",
          },
          {
            key: "channel",
            type: "select",
            label: "Target channel",
            options: [
              { value: "any", label: "Best fit" },
              { value: "linkedin", label: "LinkedIn" },
              { value: "x", label: "X" },
              { value: "bluesky", label: "Bluesky" },
            ],
            default: "any",
          },
        ],
      },
      {
        type: "delay",
        icon: Clock,
        title: "Hold for review",
        detail: "Gives you a window to edit or reject",
        fields: [
          {
            key: "holdHours",
            type: "select",
            label: "How long",
            options: [
              { value: "12", label: "12 hours" },
              { value: "24", label: "1 day" },
              { value: "48", label: "2 days" },
            ],
            default: "24",
          },
        ],
      },
      {
        type: "condition",
        icon: GitBranch,
        title: "Approved?",
        detail: "Checks whether you marked it ready",
        branches: { yes: [4], no: [5] },
      },
      {
        type: "action",
        icon: Send,
        title: "Publish",
        detail: "Goes to the target channel at the next send slot",
      },
      {
        type: "action",
        icon: PenSquare,
        title: "Keep as draft",
        detail: "Sits in your drafts until you decide",
      },
    ],
  },

  unsubscribe_spike_alert: {
    kind: "unsubscribe_spike_alert",
    name: "Unsubscribe spike alert",
    summary:
      "Watch your unsubscribe rate each day and ping you when it crosses a threshold.",
    icon: AlertTriangle,
    nodes: [
      {
        type: "trigger",
        icon: Clock,
        title: "Daily check",
        detail: "Runs once a day in your workspace timezone",
        fields: [
          {
            key: "schedule",
            type: "schedule",
            label: "When to check",
            default: { day: "mon", hour: 9 },
            help: "Day of week is ignored — this runs daily.",
          },
        ],
      },
      {
        type: "condition",
        icon: TrendingDown,
        title: "Rate above threshold?",
        detail: "Compares yesterday's rate to the baseline",
        fields: [
          {
            key: "threshold",
            type: "select",
            label: "Alert when above",
            options: [
              { value: "1", label: "1% daily" },
              { value: "2", label: "2% daily" },
              { value: "5", label: "5% daily" },
            ],
            default: "2",
          },
        ],
        branches: { yes: [2] },
      },
      {
        type: "action",
        icon: BellRing,
        title: "Send alert",
        detail: "Notifies you with the offending window",
        fields: [
          {
            key: "destination",
            type: "select",
            label: "Where to send",
            options: [
              { value: "email", label: "Email me" },
              { value: "slack", label: "Slack" },
              { value: "both", label: "Both" },
            ],
            default: "email",
          },
        ],
      },
    ],
  },

  auto_broadcast_on_verify: {
    kind: "auto_broadcast_on_verify",
    name: "Welcome broadcast on domain verify",
    summary:
      "The moment a sending domain finishes verifying, send a short welcome broadcast to your list.",
    icon: Megaphone,
    nodes: [
      {
        type: "trigger",
        icon: Globe,
        title: "Domain verified",
        detail: "Fires when DKIM clears on a BYO domain",
      },
      {
        type: "delay",
        icon: Clock,
        title: "Grace period",
        detail: "Waits a bit before sending, in case you want to cancel",
        fields: [
          {
            key: "minutes",
            type: "select",
            label: "Wait",
            options: [
              { value: "5", label: "5 minutes" },
              { value: "10", label: "10 minutes" },
              { value: "30", label: "30 minutes" },
            ],
            default: "10",
          },
        ],
      },
      {
        type: "action",
        icon: CheckCircle2,
        title: "Send broadcast",
        detail: "Goes to every verified subscriber",
        fields: [
          {
            key: "subject",
            type: "text",
            label: "Subject",
            default: "We're live — short note from me",
            required: true,
          },
          {
            key: "body",
            type: "textarea",
            label: "Body",
            placeholder:
              "Quick note to say hi now that this list is officially sending from my own domain.",
            required: true,
          },
          {
            key: "audience",
            type: "select",
            label: "Audience",
            options: [
              { value: "all", label: "All subscribers" },
              { value: "tagged", label: "Only tagged 'early'" },
            ],
            default: "all",
          },
        ],
      },
    ],
  },
};

// Templates whose steps invoke Muse-backed actions. Kept in sync with the
// handler-map so the pickers and server guards agree on what's gated.
export const MUSE_TEMPLATE_KINDS: ReadonlySet<AutomationKind> = new Set<AutomationKind>([
  "weekly_muse_draft",
]);

export function templateRequiresMuse(kind: AutomationKind): boolean {
  return MUSE_TEMPLATE_KINDS.has(kind);
}

// Templates whose final action still requires an integration we haven't
// built yet (Slack OAuth for post_to_slack, per-platform DM write APIs for
// send_dm). Showing them as "coming soon" keeps the roadmap visible without
// letting users create automations that would no-op the critical step.
// Remove from this set once the backing handler is real.
export const COMING_SOON_TEMPLATE_KINDS: ReadonlySet<AutomationKind> =
  new Set<AutomationKind>(["post_announcement", "reply_auto"]);

export function templateIsComingSoon(kind: AutomationKind): boolean {
  return COMING_SOON_TEMPLATE_KINDS.has(kind);
}

// Order templates so coming-soon ones sink to the end — the picker reads
// this list directly, so sorting here keeps every surface consistent.
export const TEMPLATE_LIST: AutomationTemplate[] = Object.values(TEMPLATES)
  .slice()
  .sort((a, b) => {
    const aSoon = COMING_SOON_TEMPLATE_KINDS.has(a.kind) ? 1 : 0;
    const bSoon = COMING_SOON_TEMPLATE_KINDS.has(b.kind) ? 1 : 0;
    return aSoon - bSoon;
  });
