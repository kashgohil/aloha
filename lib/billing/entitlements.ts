// Single-source entitlement check used by gated features (channel connect,
// Muse-powered composer flows, etc). Always derive entitlements through
// this — never read the subscriptions table directly.

import { hasMuseInviteEntitlement } from "./muse";
import { FREE_TIER_CHANNELS } from "./pricing";
import { getLogicalSubscription } from "./service";

export type Entitlements = {
	plan: "free" | "basic" | "basic_muse";
	museEnabled: boolean;
	channelLimit: number; // Infinity once a paid plan is active
	channelsRemaining: number; // Infinity for paid plans
	currentChannels: number;
};

export async function getEntitlements(
	userId: string,
	currentChannels: number,
): Promise<Entitlements> {
	const sub = await getLogicalSubscription(userId);

	if (sub.plan === "free") {
		const museInvited = await hasMuseInviteEntitlement(userId);
		return {
			plan: "free",
			museEnabled: museInvited,
			channelLimit: FREE_TIER_CHANNELS,
			channelsRemaining: Math.max(0, FREE_TIER_CHANNELS - currentChannels),
			currentChannels,
		};
	}

	return {
		plan: sub.plan,
		museEnabled: sub.museEnabled,
		channelLimit: Number.POSITIVE_INFINITY,
		channelsRemaining: Number.POSITIVE_INFINITY,
		currentChannels,
	};
}

export function canConnectAnotherChannel(e: Entitlements): boolean {
	return e.channelsRemaining > 0;
}
