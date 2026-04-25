"use client";

import {
	FileText,
	Gauge,
	GitBranch,
	ImagePlus,
	Images,
	Layers,
	Loader2,
	Sparkles,
	Wand2,
	X as XIcon,
} from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { generateImageAction, generateRichDraft } from "@/app/actions/ai";
import { DraftMetaPanel } from "@/app/app/composer/_components/draft-meta-panel";
import { ImportPanel } from "@/app/app/composer/_components/import-panel";
import { LibraryPanel } from "@/app/app/composer/_components/library-panel";
import { ScorePanel } from "@/app/app/composer/_components/score-panel";
import { channelLabel } from "@/components/channel-chip";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import type { DraftMeta, PostMedia } from "@/db/schema";
import { cn } from "@/lib/utils";

type DrawerKey =
	| "muse"
	| "scaffolding"
	| "variants"
	| "fanout"
	| "score"
	| "import"
	| "image"
	| "library"
	| null;

type ImageAspect = "1:1" | "4:5" | "16:9" | "9:16";

export function StudioAssistFooter({
	channel,
	museAccess,
	text,
	media,
	maxMedia,
	onTextChange,
	onMediaChange,
	disabled,
}: {
	channel: string;
	museAccess: boolean;
	text: string;
	media: PostMedia[];
	maxMedia: number;
	onTextChange: (text: string) => void;
	onMediaChange: (media: PostMedia[]) => void;
	disabled?: boolean;
}) {
	const [active, setActive] = useState<DrawerKey>(null);
	const [topic, setTopic] = useState("");
	const [isGenerating, startGenerating] = useTransition();
	const [draftMeta, setDraftMeta] = useState<DraftMeta | null>(null);
	const [imagePrompt, setImagePrompt] = useState("");
	const [imageAspect, setImageAspect] = useState<ImageAspect>("1:1");
	const [isImaging, startImaging] = useTransition();

	const close = () => setActive(null);
	const toggle = (k: NonNullable<DrawerKey>) =>
		setActive((cur) => (cur === k ? null : k));

	const channelName = channelLabel(channel);

	const runMuse = () => {
		if (!topic.trim()) return;
		const toastId = toast.loading("Drafting with Muse…");
		startGenerating(async () => {
			try {
				const rich = await generateRichDraft(topic, channel);
				onTextChange(rich.body);
				setDraftMeta({
					hook: rich.hook,
					altHooks: rich.altHooks,
					keyPoints: rich.keyPoints,
					cta: rich.cta,
					hashtags: rich.hashtags,
					mediaSuggestion: rich.mediaSuggestion,
					rationale: rich.rationale,
					formatGuidance: rich.formatGuidance,
				});
				setTopic("");
				setActive("scaffolding");
				toast.success("Draft ready.", { id: toastId });
			} catch (err) {
				toast.error(
					err instanceof Error
						? err.message
						: "Generate failed. Try again in a moment.",
					{ id: toastId },
				);
			}
		});
	};

	const handleSwapHook = (hook: string) => {
		const lines = text.split("\n");
		if (lines.length === 0 || lines[0] === "") {
			onTextChange(hook + (text ? `\n${text}` : ""));
		} else if (lines[0] !== hook) {
			lines[0] = hook;
			onTextChange(lines.join("\n"));
		}
		setDraftMeta((m) => (m ? { ...m, hook } : m));
	};

	const handleApplyHashtags = (tags: string[]) => {
		if (tags.length === 0) return;
		const existing = new Set(
			(text.match(/#[\w-]+/g) ?? []).map((t) => t.toLowerCase()),
		);
		const additions = tags.filter((t) => !existing.has(t.toLowerCase()));
		if (additions.length === 0) return;
		const sep = text.endsWith("\n\n")
			? ""
			: text.endsWith("\n")
				? "\n"
				: text
					? "\n\n"
					: "";
		onTextChange(text + sep + additions.join(" "));
	};

	const runImage = () => {
		if (!imagePrompt.trim() || media.length >= maxMedia) return;
		startImaging(async () => {
			try {
				const img = await generateImageAction(imagePrompt, imageAspect);
				onMediaChange([
					...media,
					{
						url: img.url,
						mimeType: img.mimeType,
						width: img.width,
						height: img.height,
						alt: img.alt ?? undefined,
					},
				]);
				setImagePrompt("");
				close();
			} catch (err) {
				toast.error(
					err instanceof Error
						? err.message
						: "Image generation failed. Try again in a moment.",
				);
			}
		});
	};

	const remainingSlots = Math.max(0, maxMedia - media.length);
	const canScore = text.trim().length >= 20;

	if (!museAccess) {
		return (
			<div className="border-t border-border bg-peach-100/30">
				<div className="max-w-[1320px] mx-auto px-6 lg:px-10 py-3 flex items-center justify-between gap-4">
					<div className="flex items-center gap-3 min-w-0">
						<span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-peach-100 border border-peach-300 text-primary shrink-0">
							<Sparkles className="w-4 h-4" />
						</span>
						<p className="text-[12.5px] text-ink/70 truncate">
							Unlock Muse — draft, score, and import from a URL.
						</p>
					</div>
					<Link
						href="/app/settings/muse"
						className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-ink text-background text-[12.5px] font-medium hover:bg-primary transition-colors shrink-0"
					>
						<Wand2 className="w-3.5 h-3.5" />
						Enable Muse
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className="border-t border-primary/20 bg-primary-soft/60 backdrop-blur-sm">
			{active ? (
				<div className="border-b border-primary/15 bg-primary-soft/80">
					<div className="max-w-[1320px] mx-auto px-6 lg:px-10 py-4">
						{active === "muse" ? (
							<div className="space-y-3">
								<div className="flex items-center gap-2 text-[12px] text-ink/65">
									<Wand2 className="w-3.5 h-3.5 text-primary" />
									<span>
										Muse drafts the post for {channelName} from a topic or
										brief.
									</span>
								</div>
								<div className="flex items-center gap-2 flex-wrap">
									<input
										value={topic}
										onChange={(e) => setTopic(e.target.value)}
										onKeyDown={(e) => {
											if (e.key === "Enter" && !isGenerating) {
												e.preventDefault();
												runMuse();
											}
											if (e.key === "Escape") {
												close();
												setTopic("");
											}
										}}
										placeholder="e.g. how we cut onboarding time in half"
										autoFocus
										className="flex-1 min-w-[240px] h-10 px-3 rounded-full border border-border bg-background-elev text-[13.5px] text-ink placeholder:text-ink/40 focus:outline-none focus:border-ink"
									/>
									<button
										type="button"
										onClick={runMuse}
										disabled={isGenerating || !topic.trim()}
										className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-ink text-background text-[13px] font-medium hover:bg-primary disabled:opacity-40 disabled:hover:bg-ink transition-colors"
									>
										{isGenerating ? (
											<Loader2 className="w-3.5 h-3.5 animate-spin" />
										) : (
											<Wand2 className="w-3.5 h-3.5" />
										)}
										Write draft
									</button>
								</div>
							</div>
						) : null}

						{active === "scaffolding" && draftMeta ? (
							<DraftMetaPanel
								meta={draftMeta}
								onSwapHook={handleSwapHook}
								onApplyHashtags={handleApplyHashtags}
								onClose={close}
							/>
						) : null}

						{active === "score" ? (
							<ScorePanel
								platformId={channel}
								platformName={channelName}
								content={text}
								onImprove={(t) => onTextChange(t)}
								onClose={close}
							/>
						) : null}

						{active === "import" ? (
							<ImportPanel
								targets={[{ id: channel, name: channelName }]}
								onAccept={(_pid, t) => onTextChange(t)}
								onClose={close}
							/>
						) : null}

						{active === "image" ? (
							<div className="space-y-3">
								<div className="flex items-center gap-2 text-[12px] text-ink/65">
									<ImagePlus className="w-3.5 h-3.5 text-primary" />
									<span>
										Describe the image you want — Muse generates it in your
										chosen aspect.
									</span>
								</div>
								<input
									value={imagePrompt}
									onChange={(e) => setImagePrompt(e.target.value)}
									onKeyDown={(e) => {
										if (e.key === "Enter" && !isImaging) {
											e.preventDefault();
											runImage();
										}
										if (e.key === "Escape") {
											close();
											setImagePrompt("");
										}
									}}
									placeholder="e.g. a warm editorial shot of a reading nook, soft morning light"
									autoFocus
									className="w-full h-10 px-3 rounded-full border border-border bg-background-elev text-[13.5px] text-ink placeholder:text-ink/40 focus:outline-none focus:border-ink"
								/>
								<div className="flex items-center justify-between gap-2 flex-wrap">
									<div className="flex items-center gap-1.5">
										{(["1:1", "4:5", "16:9", "9:16"] as const).map((a) => {
											const isActive = imageAspect === a;
											return (
												<button
													key={a}
													type="button"
													onClick={() => setImageAspect(a)}
													aria-pressed={isActive}
													className={cn(
														"inline-flex items-center h-8 px-3 rounded-full text-[12px] font-medium transition-colors",
														isActive
															? "bg-ink text-background"
															: "bg-background-elev text-ink/65 border border-border hover:text-ink",
													)}
												>
													{a}
												</button>
											);
										})}
									</div>
									<div className="flex items-center gap-2">
										<button
											type="button"
											onClick={close}
											disabled={isImaging}
											className="inline-flex items-center h-10 px-4 rounded-full text-[13px] text-ink/65 hover:text-ink transition-colors"
										>
											Cancel
										</button>
										<button
											type="button"
											onClick={runImage}
											disabled={
												isImaging ||
												!imagePrompt.trim() ||
												media.length >= maxMedia
											}
											className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-ink text-background text-[13px] font-medium hover:bg-primary disabled:opacity-40 disabled:hover:bg-ink transition-colors"
										>
											{isImaging ? (
												<Loader2 className="w-3.5 h-3.5 animate-spin" />
											) : (
												<ImagePlus className="w-3.5 h-3.5" />
											)}
											Generate
										</button>
									</div>
								</div>
							</div>
						) : null}

						{active === "library" ? (
							<LibraryPanel
								attachedUrls={media.map((m) => m.url)}
								remainingSlots={remainingSlots}
								onAttach={(picked) => onMediaChange([...media, ...picked])}
								onClose={close}
							/>
						) : null}
					</div>
				</div>
			) : null}

			<TooltipProvider delay={250}>
				<div className="max-w-[1320px] mx-auto px-6 lg:px-10 flex items-center gap-1 py-2 overflow-x-auto">
					<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 px-2 shrink-0">
						Assist
					</p>
					<span aria-hidden className="w-px h-5 bg-border mx-1 shrink-0" />
					<DrawerTab
						active={active === "muse"}
						onClick={() => toggle("muse")}
						icon={<Wand2 className="w-3.5 h-3.5" />}
						label={`Draft a ${channelName} post from a topic`}
						disabled={disabled}
					>
						Muse
					</DrawerTab>
					{draftMeta ? (
						<DrawerTab
							active={active === "scaffolding"}
							onClick={() => toggle("scaffolding")}
							icon={<Sparkles className="w-3.5 h-3.5" />}
							label="Muse scaffolding — hooks, beats, CTA, hashtags"
							disabled={disabled}
						>
							Scaffolding
						</DrawerTab>
					) : null}
					<DrawerTab
						active={false}
						onClick={() => {}}
						disabled
						icon={<Layers className="w-3.5 h-3.5" />}
						label="Variants are for multi-channel composing — Studio is single-channel"
					>
						Variants
					</DrawerTab>
					<DrawerTab
						active={false}
						onClick={() => {}}
						disabled
						icon={<GitBranch className="w-3.5 h-3.5" />}
						label="Fan out is for multi-channel composing — Studio is single-channel"
					>
						Fan out
					</DrawerTab>
					<DrawerTab
						active={active === "score"}
						onClick={() => toggle("score")}
						disabled={disabled || !canScore}
						icon={<Gauge className="w-3.5 h-3.5" />}
						label={
							canScore
								? `Score this ${channelName} post`
								: "Write a bit more to score"
						}
					>
						Score
					</DrawerTab>
					<DrawerTab
						active={active === "import"}
						onClick={() => toggle("import")}
						disabled={disabled}
						icon={<FileText className="w-3.5 h-3.5" />}
						label="Import from a URL"
					>
						Import
					</DrawerTab>
					{maxMedia > 0 ? (
						<DrawerTab
							active={active === "image"}
							onClick={() => toggle("image")}
							disabled={disabled || remainingSlots === 0}
							icon={<ImagePlus className="w-3.5 h-3.5" />}
							label={
								remainingSlots === 0
									? `Up to ${maxMedia} attachments`
									: "Generate image"
							}
						>
							Image
						</DrawerTab>
					) : null}
					{maxMedia > 0 ? (
						<DrawerTab
							active={active === "library"}
							onClick={() => toggle("library")}
							disabled={disabled || remainingSlots === 0}
							icon={<Images className="w-3.5 h-3.5" />}
							label={
								remainingSlots === 0
									? `Up to ${maxMedia} attachments`
									: "Attach from library"
							}
						>
							Library
						</DrawerTab>
					) : null}
					{active ? (
						<button
							type="button"
							onClick={close}
							aria-label="Close panel"
							className="ml-auto inline-flex items-center justify-center w-8 h-8 rounded-full text-ink/60 hover:text-ink hover:bg-muted/60 transition-colors shrink-0"
						>
							<XIcon className="w-4 h-4" />
						</button>
					) : null}
				</div>
			</TooltipProvider>
		</div>
	);
}

function DrawerTab({
	icon,
	label,
	onClick,
	active,
	disabled,
	children,
}: {
	icon: React.ReactNode;
	label: string;
	onClick: () => void;
	active?: boolean;
	disabled?: boolean;
	children: React.ReactNode;
}) {
	const button = (
		<button
			type="button"
			onClick={onClick}
			disabled={disabled}
			aria-pressed={active}
			aria-label={label}
			className={cn(
				"inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-[12.5px] font-medium transition-colors shrink-0",
				active
					? "bg-ink text-background"
					: "text-ink/70 hover:text-ink hover:bg-muted/60",
				"disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-ink/70",
			)}
		>
			{icon}
			{children}
		</button>
	);
	return (
		<Tooltip>
			<TooltipTrigger render={button} />
			<TooltipContent>{label}</TooltipContent>
		</Tooltip>
	);
}
