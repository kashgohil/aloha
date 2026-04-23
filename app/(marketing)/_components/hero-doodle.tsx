import {
	AtSign,
	Bell,
	Bookmark,
	Calendar,
	Camera,
	Clock,
	Eye,
	Flame,
	Hash,
	Heart,
	MessageCircle,
	MessageSquare,
	Mic,
	Music,
	PenLine,
	Play,
	Quote,
	Repeat2,
	Send,
	Smile,
	Sparkle,
	Sparkles,
	Star,
	ThumbsUp,
	Type,
} from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import { SOCIAL_ICONS } from "./social-icons";

type LucideIcon = ComponentType<SVGProps<SVGSVGElement>>;

type Doodle =
	| {
			kind: "lucide";
			icon: LucideIcon;
			x: number;
			y: number;
			rot: number;
			size: number;
	  }
	| {
			kind: "social";
			idx: number;
			x: number;
			y: number;
			rot: number;
			size: number;
	  };

// Positions are in % of the container. Center column (x ~35–65%, y ~25–70%)
// is left mostly clear so the headline, subtitle, and signup have breathing room.
const DOODLES: Doodle[] = [
	// ── top band
	{ kind: "lucide", icon: Heart, x: 5, y: 8, rot: -12, size: 28 },
	{ kind: "social", idx: 1, x: 12, y: 18, rot: 6, size: 22 },
	{ kind: "lucide", icon: MessageCircle, x: 19, y: 6, rot: -5, size: 26 },
	{ kind: "lucide", icon: Hash, x: 28, y: 16, rot: 8, size: 22 },
	{ kind: "lucide", icon: Sparkle, x: 37, y: 5, rot: -6, size: 18 },
	{ kind: "lucide", icon: Star, x: 48, y: 11, rot: 10, size: 22 },
	{ kind: "lucide", icon: ThumbsUp, x: 57, y: 4, rot: -4, size: 24 },
	{ kind: "lucide", icon: AtSign, x: 66, y: 14, rot: 7, size: 22 },
	{ kind: "social", idx: 0, x: 75, y: 6, rot: -8, size: 22 },
	{ kind: "lucide", icon: Bell, x: 83, y: 16, rot: 5, size: 22 },
	{ kind: "lucide", icon: Sparkles, x: 91, y: 7, rot: -9, size: 22 },
	{ kind: "lucide", icon: Quote, x: 96, y: 20, rot: 4, size: 22 },

	// ── upper-middle side columns
	{ kind: "lucide", icon: Bookmark, x: 3, y: 30, rot: 6, size: 24 },
	{ kind: "social", idx: 2, x: 9, y: 42, rot: -7, size: 22 },
	{ kind: "lucide", icon: Eye, x: 92, y: 32, rot: 5, size: 22 },
	{ kind: "lucide", icon: Clock, x: 97, y: 44, rot: -6, size: 22 },

	// ── middle sides (lighter — avoid the form in the center)
	{ kind: "lucide", icon: Send, x: 4, y: 55, rot: -8, size: 22 },
	{ kind: "lucide", icon: Camera, x: 11, y: 66, rot: 5, size: 22 },
	{ kind: "lucide", icon: Repeat2, x: 90, y: 56, rot: 7, size: 24 },
	{ kind: "lucide", icon: Mic, x: 95, y: 67, rot: -5, size: 22 },

	// ── lower-middle
	{ kind: "lucide", icon: Play, x: 6, y: 78, rot: 4, size: 22 },
	{ kind: "social", idx: 5, x: 14, y: 88, rot: -6, size: 22 },
	{ kind: "social", idx: 3, x: 88, y: 78, rot: 8, size: 24 },
	{ kind: "lucide", icon: PenLine, x: 95, y: 88, rot: -7, size: 22 },

	// ── bottom band
	{ kind: "lucide", icon: MessageSquare, x: 22, y: 94, rot: 5, size: 22 },
	{ kind: "lucide", icon: Heart, x: 31, y: 86, rot: -3, size: 20 },
	{ kind: "lucide", icon: Music, x: 40, y: 95, rot: 7, size: 22 },
	{ kind: "social", idx: 4, x: 50, y: 88, rot: -5, size: 22 },
	{ kind: "lucide", icon: Calendar, x: 59, y: 96, rot: 4, size: 22 },
	{ kind: "lucide", icon: Flame, x: 68, y: 86, rot: -8, size: 22 },
	{ kind: "social", idx: 7, x: 77, y: 94, rot: 6, size: 22 },
	{ kind: "lucide", icon: Smile, x: 84, y: 86, rot: -4, size: 22 },
	{ kind: "lucide", icon: Type, x: 45, y: 22, rot: -10, size: 20 },
];

export function HeroDoodle() {
	return (
		<div
			aria-hidden
			className="pointer-events-none absolute inset-0 overflow-hidden text-ink/20"
		>
			{DOODLES.map((d, i) => {
				const common = {
					className: "absolute",
					style: {
						left: `${d.x}%`,
						top: `${d.y}%`,
						transform: `translate(-50%, -50%) rotate(${d.rot}deg)`,
					} as const,
				};
				if (d.kind === "lucide") {
					const Icon = d.icon;
					return (
						<Icon
							key={i}
							{...common}
							width={d.size}
							height={d.size}
							strokeWidth={1.6}
						/>
					);
				}
				const social = SOCIAL_ICONS[d.idx];
				if (!social) return null;
				return (
					<svg
						key={i}
						{...common}
						width={d.size}
						height={d.size}
						viewBox="0 0 24 24"
						fill={social.custom ? undefined : "currentColor"}
						aria-hidden
					>
						{social.custom ?? <path d={social.path} />}
					</svg>
				);
			})}
		</div>
	);
}
