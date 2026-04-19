import Link from "next/link";
import { Plug } from "lucide-react";
import { cn } from "@/lib/utils";
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

interface ChannelsCardProps {
	providers: string[];
}

export function ChannelsCard({ providers }: ChannelsCardProps) {
	const hasAny = providers.length > 0;
	return (
		<article className="rounded-2xl border border-border bg-background-elev p-6">
			<div className="flex items-start justify-between gap-4">
				<div>
					<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
						Channels
					</p>
					<p className="mt-1.5 font-display text-[20px] leading-[1.15] text-ink">
						{hasAny ? `${providers.length} connected` : "No channels yet"}
					</p>
				</div>
				<Link
					href="/app/settings/channels"
					className="pencil-link text-[12.5px] text-ink/70 hover:text-ink"
				>
					Manage
				</Link>
			</div>
			{hasAny ? (
				<ul className="mt-4 flex flex-wrap gap-1.5">
					{providers.map((p) => {
						const Icon = PROVIDER_ICONS[p];
						return (
							<li
								key={p}
								className={cn(
									"inline-flex items-center h-7 px-2.5 rounded-full bg-peach-100 border border-border",
									"text-[12px] text-ink/80 gap-1.5",
								)}
							>
								{Icon && <Icon className="w-3.5 h-3.5" />}
								{PROVIDER_LABELS[p] ?? p}
							</li>
						);
					})}
				</ul>
			) : (
				<p className="mt-3 text-[13px] text-ink/60 leading-normal">
					Connect your first channel from Settings to start scheduling posts.
				</p>
			)}
			<Link
				href="/app/settings/channels"
				className="mt-5 inline-flex items-center justify-center w-full h-10 rounded-full border border-border-strong text-[13px] text-ink hover:border-ink transition-colors"
			>
				<Plug className="w-3.5 h-3.5 mr-1.5" />
				{hasAny ? "Add another" : "Connect a channel"}
			</Link>
		</article>
	);
}
