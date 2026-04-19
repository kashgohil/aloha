import Link from "next/link";
import { BarChart3 } from "lucide-react";
import {
	BlueskyIcon,
	FacebookIcon,
	InstagramIcon,
	LinkedInIcon,
	MediumIcon,
	TikTokIcon,
	XIcon,
} from "@/app/auth/_components/provider-icons";

const PROVIDER_LABELS: Record<string, string> = {
	twitter: "X",
	linkedin: "LinkedIn",
	facebook: "Facebook",
	instagram: "Instagram",
	tiktok: "TikTok",
	bluesky: "Bluesky",
	medium: "Medium",
};

const PROVIDER_ICONS: Record<
	string,
	React.ComponentType<{ className?: string }>
> = {
	twitter: XIcon,
	linkedin: LinkedInIcon,
	facebook: FacebookIcon,
	instagram: InstagramIcon,
	tiktok: TikTokIcon,
	bluesky: BlueskyIcon,
	medium: MediumIcon,
};

function formatCompact(n: number): string {
	if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
	if (n >= 10_000) return `${(n / 1_000).toFixed(0)}K`;
	if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
	return n.toLocaleString();
}

interface ReachCardProps {
	totalImpressions: number;
	perPlatform: Array<{
		platform: string;
		impressions: number;
		posts: number;
		gated: boolean;
	}>;
	gatedConnectedCount: number;
}

export function ReachCard({
	totalImpressions,
	perPlatform,
	gatedConnectedCount,
}: ReachCardProps) {
	const hasAnyData =
		totalImpressions > 0 || perPlatform.some((p) => p.posts > 0);
	return (
		<article className="rounded-2xl border border-border bg-background-elev p-6">
			<div className="flex items-start justify-between gap-4">
				<div>
					<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
						Reach · last 7 days
					</p>
					<p className="mt-3 font-display text-[32px] leading-none tracking-[-0.02em] text-ink">
						{hasAnyData ? formatCompact(totalImpressions) : "—"}
					</p>
					<p className="mt-1 text-[12px] text-ink/55">
						{hasAnyData ? "impressions" : "syncing nightly"}
					</p>
				</div>
				<span className="w-10 h-10 rounded-full bg-peach-100 border border-border grid place-items-center shrink-0">
					<BarChart3 className="w-4 h-4 text-ink" />
				</span>
			</div>

			{perPlatform.length > 0 ? (
				<ul className="mt-5 space-y-2">
					{perPlatform.map((p) => (
						<li
							key={p.platform}
							className="flex items-center justify-between text-[12.5px]"
						>
							<span className="inline-flex items-center gap-2 text-ink/75">
								{PROVIDER_ICONS[p.platform]
									? (() => {
											const Icon = PROVIDER_ICONS[p.platform];
											return <Icon className="w-3.5 h-3.5" />;
										})()
									: null}
								{PROVIDER_LABELS[p.platform] ?? p.platform}
							</span>
							<span className="text-ink/55">
								{p.gated
									? "awaiting approval"
									: p.posts === 0
										? "no posts yet"
										: `${formatCompact(p.impressions)} · ${p.posts} post${p.posts === 1 ? "" : "s"}`}
							</span>
						</li>
					))}
				</ul>
			) : null}

			{gatedConnectedCount > 0 ? (
				<p className="mt-5 text-[11.5px] text-ink/50 leading-[1.55]">
					{gatedConnectedCount} channel{gatedConnectedCount === 1 ? "" : "s"}{" "}
					waiting on platform approval. We&apos;ll backfill once it lands.
				</p>
			) : null}
		</article>
	);
}
