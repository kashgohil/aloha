import type { ChannelCapability, PostForm } from "./types";

// Channels register themselves via side-effect imports below. Callers
// should import from this module (not from individual channel files) so
// the registry is guaranteed populated. `getCapability` returns null for
// channels that haven't been onboarded yet; the UI hides "Open in Studio"
// when there's no capability.
const REGISTRY: Record<string, ChannelCapability> = {};

export function registerCapability(cap: ChannelCapability) {
  REGISTRY[cap.channel] = cap;
}

export function getCapability(channel: string): ChannelCapability | null {
  return REGISTRY[channel] ?? null;
}

export function getForm(
  channel: string,
  formId: string,
): PostForm | null {
  const cap = getCapability(channel);
  if (!cap) return null;
  return cap.forms.find((f) => f.id === formId) ?? null;
}

export function hasCapability(channel: string): boolean {
  return REGISTRY[channel] !== undefined;
}

export type { ChannelCapability, PostForm } from "./types";

// Registration. New capabilities are added by importing them here and
// calling `registerCapability`. Kept at the bottom so the exports above
// are resolved before the registrations fire.
import { bluesky } from "./bluesky";
import { facebook } from "./facebook";
import { instagram } from "./instagram";
import { linkedin } from "./linkedin";
import { mastodon } from "./mastodon";
import { medium } from "./medium";
import { pinterest } from "./pinterest";
import { reddit } from "./reddit";
import { threads } from "./threads";
import { tiktok } from "./tiktok";
import { twitter } from "./twitter";
import { youtube } from "./youtube";

registerCapability(twitter);
registerCapability(bluesky);
registerCapability(threads);
registerCapability(mastodon);
registerCapability(linkedin);
registerCapability(facebook);
registerCapability(medium);
registerCapability(pinterest);
registerCapability(instagram);
registerCapability(tiktok);
registerCapability(youtube);
registerCapability(reddit);
