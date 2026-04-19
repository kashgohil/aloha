"use client";

import {
	generateAltText,
	generateDraft,
	generateImageAction,
	refineContent,
	suggestHashtags,
} from "@/app/actions/ai";
import { saveDraft, schedulePost, updatePost } from "@/app/actions/posts";
import {
	BlueskyIcon,
	FacebookIcon,
	InstagramIcon,
	LinkedInIcon,
	MediumIcon,
	RedditIcon,
	ThreadsIcon,
	TikTokIcon,
	XIcon as XBrandIcon,
} from "@/app/auth/_components/provider-icons";
import { Calendar } from "@/components/ui/calendar";
import { TimePicker } from "@/components/ui/time-picker";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ChannelOverride, PostMedia } from "@/db/schema";
import type { BestWindow } from "@/lib/best-time-format";
import { formatWindow } from "@/lib/best-time-format";
import type { EffectiveState } from "@/lib/channel-state-format";
import { stateOr, stateStyles } from "@/lib/channel-state-format";
import { cn } from "@/lib/utils";
import {
	AlertCircle,
	CalendarClock,
	Clock,
	FileText,
	Gauge,
	GitBranch,
	Hash,
	ImagePlus,
	ImageUp,
	Images,
	Layers,
	Loader2,
	Paperclip,
	Plug,
	RotateCcw,
	Send,
	Sparkles,
	Type,
	Wand2,
	X as XIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { FanoutPanel } from "./fanout-panel";
import { ImportPanel } from "./import-panel";
import { LibraryPanel } from "./library-panel";
import { PreviewCard } from "./preview-card";
import { ScorePanel } from "./score-panel";
import { VariantsPanel, type VariantPlatform } from "./variants-panel";

const PLATFORM_ICONS: Record<
	string,
	React.ComponentType<{ className?: string }>
> = {
	twitter: XBrandIcon,
	linkedin: LinkedInIcon,
	instagram: InstagramIcon,
	facebook: FacebookIcon,
	tiktok: TikTokIcon,
	threads: ThreadsIcon,
	bluesky: BlueskyIcon,
	medium: MediumIcon,
	reddit: RedditIcon,
};

const MAX_MEDIA = 4;

type Author = {
	name: string;
	email: string;
	image: string | null;
	workspaceName: string | null;
	timezone: string;
};

export type Platform = {
	id: string;
	name: string;
	handle: string;
	limit: number;
	accent: string;
};

const PLATFORMS: Platform[] = [
	{
		id: "twitter",
		name: "X",
		handle: "@handle",
		limit: 280,
		accent: "bg-ink text-background",
	},
	{
		id: "linkedin",
		name: "LinkedIn",
		handle: "in/handle",
		limit: 3000,
		accent: "bg-[#0a66c2] text-white",
	},
	{
		id: "instagram",
		name: "Instagram",
		handle: "@handle",
		limit: 2200,
		accent:
			"bg-gradient-to-tr from-[#f58529] via-[#dd2a7b] to-[#8134af] text-white",
	},
	{
		id: "facebook",
		name: "Facebook",
		handle: "/handle",
		limit: 5000,
		accent: "bg-[#1877f2] text-white",
	},
	{
		id: "tiktok",
		name: "TikTok",
		handle: "@handle",
		limit: 2200,
		accent: "bg-ink text-background",
	},
	{
		id: "threads",
		name: "Threads",
		handle: "@handle",
		limit: 500,
		accent: "bg-ink text-background",
	},
	{
		id: "bluesky",
		name: "Bluesky",
		handle: "@handle",
		limit: 300,
		accent: "bg-[#0085ff] text-white",
	},
	{
		id: "medium",
		name: "Medium",
		handle: "@username",
		limit: 100000,
		accent: "bg-ink text-background",
	},
	{
		id: "reddit",
		name: "Reddit",
		handle: "u/username",
		limit: 40000,
		accent: "bg-[#ff4500] text-white",
	},
];

type TabId = "all" | string;

export function Composer({
	author,
	connectedProviders,
	bestWindows,
	channelStates,
	initialContent = "",
	initialMedia = [],
	initialPlatforms = [],
	initialOverrides = {},
	initialScheduledAt = null,
	initialStatus = null,
	editingPostId = null,
	sourceIdeaId = null,
	sourceIdeaTitle = null,
}: {
	author: Author;
	connectedProviders: string[];
	bestWindows: Record<string, BestWindow[]>;
	channelStates: Record<string, EffectiveState>;
	initialContent?: string;
	initialMedia?: PostMedia[];
	initialPlatforms?: string[];
	initialOverrides?: Record<string, ChannelOverride>;
	initialScheduledAt?: string | null;
	initialStatus?: "draft" | "scheduled" | "published" | "failed" | null;
	editingPostId?: string | null;
	sourceIdeaId?: string | null;
	sourceIdeaTitle?: string | null;
}) {
	const router = useRouter();
	const [baseContent, setBaseContent] = useState(initialContent);
	const isEditing = editingPostId !== null;
	const isReadOnly = initialStatus === "published";
	// datetime-local inputs want "YYYY-MM-DDTHH:mm" — slice the ISO and drop
	// the timezone so the browser treats it as local time.
	const defaultSchedule = initialScheduledAt
		? initialScheduledAt.slice(0, 16)
		: "";
	const [baseMedia, setBaseMedia] = useState<PostMedia[]>(initialMedia);
	const [overrides, setOverrides] =
		useState<Record<string, ChannelOverride>>(initialOverrides);
	const [selected, setSelected] = useState<string[]>(() => {
		if (initialPlatforms.length > 0) return initialPlatforms;
		return connectedProviders.length > 0
			? [connectedProviders[0]]
			: ["twitter"];
	});
	const [activeTab, setActiveTab] = useState<TabId>("all");
	const [scheduledAt, setScheduledAt] = useState(defaultSchedule);
	const [showSchedule, setShowSchedule] = useState(false);
	const [isUploading, setIsUploading] = useState(false);
	const [isRefining, startRefining] = useTransition();
	const [isGenerating, startGenerating] = useTransition();
	const [isSaving, startSaving] = useTransition();
	const [isPublishing, startPublishing] = useTransition();
	const [formError, setFormError] = useState<string | null>(null);

	// Cap-exceeded server errors carry a specific message; preserve it so the
	// user sees the real reason instead of a generic "failed" toast.
	const messageFromErr = (err: unknown, fallback: string): string => {
		if (
			err instanceof Error &&
			err.message.startsWith("AI usage cap reached")
		) {
			return err.message;
		}
		return fallback;
	};
	const [showGenerate, setShowGenerate] = useState(false);
	const [generateTopic, setGenerateTopic] = useState("");
	const [showVariants, setShowVariants] = useState(false);
	const [showFanout, setShowFanout] = useState(false);
	const [showImport, setShowImport] = useState(false);
	const [showScore, setShowScore] = useState(false);
	const [showLibrary, setShowLibrary] = useState(false);
	const [isHashing, startHashing] = useTransition();
	const [hashSuggestions, setHashSuggestions] = useState<string[]>([]);
	const [altTextLoading, setAltTextLoading] = useState<string | null>(null);
	const [showImageGen, setShowImageGen] = useState(false);
	const [imagePrompt, setImagePrompt] = useState("");
	const [imageAspect, setImageAspect] = useState<
		"1:1" | "4:5" | "16:9" | "9:16"
	>("1:1");
	const [isImaging, startImaging] = useTransition();
	const fileInputRef = useRef<HTMLInputElement>(null);

	// If the active tab's platform gets deselected, fall back to "all".
	useEffect(() => {
		if (activeTab !== "all" && !selected.includes(activeTab)) {
			setActiveTab("all");
		}
	}, [activeTab, selected]);

	const selectedPlatforms = PLATFORMS.filter((p) => selected.includes(p.id));
	const activePlatform =
		activeTab === "all"
			? null
			: (PLATFORMS.find((p) => p.id === activeTab) ?? null);

	const effectiveContent = (platformId: string): string =>
		overrides[platformId]?.content ?? baseContent;

	const isOverridden = (platformId: string): boolean =>
		typeof overrides[platformId]?.content === "string";

	const editorValue =
		activeTab === "all" ? baseContent : effectiveContent(activeTab);

	const activeLimit = activePlatform
		? activePlatform.limit
		: selectedPlatforms.length > 0
			? Math.min(...selectedPlatforms.map((p) => p.limit))
			: Number.POSITIVE_INFINITY;

	// Validate every selected channel's effective content — a too-long override
	// on a background tab still blocks publish.
	const perPlatformOverflow = selectedPlatforms
		.map((p) => ({
			platform: p,
			over: effectiveContent(p.id).length > p.limit,
		}))
		.filter((x) => x.over);

	const overLimit = perPlatformOverflow.length > 0;
	const hasBody =
		baseContent.trim().length > 0 ||
		baseMedia.length > 0 ||
		selectedPlatforms.some(
			(p) => (overrides[p.id]?.content ?? "").trim().length > 0,
		);
	const canSubmit =
		hasBody && selected.length > 0 && !overLimit && !isUploading;

	const handleEditorChange = (value: string) => {
		if (activeTab === "all") {
			setBaseContent(value);
		} else {
			setOverrides((prev) => ({
				...prev,
				[activeTab]: { ...prev[activeTab], content: value },
			}));
		}
	};

	const handleResetOverride = (platformId: string) => {
		setOverrides((prev) => {
			const next = { ...prev };
			const entry = { ...next[platformId] };
			delete entry.content;
			if (entry.media === undefined) {
				delete next[platformId];
			} else {
				next[platformId] = entry;
			}
			return next;
		});
	};

	const handleFilesSelected = async (files: FileList | null) => {
		if (!files || files.length === 0) return;
		const remaining = MAX_MEDIA - baseMedia.length;
		const toUpload = Array.from(files).slice(0, remaining);
		if (toUpload.length === 0) return;
		setFormError(null);
		setIsUploading(true);
		try {
			const uploaded: PostMedia[] = [];
			for (const file of toUpload) {
				const fd = new FormData();
				fd.append("file", file);
				const res = await fetch("/api/upload", { method: "POST", body: fd });
				if (!res.ok) {
					const body = (await res.json().catch(() => null)) as {
						error?: string;
					} | null;
					throw new Error(body?.error ?? `Upload failed (${res.status})`);
				}
				const json = (await res.json()) as { url: string; mimeType: string };
				uploaded.push({ url: json.url, mimeType: json.mimeType });
			}
			setBaseMedia((prev) => [...prev, ...uploaded]);
		} catch (err) {
			setFormError(err instanceof Error ? err.message : "Upload failed.");
		} finally {
			setIsUploading(false);
			if (fileInputRef.current) fileInputRef.current.value = "";
		}
	};

	const removeMedia = (url: string) =>
		setBaseMedia((prev) => prev.filter((m) => m.url !== url));

	const handleAttachFromLibrary = (picked: PostMedia[]) => {
		setBaseMedia((prev) => {
			const have = new Set(prev.map((m) => m.url));
			const next = [...prev];
			for (const m of picked) {
				if (next.length >= MAX_MEDIA) break;
				if (have.has(m.url)) continue;
				next.push(m);
			}
			return next;
		});
		setShowLibrary(false);
	};

	const toggle = (id: string) =>
		setSelected((prev) =>
			prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
		);

	const handleRefine = () => {
		if (!editorValue.trim()) return;
		setFormError(null);
		startRefining(async () => {
			try {
				const context = activePlatform?.id ?? selected[0] ?? "general";
				const refined = await refineContent(editorValue, context);
				handleEditorChange(refined);
			} catch (err) {
				setFormError(
					messageFromErr(err, "Refine failed. Try again in a moment."),
				);
			}
		});
	};

	const handleSuggestHashtags = () => {
		if (!editorValue.trim()) return;
		setFormError(null);
		startHashing(async () => {
			try {
				const context = activePlatform?.id ?? selected[0] ?? "general";
				const tags = await suggestHashtags(editorValue, context);
				setHashSuggestions(tags);
				if (tags.length === 0) {
					toast.message("No hashtag suggestions for this post.");
				}
			} catch (err) {
				const msg = messageFromErr(
					err,
					"Hashtag suggest failed. Try again in a moment.",
				);
				setFormError(msg);
				toast.error(msg);
			}
		});
	};

	const appendHashtag = (tag: string) => {
		const current = editorValue;
		if (current.includes(tag)) {
			setHashSuggestions((prev) => prev.filter((t) => t !== tag));
			return;
		}
		const next =
			current.trimEnd().length === 0
				? tag
				: /\s$/.test(current)
					? `${current}${tag}`
					: `${current} ${tag}`;
		handleEditorChange(next);
		setHashSuggestions((prev) => prev.filter((t) => t !== tag));
	};

	const applyVariantToChannel = (platformId: string, text: string) => {
		setOverrides((prev) => ({
			...prev,
			[platformId]: { ...prev[platformId], content: text },
		}));
		setActiveTab(platformId);
	};

	const variantPlatforms: VariantPlatform[] = selectedPlatforms.map((p) => ({
		id: p.id,
		name: p.name,
		Icon: PLATFORM_ICONS[p.id],
	}));

	// Fan-out needs a source channel (active tab ≠ "all"), non-empty content
	// on that channel, and at least one other selected channel to target.
	const fanoutSourcePlatform =
		activeTab !== "all"
			? (PLATFORMS.find((p) => p.id === activeTab) ?? null)
			: null;
	const fanoutTargets: VariantPlatform[] = fanoutSourcePlatform
		? selectedPlatforms
				.filter((p) => p.id !== fanoutSourcePlatform.id)
				.map((p) => ({ id: p.id, name: p.name, Icon: PLATFORM_ICONS[p.id] }))
		: [];
	const canFanout =
		fanoutSourcePlatform !== null &&
		fanoutTargets.length > 0 &&
		effectiveContent(fanoutSourcePlatform.id).trim().length > 0;

	// Score runs against either the active channel tab or, when "all
	// channels" is active, the first selected platform — a single score only
	// makes sense per target, not across a fanout.
	const scorePlatform = activePlatform ?? selectedPlatforms[0] ?? null;
	const scoreContent = scorePlatform ? effectiveContent(scorePlatform.id) : "";
	const canScore = scorePlatform !== null && scoreContent.trim().length >= 20;

	const handleGenerateImage = () => {
		if (!imagePrompt.trim() || baseMedia.length >= MAX_MEDIA) return;
		setFormError(null);
		startImaging(async () => {
			try {
				const img = await generateImageAction(imagePrompt, imageAspect);
				setBaseMedia((prev) => [
					...prev,
					{
						url: img.url,
						mimeType: img.mimeType,
						width: img.width,
						height: img.height,
						alt: img.alt ?? undefined,
					},
				]);
				setImagePrompt("");
				setShowImageGen(false);
			} catch (err) {
				setFormError(
					messageFromErr(
						err,
						"Image generation failed. Try again in a moment.",
					),
				);
			}
		});
	};

	const handleGenerateAltText = async (m: PostMedia) => {
		setAltTextLoading(m.url);
		setFormError(null);
		try {
			const text = await generateAltText(m.url, baseContent);
			setBaseMedia((prev) =>
				prev.map((x) => (x.url === m.url ? { ...x, alt: text } : x)),
			);
		} catch (err) {
			setFormError(
				messageFromErr(err, "Alt text failed. Try again in a moment."),
			);
		} finally {
			setAltTextLoading(null);
		}
	};

	const handleGenerate = () => {
		if (!generateTopic.trim()) return;
		setFormError(null);
		startGenerating(async () => {
			try {
				const context = activePlatform?.id ?? selected[0] ?? "general";
				const draft = await generateDraft(generateTopic, context);
				handleEditorChange(draft);
				setGenerateTopic("");
				setShowGenerate(false);
			} catch (err) {
				setFormError(
					messageFromErr(err, "Generate failed. Try again in a moment."),
				);
			}
		});
	};

	const buildPayload = () => ({
		content: baseContent,
		platforms: selected,
		media: baseMedia,
		channelContent: overrides,
		sourceIdeaId,
	});

	const handleSaveDraft = () => {
		if (!canSubmit || isReadOnly) return;
		setFormError(null);
		startSaving(async () => {
			try {
				if (editingPostId) {
					// Editing an existing draft or scheduled post. Passing
					// scheduledAt=null flips scheduled → draft; omitting it for
					// a draft keeps it a draft.
					await updatePost(editingPostId, {
						...buildPayload(),
						scheduledAt: null,
					});
				} else {
					await saveDraft(buildPayload());
				}
				router.push("/app/dashboard");
			} catch {
				setFormError("Couldn't save. Please try again.");
			}
		});
	};

	const handleSchedule = () => {
		if (!canSubmit || !scheduledAt || isReadOnly) return;
		setFormError(null);
		startPublishing(async () => {
			try {
				const when = new Date(scheduledAt);
				if (editingPostId) {
					await updatePost(editingPostId, {
						...buildPayload(),
						scheduledAt: when,
					});
				} else {
					await schedulePost({
						...buildPayload(),
						scheduledAt: when,
					});
				}
				router.push("/app/dashboard");
			} catch {
				setFormError("Couldn't schedule. Check the time and try again.");
			}
		});
	};

	const handlePublishNow = () => {
		if (!canSubmit || isReadOnly) return;
		setFormError(null);
		startPublishing(async () => {
			try {
				const when = new Date();
				if (editingPostId) {
					await updatePost(editingPostId, {
						...buildPayload(),
						scheduledAt: when,
					});
				} else {
					await schedulePost({ ...buildPayload(), scheduledAt: when });
				}
				router.push("/app/dashboard");
			} catch {
				setFormError("Couldn't publish. Please try again.");
			}
		});
	};

	return (
		<div className="space-y-10">
			{/* Header */}
			<header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
				<div>
					<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
						{isEditing
							? `${headerEyebrowForStatus(initialStatus)} · ${author.workspaceName ?? "Workspace"}`
							: `New post · ${author.workspaceName ?? "Workspace"}`}
					</p>
					<h1 className="mt-3 font-display text-[44px] lg:text-[52px] leading-[1.02] tracking-[-0.03em] text-ink font-normal">
						{isEditing ? (
							<>
								Edit
								<span className="text-primary"> this one.</span>
							</>
						) : (
							<>
								Compose
								<span className="text-primary"> your next one.</span>
							</>
						)}
					</h1>
				</div>

				<div className="flex items-center gap-2 flex-wrap">
					<button
						type="button"
						onClick={handleSaveDraft}
						disabled={!canSubmit || isSaving || isReadOnly}
						className="inline-flex items-center gap-1.5 h-11 px-5 rounded-full border border-border-strong text-[14px] font-medium text-ink hover:border-ink disabled:opacity-40 disabled:hover:border-border-strong transition-colors"
					>
						{isSaving ? (
							<Loader2 className="w-4 h-4 animate-spin" />
						) : (
							<Paperclip className="w-4 h-4" />
						)}
						{isEditing ? "Save changes" : "Save draft"}
					</button>

					<SchedulePopover
						scheduledAt={scheduledAt}
						setScheduledAt={setScheduledAt}
						open={showSchedule}
						setOpen={setShowSchedule}
						onConfirm={handleSchedule}
						disabled={!canSubmit || isPublishing || isReadOnly}
						busy={isPublishing && scheduledAt !== ""}
						timezone={author.timezone}
					/>

					<button
						type="button"
						onClick={handlePublishNow}
						disabled={!canSubmit || isPublishing || isReadOnly}
						className="inline-flex items-center gap-1.5 h-11 px-5 rounded-full bg-ink text-background text-[14px] font-medium hover:bg-primary disabled:opacity-40 disabled:hover:bg-ink transition-colors"
					>
						{isPublishing && !scheduledAt ? (
							<Loader2 className="w-4 h-4 animate-spin" />
						) : (
							<Send className="w-4 h-4" />
						)}
						Publish
					</button>
				</div>
			</header>

			{isReadOnly ? (
				<div
					role="alert"
					className="flex items-start gap-3 rounded-2xl border border-border-strong bg-peach-100/60 px-4 py-3 text-[13.5px] text-ink"
				>
					<AlertCircle className="w-4 h-4 mt-[2px] text-primary shrink-0" />
					<span className="leading-normal">
						This post is already published. Edits won&apos;t reach the networks
						— open it on the platform to change it.
					</span>
				</div>
			) : null}

			{sourceIdeaTitle ? (
				<div className="inline-flex items-center gap-2 rounded-full border border-border bg-peach-100/60 px-3 py-1.5 text-[12px] text-ink/75 max-w-fit">
					<Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
					<span>
						From idea:{" "}
						<span className="font-medium text-ink">{sourceIdeaTitle}</span>
					</span>
				</div>
			) : null}

			{formError ? (
				<div
					role="alert"
					className="flex items-start gap-3 rounded-2xl border border-border-strong bg-peach-100/60 px-4 py-3 text-[13.5px] text-ink"
				>
					<AlertCircle className="w-4 h-4 mt-[2px] text-primary shrink-0" />
					<span className="leading-normal">{formError}</span>
				</div>
			) : null}

			{/* Channel chips */}
			<section>
				<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-3">
					Publish to
				</p>
				<div className="flex flex-wrap gap-1.5">
					{PLATFORMS.map((p) => {
						const isSelected = selected.includes(p.id);
						const Icon = PLATFORM_ICONS[p.id];
						return (
							<button
								key={p.id}
								type="button"
								onClick={() => toggle(p.id)}
								aria-pressed={isSelected}
								className={cn(
									"inline-flex items-center gap-1.5 h-8 px-2.5 rounded-full border text-[12px] font-medium transition-colors",
									isSelected
										? "bg-peach-100 text-ink border-border"
										: "bg-background-elev text-ink/70 border-border-strong hover:border-ink hover:text-ink",
								)}
							>
								{Icon && <Icon className="w-3.5 h-3.5" />}
								{p.name}
							</button>
						);
					})}
				</div>
				{connectedProviders.length === 0 ? (
					<p className="mt-3 inline-flex items-center gap-1.5 text-[12px] text-ink/55">
						<Plug className="w-3.5 h-3.5" />
						No channels connected yet. You can still draft and schedule —
						connect from Settings to go live.
					</p>
				) : null}
			</section>

			{/* Main grid */}
			<section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
				{/* Editor */}
				<div className="lg:col-span-7">
					{/* Tab strip */}
					<div
						role="tablist"
						aria-label="Content scope"
						className="flex flex-wrap items-center gap-1 mb-3"
					>
						<TabButton
							active={activeTab === "all"}
							onClick={() => setActiveTab("all")}
						>
							All channels
						</TabButton>
						{selectedPlatforms.map((p) => {
							const Icon = PLATFORM_ICONS[p.id];
							const over = effectiveContent(p.id).length > p.limit;
							const state = stateOr(channelStates, p.id);
							const style = stateStyles(state);
							return (
								<TabButton
									key={p.id}
									active={activeTab === p.id}
									onClick={() => setActiveTab(p.id)}
									dot={isOverridden(p.id)}
									warn={over}
								>
									{Icon && <Icon className="w-3.5 h-3.5" />}
									{p.name}
									{state !== "connected_published" ? (
										<span
											aria-label={style.label}
											title={style.tooltip}
											className={cn(
												"ml-1.5 inline-block w-1.5 h-1.5 rounded-full",
												style.dotClass,
											)}
										/>
									) : null}
								</TabButton>
							);
						})}
					</div>

					{activePlatform && bestWindows[activePlatform.id]?.length ? (
						<BestWindowHint
							platformName={activePlatform.name}
							window={bestWindows[activePlatform.id][0]}
						/>
					) : null}

					<div className="rounded-3xl border border-border bg-background-elev overflow-hidden">
						{showGenerate ? (
							<div className="flex flex-col gap-2 px-5 pt-4 pb-3 border-b border-border bg-peach-100/50">
								<div className="flex items-center gap-2 text-[12px] text-ink/65">
									<Wand2 className="w-3.5 h-3.5 text-primary" />
									<span>
										Generate a draft from a topic
										{activePlatform
											? ` for ${activePlatform.name}`
											: selected.length > 0
												? " — picks the first selected channel"
												: ""}
										.
									</span>
								</div>
								<div className="flex items-center gap-2">
									<input
										value={generateTopic}
										onChange={(e) => setGenerateTopic(e.target.value)}
										onKeyDown={(e) => {
											if (e.key === "Enter" && !isGenerating) {
												e.preventDefault();
												handleGenerate();
											}
											if (e.key === "Escape") {
												setShowGenerate(false);
												setGenerateTopic("");
											}
										}}
										placeholder="e.g. how we cut onboarding time in half"
										autoFocus
										className="flex-1 h-10 px-3 rounded-full border border-border bg-background text-[13.5px] text-ink placeholder:text-ink/40 focus:outline-none focus:border-ink"
									/>
									<button
										type="button"
										onClick={handleGenerate}
										disabled={isGenerating || !generateTopic.trim()}
										className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-ink text-background text-[13px] font-medium hover:bg-primary disabled:opacity-40 disabled:hover:bg-ink transition-colors"
									>
										{isGenerating ? (
											<Loader2 className="w-3.5 h-3.5 animate-spin" />
										) : (
											<Wand2 className="w-3.5 h-3.5" />
										)}
										Write draft
									</button>
									<button
										type="button"
										onClick={() => {
											setShowGenerate(false);
											setGenerateTopic("");
										}}
										disabled={isGenerating}
										aria-label="Close generate"
										className="inline-flex items-center justify-center w-10 h-10 rounded-full text-ink/60 hover:text-ink hover:bg-background transition-colors"
									>
										<XIcon className="w-4 h-4" />
									</button>
								</div>
							</div>
						) : null}

						{activePlatform ? (
							<div className="flex items-center justify-between gap-3 px-5 pt-4 text-[12px] text-ink/60">
								<span>
									{isOverridden(activePlatform.id)
										? `Customized for ${activePlatform.name}.`
										: `Inheriting from all channels. Edit to customize for ${activePlatform.name}.`}
								</span>
								{isOverridden(activePlatform.id) ? (
									<button
										type="button"
										onClick={() => handleResetOverride(activePlatform.id)}
										className="inline-flex items-center gap-1 text-[12px] text-ink/70 hover:text-ink transition-colors"
									>
										<RotateCcw className="w-3 h-3" />
										Reset to base
									</button>
								) : null}
							</div>
						) : null}

						<textarea
							value={editorValue}
							onChange={(e) => handleEditorChange(e.target.value)}
							placeholder={
								activePlatform
									? `Write a version tailored for ${activePlatform.name}…`
									: "Write something worth showing up for…"
							}
							className="w-full min-h-[340px] p-7 lg:p-8 bg-transparent focus:outline-none resize-none text-[17px] leading-[1.6] text-ink placeholder:text-ink/35 font-sans"
							aria-label="Post content"
						/>

						{baseMedia.length > 0 ? (
							<div className="px-5 pb-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
								{baseMedia.map((m) => {
									const loading = altTextLoading === m.url;
									return (
										<div
											key={m.url}
											className="group relative aspect-square rounded-xl overflow-hidden border border-border bg-background"
										>
											{/* eslint-disable-next-line @next/next/no-img-element */}
											<img
												src={m.url}
												alt={m.alt ?? ""}
												className="w-full h-full object-cover"
											/>
											<button
												type="button"
												onClick={() => removeMedia(m.url)}
												aria-label="Remove image"
												className="absolute top-1.5 right-1.5 w-6 h-6 inline-flex items-center justify-center rounded-full bg-ink/80 text-background hover:bg-ink transition-colors"
											>
												<XIcon className="w-3 h-3" />
											</button>
											<button
												type="button"
												onClick={() => handleGenerateAltText(m)}
												disabled={loading}
												title={m.alt ? `Alt: ${m.alt}` : "Generate alt text"}
												aria-label={
													m.alt ? "Regenerate alt text" : "Generate alt text"
												}
												className={cn(
													"absolute bottom-1.5 left-1.5 inline-flex items-center gap-1 h-6 px-2 rounded-full text-[10.5px] font-medium transition-colors",
													m.alt
														? "bg-ink/80 text-background"
														: "bg-background/90 text-ink border border-border hover:bg-background",
												)}
											>
												{loading ? (
													<Loader2 className="w-3 h-3 animate-spin" />
												) : (
													<Type className="w-3 h-3" />
												)}
												{m.alt ? "Alt set" : "Alt text"}
											</button>
										</div>
									);
								})}
							</div>
						) : null}

						{showImageGen ? (
							<div className="px-5 py-4 border-t border-border bg-peach-100/40 space-y-3">
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
											handleGenerateImage();
										}
										if (e.key === "Escape") {
											setShowImageGen(false);
											setImagePrompt("");
										}
									}}
									placeholder="e.g. a warm editorial shot of a reading nook, soft morning light"
									autoFocus
									className="w-full h-10 px-3 rounded-full border border-border bg-background text-[13.5px] text-ink placeholder:text-ink/40 focus:outline-none focus:border-ink"
								/>
								<div className="flex items-center justify-between gap-2 flex-wrap">
									<div className="flex items-center gap-1.5">
										{(["1:1", "4:5", "16:9", "9:16"] as const).map((a) => {
											const active = imageAspect === a;
											return (
												<button
													key={a}
													type="button"
													onClick={() => setImageAspect(a)}
													aria-pressed={active}
													className={cn(
														"inline-flex items-center h-8 px-3 rounded-full text-[12px] font-medium transition-colors",
														active
															? "bg-ink text-background"
															: "bg-background text-ink/65 border border-border hover:text-ink",
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
											onClick={() => {
												setShowImageGen(false);
												setImagePrompt("");
											}}
											disabled={isImaging}
											className="inline-flex items-center h-10 px-4 rounded-full text-[13px] text-ink/65 hover:text-ink transition-colors"
										>
											Cancel
										</button>
										<button
											type="button"
											onClick={handleGenerateImage}
											disabled={isImaging || !imagePrompt.trim()}
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

						{hashSuggestions.length > 0 ? (
							<div className="px-5 pt-3 pb-1 border-t border-border flex flex-wrap items-center gap-1.5">
								<span className="text-[11px] uppercase tracking-[0.18em] text-ink/45 mr-1">
									Suggested
								</span>
								{hashSuggestions.map((tag) => (
									<button
										key={tag}
										type="button"
										onClick={() => appendHashtag(tag)}
										className="inline-flex items-center h-7 px-2.5 rounded-full bg-peach-100 border border-peach-300 text-[12px] text-ink hover:bg-peach-200 transition-colors"
									>
										{tag}
									</button>
								))}
								<button
									type="button"
									onClick={() => setHashSuggestions([])}
									aria-label="Dismiss suggestions"
									className="inline-flex items-center justify-center w-7 h-7 rounded-full text-ink/50 hover:text-ink hover:bg-muted/50 transition-colors"
								>
									<XIcon className="w-3 h-3" />
								</button>
							</div>
						) : null}

						<TooltipProvider delay={250}>
							<div className="flex flex-wrap items-center gap-1 px-3 py-2 border-t border-border">
								<input
									ref={fileInputRef}
									type="file"
									accept="image/jpeg,image/png,image/webp,image/gif"
									multiple
									hidden
									onChange={(e) => handleFilesSelected(e.target.files)}
								/>

								{/* Media */}
								<ToolButton
									onClick={() => fileInputRef.current?.click()}
									disabled={isUploading || baseMedia.length >= MAX_MEDIA}
									label={
										baseMedia.length >= MAX_MEDIA
											? `Up to ${MAX_MEDIA} images`
											: "Attach image"
									}
									icon={
										isUploading ? (
											<Loader2 className="w-4 h-4 animate-spin" />
										) : (
											<ImageUp className="w-4 h-4" />
										)
									}
								/>
								<ToolButton
									onClick={() => setShowImageGen((v) => !v)}
									disabled={baseMedia.length >= MAX_MEDIA}
									active={showImageGen}
									label={
										baseMedia.length >= MAX_MEDIA
											? `Up to ${MAX_MEDIA} images`
											: "Generate image"
									}
									icon={<ImagePlus className="w-4 h-4" />}
								/>
								<ToolButton
									onClick={() => {
										setShowLibrary((v) => !v);
										if (!showLibrary) {
											setShowGenerate(false);
											setShowVariants(false);
											setShowFanout(false);
											setShowImport(false);
											setShowScore(false);
										}
									}}
									disabled={baseMedia.length >= MAX_MEDIA}
									active={showLibrary}
									label={
										baseMedia.length >= MAX_MEDIA
											? `Up to ${MAX_MEDIA} images`
											: "Attach from library"
									}
									icon={<Images className="w-4 h-4" />}
								/>

								<ToolDivider />

								<div className="px-1">
									<CharCounter
										length={editorValue.length}
										limit={activeLimit}
										tightestPlatforms={
											activePlatform
												? editorValue.length > activeLimit
													? [activePlatform.name]
													: []
												: perPlatformOverflow.map((x) => x.platform.name)
										}
									/>
								</div>

								<ToolDivider />

								{/* Compose */}
								<ToolButton
									onClick={() => {
										setShowGenerate((v) => !v);
										if (!showGenerate) {
											setShowVariants(false);
											setShowFanout(false);
											setShowImport(false);
											setShowScore(false);
											setShowLibrary(false);
										}
									}}
									active={showGenerate}
									label="Draft from a topic"
									icon={<Wand2 className="w-4 h-4" />}
								/>
								<ToolButton
									onClick={() => {
										setShowVariants((v) => !v);
										if (!showVariants) {
											setShowGenerate(false);
											setShowFanout(false);
											setShowImport(false);
											setShowScore(false);
											setShowLibrary(false);
										}
									}}
									disabled={selectedPlatforms.length === 0}
									active={showVariants}
									label={
										selectedPlatforms.length === 0
											? "Select a channel first"
											: "Draft one version per selected channel"
									}
									icon={<Layers className="w-4 h-4" />}
								/>
								<ToolButton
									onClick={() => {
										setShowFanout((v) => !v);
										if (!showFanout) {
											setShowGenerate(false);
											setShowVariants(false);
											setShowImport(false);
											setShowScore(false);
											setShowLibrary(false);
										}
									}}
									disabled={!canFanout}
									active={showFanout}
									label={
										!fanoutSourcePlatform
											? "Open a channel tab to fan out from"
											: fanoutTargets.length === 0
												? "Select another channel to fan out to"
												: effectiveContent(fanoutSourcePlatform.id).trim()
															.length === 0
													? "Write something on this channel first"
													: `Fan out this ${fanoutSourcePlatform.name} post to the other channels`
									}
									icon={<GitBranch className="w-4 h-4" />}
								/>
								<ToolButton
									onClick={() => {
										setShowImport((v) => !v);
										if (!showImport) {
											setShowGenerate(false);
											setShowVariants(false);
											setShowFanout(false);
											setShowScore(false);
											setShowLibrary(false);
										}
									}}
									disabled={selectedPlatforms.length === 0}
									active={showImport}
									label={
										selectedPlatforms.length === 0
											? "Select a channel first"
											: "Import from a URL"
									}
									icon={<FileText className="w-4 h-4" />}
								/>

								<ToolDivider />

								{/* Polish */}
								<ToolButton
									onClick={() => {
										setShowScore((v) => !v);
										if (!showScore) {
											setShowGenerate(false);
											setShowVariants(false);
											setShowFanout(false);
											setShowImport(false);
											setShowLibrary(false);
										}
									}}
									disabled={!canScore}
									active={showScore}
									label={
										!scorePlatform
											? "Select a channel to score against"
											: scoreContent.trim().length < 20
												? "Write a bit more to score"
												: `Score this ${scorePlatform.name} post`
									}
									icon={<Gauge className="w-4 h-4" />}
								/>
								<ToolButton
									onClick={handleRefine}
									disabled={isRefining || !editorValue.trim()}
									label="Refine the current draft"
									icon={
										isRefining ? (
											<Loader2 className="w-4 h-4 animate-spin" />
										) : (
											<Sparkles className="w-4 h-4" />
										)
									}
								/>
								<ToolButton
									onClick={handleSuggestHashtags}
									disabled={isHashing || !editorValue.trim()}
									label="Suggest hashtags"
									icon={
										isHashing ? (
											<Loader2 className="w-4 h-4 animate-spin" />
										) : (
											<Hash className="w-4 h-4" />
										)
									}
								/>
							</div>
						</TooltipProvider>
					</div>

					{showLibrary ? (
						<div className="mt-6">
							<LibraryPanel
								attachedUrls={baseMedia.map((m) => m.url)}
								remainingSlots={MAX_MEDIA - baseMedia.length}
								onAttach={handleAttachFromLibrary}
								onClose={() => setShowLibrary(false)}
							/>
						</div>
					) : null}
					{showVariants ? (
						<div className="mt-6">
							<VariantsPanel
								platforms={variantPlatforms}
								onAccept={applyVariantToChannel}
								onClose={() => setShowVariants(false)}
							/>
						</div>
					) : null}
					{showFanout && fanoutSourcePlatform ? (
						<div className="mt-6">
							<FanoutPanel
								sourcePlatform={fanoutSourcePlatform.id}
								sourcePlatformName={fanoutSourcePlatform.name}
								sourceContent={effectiveContent(fanoutSourcePlatform.id)}
								targets={fanoutTargets}
								onAccept={applyVariantToChannel}
								onClose={() => setShowFanout(false)}
							/>
						</div>
					) : null}
					{showImport ? (
						<div className="mt-6">
							<ImportPanel
								targets={variantPlatforms}
								onAccept={applyVariantToChannel}
								onClose={() => setShowImport(false)}
							/>
						</div>
					) : null}
					{showScore && scorePlatform ? (
						<div className="mt-6">
							<ScorePanel
								platformId={scorePlatform.id}
								platformName={scorePlatform.name}
								content={scoreContent}
								onImprove={(text) => {
									if (activeTab === scorePlatform.id) {
										handleEditorChange(text);
									} else if (activeTab === "all") {
										setBaseContent(text);
									} else {
										applyVariantToChannel(scorePlatform.id, text);
									}
								}}
								onClose={() => setShowScore(false)}
							/>
						</div>
					) : null}

					<p className="mt-4 text-[12px] text-ink/50 leading-normal">
						{activePlatform
							? "Changes here only affect this channel. Switch to All channels to edit the shared copy."
							: "Tip: write once for everyone, then open a channel tab to fine-tune the version that ships there."}
					</p>
				</div>

				{/* Preview */}
				<aside className="lg:col-span-5">
					<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-3">
						Live preview
					</p>
					{selectedPlatforms.length === 0 ? (
						<div className="rounded-2xl border border-dashed border-border-strong bg-background-elev px-6 py-10 text-center text-[13px] text-ink/55">
							Pick a channel to see the preview.
						</div>
					) : activePlatform ? (
						<PreviewCard
							platform={activePlatform}
							author={author}
							content={effectiveContent(activePlatform.id)}
						/>
					) : (
						<div className="space-y-4">
							{selectedPlatforms.map((p) => (
								<PreviewCard
									key={p.id}
									platform={p}
									author={author}
									content={effectiveContent(p.id)}
								/>
							))}
						</div>
					)}
				</aside>
			</section>
		</div>
	);
}

function TabButton({
	active,
	onClick,
	children,
	dot,
	warn,
}: {
	active: boolean;
	onClick: () => void;
	children: React.ReactNode;
	dot?: boolean;
	warn?: boolean;
}) {
	return (
		<button
			type="button"
			role="tab"
			aria-selected={active}
			onClick={onClick}
			className={cn(
				"relative inline-flex items-center gap-1.5 h-8 px-3 rounded-full border text-[12.5px] font-medium transition-colors",
				active
					? "bg-ink text-background border-ink"
					: "bg-background-elev text-ink/70 border-border-strong hover:border-ink hover:text-ink",
			)}
		>
			{children}
			{warn ? (
				<span
					className="inline-block w-1.5 h-1.5 rounded-full bg-primary-deep"
					aria-label="Over limit"
				/>
			) : dot ? (
				<span
					className={cn(
						"inline-block w-1.5 h-1.5 rounded-full",
						active ? "bg-background" : "bg-primary",
					)}
					aria-label="Customized"
				/>
			) : null}
		</button>
	);
}

function ToolButton({
	icon,
	label,
	onClick,
	active,
	disabled,
}: {
	icon: React.ReactNode;
	label: string;
	onClick: () => void;
	active?: boolean;
	disabled?: boolean;
}) {
	const button = (
		<button
			type="button"
			onClick={onClick}
			disabled={disabled}
			aria-label={label}
			aria-pressed={active}
			className={cn(
				"inline-flex items-center justify-center w-9 h-9 rounded-full transition-colors shrink-0",
				active
					? "bg-ink text-background"
					: "text-ink/60 hover:text-ink hover:bg-muted/60",
				"disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-ink/60",
			)}
		>
			{icon}
		</button>
	);
	return (
		<Tooltip>
			<TooltipTrigger render={button} />
			<TooltipContent>{label}</TooltipContent>
		</Tooltip>
	);
}

function ToolDivider() {
	return <span aria-hidden className="w-px h-5 bg-border mx-1 shrink-0" />;
}

function CharCounter({
	length,
	limit,
	tightestPlatforms,
}: {
	length: number;
	limit: number;
	tightestPlatforms: string[];
}) {
	const over = length > limit;
	const hasFiniteLimit = Number.isFinite(limit);
	return (
		<div className="flex items-center gap-2 text-[12px]">
			<span
				className={cn(
					"tabular-nums font-medium",
					over ? "text-primary-deep" : "text-ink/60",
				)}
			>
				{length}
				{hasFiniteLimit ? ` / ${limit}` : ""}
			</span>
			{tightestPlatforms.length > 0 ? (
				<span className="inline-flex items-center gap-1 text-[11px] font-medium text-primary-deep">
					<AlertCircle className="w-3 h-3" />
					Too long for {tightestPlatforms.join(", ")}
				</span>
			) : null}
		</div>
	);
}

function SchedulePopover({
	scheduledAt,
	setScheduledAt,
	open,
	setOpen,
	onConfirm,
	disabled,
	busy,
	timezone,
}: {
	scheduledAt: string;
	setScheduledAt: (v: string) => void;
	open: boolean;
	setOpen: (v: boolean) => void;
	onConfirm: () => void;
	disabled: boolean;
	busy: boolean;
	timezone: string;
}) {
	const ref = useRef<HTMLDivElement>(null);

	// Parse scheduledAt into date and time components
	const selectedDate = scheduledAt ? new Date(scheduledAt) : undefined;
	const [selectedTime, setSelectedTime] = useState<string>(
		scheduledAt ? scheduledAt.slice(11, 16) : "12:00",
	);

	// Update time when scheduledAt changes externally
	useEffect(() => {
		if (scheduledAt) {
			setSelectedTime(scheduledAt.slice(11, 16));
		}
	}, [scheduledAt]);

	useEffect(() => {
		if (!open) return;
		const onDown = (e: MouseEvent) => {
			const target = e.target as HTMLElement | null;
			if (!target) return;
			if (ref.current?.contains(target)) return;
			// Ignore clicks inside portaled popups (e.g. the TimePicker hour select).
			if (
				target.closest(
					'[role="listbox"],[role="option"],[role="dialog"],[data-floating-ui-portal]',
				)
			)
				return;
			setOpen(false);
		};
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") setOpen(false);
		};
		document.addEventListener("mousedown", onDown);
		document.addEventListener("keydown", onKey);
		return () => {
			document.removeEventListener("mousedown", onDown);
			document.removeEventListener("keydown", onKey);
		};
	}, [open, setOpen]);

	const handleDateSelect = (date: Date | undefined) => {
		if (!date) return;
		// Combine selected date with current time
		const [hours, minutes] = selectedTime.split(":").map(Number);
		const newDate = new Date(date);
		newDate.setHours(hours, minutes, 0, 0);
		setScheduledAt(newDate.toISOString().slice(0, 16));
	};

	const handleTimeChange = (time: string) => {
		setSelectedTime(time);
		if (selectedDate) {
			const [hours, minutes] = time.split(":").map(Number);
			const newDate = new Date(selectedDate);
			newDate.setHours(hours, minutes, 0, 0);
			setScheduledAt(newDate.toISOString().slice(0, 16));
		}
	};

	const preview = scheduledAt
		? new Intl.DateTimeFormat("en-US", {
				dateStyle: "medium",
				timeStyle: "short",
			}).format(new Date(scheduledAt))
		: "Schedule";

	// Calculate min date (today, can't select past dates)
	const minDate = new Date();
	minDate.setHours(0, 0, 0, 0);

	return (
		<div ref={ref} className="relative">
			<button
				type="button"
				onClick={() => setOpen(!open)}
				className={cn(
					"inline-flex items-center gap-1.5 h-11 px-5 rounded-full border text-[14px] font-medium transition-colors",
					scheduledAt
						? "bg-peach-100 border-ink/20 text-ink"
						: "bg-background-elev border-border-strong text-ink hover:border-ink",
				)}
			>
				<CalendarClock className="w-4 h-4" />
				{preview}
			</button>

			{open ? (
				<div className="absolute right-0 mt-2 w-[360px] rounded-2xl border border-border-strong bg-background-elev shadow-[0_18px_48px_-24px_rgba(26,22,18,0.25)] p-5 z-50">
					<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
						Schedule
					</p>
					<p className="mt-1 text-[12.5px] text-ink/60 leading-normal">
						Your timezone: <span className="text-ink">{timezone}</span>
					</p>

					<div className="mt-4 rounded-xl border border-border-strong bg-background p-3">
						<Calendar
							mode="single"
							selected={selectedDate}
							onSelect={handleDateSelect}
							defaultMonth={selectedDate}
							captionLayout="dropdown"
							startMonth={new Date(minDate.getFullYear(), 0)}
							endMonth={new Date(minDate.getFullYear() + 5, 11)}
							disabled={{ before: minDate }}
							autoFocus
							className="w-full p-0 [--cell-size:--spacing(8)]"
							classNames={{
								root: "w-full",
								month: "relative flex w-full flex-col gap-4",
								month_caption:
									"flex h-(--cell-size) w-full items-center justify-center",
								button_previous:
									"absolute top-0 left-0 z-10 size-8 p-0 inline-flex items-center justify-center rounded-full text-ink hover:bg-muted/50 transition-colors",
								button_next:
									"absolute top-0 right-0 z-10 size-8 p-0 inline-flex items-center justify-center rounded-full text-ink hover:bg-muted/50 transition-colors",
							}}
						/>
					</div>

					<div className="mt-4 flex items-center gap-2">
						<Clock className="w-4 h-4 text-ink/50 shrink-0" />
						<span className="text-[12.5px] text-ink/60 mr-auto">Time</span>
						<TimePicker value={selectedTime} onChange={handleTimeChange} />
					</div>

					<div className="mt-5 flex items-center gap-2">
						<button
							type="button"
							onClick={() => {
								setScheduledAt("");
								setOpen(false);
							}}
							className="flex-1 h-10 rounded-full text-[13px] text-ink/70 hover:text-ink transition-colors"
						>
							Clear
						</button>
						<button
							type="button"
							onClick={onConfirm}
							disabled={disabled || !scheduledAt}
							className="flex-1 inline-flex items-center justify-center gap-1.5 h-10 rounded-full bg-ink text-background text-[13px] font-medium hover:bg-primary disabled:opacity-40 disabled:hover:bg-ink transition-colors"
						>
							{busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
							Schedule
						</button>
					</div>
				</div>
			) : null}
		</div>
	);
}

function BestWindowHint({
	platformName,
	window,
}: {
	platformName: string;
	window: BestWindow;
}) {
	const sampleLabel = window.samples === 1 ? "post" : "posts";
	return (
		<div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-peach-100/60 px-3 py-1.5 text-[12px] text-ink/75">
			<Clock className="w-3.5 h-3.5 text-primary shrink-0" />
			<span>
				Best window for {platformName}:{" "}
				<span className="font-medium text-ink">{formatWindow(window)}</span>{" "}
				<span className="text-ink/60">
					(+{window.deltaPct}% vs your average, based on {window.samples}{" "}
					{sampleLabel})
				</span>
			</span>
		</div>
	);
}

function headerEyebrowForStatus(
	status: "draft" | "scheduled" | "published" | "failed" | null | undefined,
): string {
	switch (status) {
		case "scheduled":
			return "Editing scheduled post";
		case "published":
			return "Published · read-only";
		case "failed":
			return "Editing failed post";
		default:
			return "Editing draft";
	}
}
