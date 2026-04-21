"use client";

import { BlueskyIcon } from "@/app/auth/_components/provider-icons";
import { Plus, RefreshCw, ShieldCheck, Sparkle } from "lucide-react";
import { useState, useTransition } from "react";
import { refreshChannelProfileAction } from "../../actions";
import { BlueskyChannelItem } from "./bluesky-item";
import { DisconnectChannelButton } from "./disconnect-confirm";
import { ChannelIdentity, type ChannelProfileView } from "@/components/channel-identity";

type Props = {
	isConnected: boolean;
	needsReauth?: boolean;
	atLimit?: boolean;
	profile?: ChannelProfileView | null;
};

export function BlueskyListItem({ isConnected, needsReauth, atLimit, profile }: Props) {
	const [showForm, setShowForm] = useState(false);
	const [isRefreshing, startRefresh] = useTransition();
	const handleRefresh = () => {
		startRefresh(async () => {
			const fd = new FormData();
			fd.set("provider", "bluesky");
			await refreshChannelProfileAction(fd);
		});
	};

	return (
		<li className="flex flex-col px-5 py-4">
			<div className="flex items-center gap-4">
				<span
					className={`w-11 h-11 rounded-full border grid place-items-center shrink-0 text-ink ${
						needsReauth
							? "bg-primary-soft border-primary/40"
							: isConnected
								? "bg-peach-100 border-peach-300"
								: "bg-background border-border"
					}`}
				>
					<BlueskyIcon className="w-[18px] h-[18px]" />
				</span>
				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-2 flex-wrap">
						<p className="text-[14.5px] text-ink font-medium">Bluesky</p>
						{isConnected && !needsReauth ? (
							<span className="inline-flex items-center gap-1 h-5 px-2 rounded-full bg-ink text-background text-[10.5px] font-medium tracking-wide">
								<ShieldCheck className="w-3 h-3" />
								Connected
							</span>
						) : null}
						{needsReauth ? (
							<span className="inline-flex items-center gap-1 h-5 px-2 rounded-full bg-primary-soft text-primary-deep text-[10.5px] font-medium tracking-wide">
								Reconnect needed
							</span>
						) : null}
						<span className="inline-flex items-center gap-1 h-5 px-2 rounded-full bg-peach-100 border border-peach-300 text-[10.5px] text-ink font-medium tracking-wide">
							<Sparkle className="w-3 h-3" />
							Muse
						</span>
					</div>
					<p className="mt-1 text-[12.5px] text-ink/60">
						{showForm
							? "Enter your Bluesky handle and app password"
							: needsReauth
								? "Your token expired or was revoked. Reconnect to resume publishing."
								: "Posts, threads, and images."}
					</p>
					{isConnected && profile && (profile.handle || profile.displayName) ? (
						<div className="mt-2">
							{profile.profileUrl ? (
								<a
									href={profile.profileUrl}
									target="_blank"
									rel="noreferrer"
									className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-2 py-1 hover:bg-muted/40 transition-colors"
								>
									<ChannelIdentity profile={{ ...profile, channel: "bluesky" }} size="sm" />
								</a>
							) : (
								<ChannelIdentity profile={{ ...profile, channel: "bluesky" }} size="sm" />
							)}
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
					) : isConnected && !needsReauth ? (
						<button
							type="button"
							onClick={handleRefresh}
							disabled={isRefreshing}
							title="Refresh profile details"
							aria-label="Refresh Bluesky profile"
							className="inline-flex items-center justify-center h-10 w-10 rounded-full border border-border-strong text-ink/70 hover:text-ink hover:border-ink transition-colors disabled:opacity-50"
						>
							<RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
						</button>
					) : isConnected && needsReauth ? (
						<button
							type="button"
							onClick={() => setShowForm(true)}
							className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-primary text-primary-foreground text-[13px] font-medium hover:bg-primary-deep transition-colors"
						>
							Reconnect
						</button>
					) : !isConnected ? (
						<button
							type="button"
							onClick={() => setShowForm(true)}
							className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-ink text-background text-[13px] font-medium hover:bg-primary transition-colors"
						>
							<Plus className="w-3.5 h-3.5" />
							Connect
						</button>
					) : null}
					{isConnected ? <DisconnectChannelButton provider="bluesky" /> : null}
				</div>
			</div>
			{showForm && (
				<div className="pl-15 py-4 bg-background-elev/50">
					<BlueskyChannelItem isConnected={isConnected} />
				</div>
			)}
		</li>
	);
}
