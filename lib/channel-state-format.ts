// Client-safe channel state types + visual mapping. Mirrors
// `./channel-state.ts` but without DB imports so client components can
// render state indicators without pulling the postgres driver into the
// browser bundle.

export type PublishMode = "auto" | "review_pending" | "manual_assist";

export type EffectiveState =
  | "not_connected"
  | "connected_published"
  | "connected_review_pending"
  | "connected_manual_assist";

export type ChannelStateStyle = {
  label: string;
  // Short one-liner suitable for tooltips.
  tooltip: string;
  // Small colored dot to place next to a platform name in a chip/tab.
  dotClass: string;
  // Fuller chip style for calendar-cell pills.
  chipClass: string;
};

const STYLES: Record<EffectiveState, ChannelStateStyle> = {
  not_connected: {
    label: "Not connected",
    tooltip: "This channel isn't connected.",
    dotClass: "bg-ink/20",
    chipClass: "bg-background text-ink/50 border border-dashed border-border",
  },
  connected_published: {
    label: "Live",
    tooltip: "Publishing directly when your post goes out.",
    dotClass: "bg-primary",
    chipClass: "bg-peach-100 text-ink/75 border border-border",
  },
  connected_review_pending: {
    label: "Awaiting approval",
    tooltip:
      "This platform is still in review. Your post will publish automatically once approval lands.",
    dotClass: "bg-peach-300 ring-1 ring-peach-400/60",
    chipClass: "bg-peach-200 text-ink border border-peach-300",
  },
  connected_manual_assist: {
    label: "Manual assist",
    tooltip:
      "We'll email you the pre-formatted post at publish time — copy, paste, done.",
    dotClass: "bg-primary-deep ring-1 ring-primary/40",
    chipClass:
      "bg-primary-soft text-primary-deep border border-primary/40",
  },
};

export function stateStyles(state: EffectiveState): ChannelStateStyle {
  return STYLES[state];
}

// Returns a state but defaults to "connected_published" for platforms the
// caller doesn't have a lookup for. Useful in rendering helpers where an
// unknown platform shouldn't crash the UI.
export function stateOr(
  map: Record<string, EffectiveState> | undefined,
  platform: string,
  fallback: EffectiveState = "connected_published",
): EffectiveState {
  return map?.[platform] ?? fallback;
}
