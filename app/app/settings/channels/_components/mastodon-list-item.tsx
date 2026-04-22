"use client";

import { MastodonIcon } from "@/app/auth/_components/provider-icons";
import { Plus, ShieldCheck, Sparkle, Bell } from "lucide-react";
import { useState } from "react";
import { MastodonChannelItem } from "./mastodon-item";
import { DisconnectChannelButton } from "./disconnect-confirm";
import { RefreshChannelButton } from "./refresh-channel-button";
import type { ChannelProfileView } from "@/components/channel-identity";
import { ConnectedAccountCard } from "./connected-account-card";

type Props = {
	isConnected: boolean;
	isSoon: boolean;
	isApprovalNeeded?: boolean;
	atLimit?: boolean;
	profile?: ChannelProfileView | null;
};

export function MastodonListItem({ isConnected, isSoon, isApprovalNeeded, atLimit, profile }: Props) {
	const [showForm, setShowForm] = useState(false);
	if (isApprovalNeeded) {
		return (
			<li className="flex items-center gap-4 px-5 py-4">
				<span className="w-11 h-11 rounded-full border grid place-items-center shrink-0 bg-background border-border">
					<MastodonIcon className="w-[18px] h-[18px]" />
				</span>
				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-2 flex-wrap">
						<p className="text-[14.5px] text-ink font-medium">Mastodon</p>
						<span className="inline-flex items-center gap-1 h-5 px-2 rounded-full bg-peach-100 border border-peach-300 text-[10.5px] text-ink font-medium tracking-wide">
							<Sparkle className="w-3 h-3" />
							Muse
						</span>
					</div>
					<p className="mt-1 text-[12.5px] text-ink/60">
						Generate content for campaigns. Auto-publish coming after platform approval.
					</p>
				</div>
				<button
					type="button"
					className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full border border-peach-300 bg-peach-100 text-[13px] text-ink font-medium hover:bg-peach-200 transition-colors shrink-0"
				>
					<Bell className="w-3.5 h-3.5" />
					Notify me
				</button>
			</li>
		);
	}

	if (isSoon) {
		return (
			<li className="flex items-center gap-4 px-5 py-4">
				<span className="w-11 h-11 rounded-full border grid place-items-center shrink-0 bg-background border-border">
					<MastodonIcon className="w-[18px] h-[18px]" />
				</span>
				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-2 flex-wrap">
						<p className="text-[14.5px] text-ink font-medium">Mastodon</p>
						<span className="inline-flex items-center h-5 px-2 rounded-full border border-dashed border-border-strong text-[10.5px] text-ink/55 tracking-wide uppercase">
							Soon
						</span>
					</div>
					<p className="mt-1 text-[12.5px] text-ink/60">
						Federated posts to any instance.
					</p>
				</div>
				<button
					type="button"
					disabled
					className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full border border-dashed border-border-strong text-[13px] text-ink/45 shrink-0"
				>
					Not available yet
				</button>
			</li>
		);
	}

	return (
		<>
			<li className="flex flex-col px-5 py-4">
				<div className="flex items-start gap-4">
					<span
						className={`w-11 h-11 rounded-full border grid place-items-center shrink-0 ${
							isConnected
								? "bg-peach-100 border-peach-300"
								: "bg-background border-border"
						}`}
					>
						<MastodonIcon className="w-[18px] h-[18px]" />
					</span>
					<div className="flex-1 min-w-0">
						<div className="flex items-center gap-2 flex-wrap">
							<p className="text-[14.5px] text-ink font-medium">Mastodon</p>
							{isConnected ? (
								<span className="inline-flex items-center gap-1 h-5 px-2 rounded-full bg-ink text-background text-[10.5px] font-medium tracking-wide">
									<ShieldCheck className="w-3 h-3" />
									Connected
								</span>
							) : null}
							<span className="inline-flex items-center gap-1 h-5 px-2 rounded-full bg-peach-100 border border-peach-300 text-[10.5px] text-ink font-medium tracking-wide">
								<Sparkle className="w-3 h-3" />
								Muse
							</span>
						</div>
						<p className="mt-1 text-[12.5px] text-ink/60">
							{showForm
								? "Enter your Mastodon instance details"
								: "Federated posts to any instance."}
						</p>
						{isConnected && profile && (profile.handle || profile.displayName) ? (
					<div className="mt-3">
						<ConnectedAccountCard profile={{ ...profile, channel: "mastodon" }} channel="mastodon" />
					</div>
				) : null}
					</div>
					<div className="flex items-center gap-1.5 shrink-0">
						{showForm ? (
							<button
								type="button"
								onClick={() => setShowForm(false)}
								className="inline-flex items-center justify-center h-10 px-4 rounded-full bg-primary text-primary-foreground text-[13px] font-medium hover:bg-primary-deep transition-colors"
							>
								Close
							</button>
						) : !isConnected && atLimit ? (
							<button
								type="button"
								disabled
								className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full border border-border-strong text-[13px] text-ink/40 cursor-not-allowed"
							>
								<Plus className="w-3.5 h-3.5" />
								Connect
							</button>
						) : isConnected ? (
							<RefreshChannelButton provider="mastodon" channelName="Mastodon" />
						) : (
							<button
								type="button"
								onClick={() => setShowForm(true)}
								className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-ink text-background text-[13px] font-medium hover:bg-primary transition-colors"
							>
								<Plus className="w-3.5 h-3.5" />
								Connect
							</button>
						)}
					{isConnected ? <DisconnectChannelButton provider="mastodon" /> : null}
					</div>
				</div>
				{showForm && (
					<div className="pl-15 py-4 bg-background-elev/50">
						<MastodonChannelItem
							isConnected={isConnected}
							isSoon={isSoon}
							isFormOpen={true}
							onClose={() => setShowForm(false)}
						/>
					</div>
				)}
			</li>
		</>
	);
}
