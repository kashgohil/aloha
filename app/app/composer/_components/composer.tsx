"use client";

import {
	generateAltText,
	generateImageAction,
	generateRichDraft,
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
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { TimePicker } from "@/components/ui/time-picker";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ChannelOverride, DraftMeta, PostMedia } from "@/db/schema";
import type { BestWindow } from "@/lib/best-time-format";
import { formatWindow } from "@/lib/best-time-format";
import type { EffectiveState } from "@/lib/channel-state-format";
import { stateOr, stateStyles } from "@/lib/channel-state-format";
import {
	buildTzLocalInput,
	formatTzLocalInputForDisplay,
	tzLocalInputToUtcDate,
	utcIsoToTzLocalInput,
} from "@/lib/tz";
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
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { DraftMetaPanel } from "./draft-meta-panel";
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
	museAccess,
	bestWindows,
	channelStates,
	initialContent = "",
	initialMedia = [],
	initialPlatforms = [],
	initialOverrides = {},
	initialScheduledAt = null,
	initialStatus = null,
	initialDraftMeta = null,
	editingPostId = null,
	sourceIdeaId = null,
	sourceIdeaTitle = null,
}: {
	author: Author;
	connectedProviders: string[];
	museAccess: boolean;
	bestWindows: Record<string, BestWindow[]>;
	channelStates: Record<string, EffectiveState>;
	initialContent?: string;
	initialMedia?: PostMedia[];
	initialPlatforms?: string[];
	initialOverrides?: Record<string, ChannelOverride>;
	initialScheduledAt?: string | null;
	initialStatus?: "draft" | "scheduled" | "published" | "failed" | null;
	initialDraftMeta?: DraftMeta | null;
	editingPostId?: string | null;
	sourceIdeaId?: string | null;
	sourceIdeaTitle?: string | null;
}) {
	const router = useRouter();
	const [baseContent, setBaseContent] = useState(initialContent);
	const isEditing = editingPostId !== null;
	const isReadOnly = initialStatus === "published";
	// datetime-local strings are tz-less wall-clock. We always treat them as
	// the user's configured tz (not the browser's), so hydrate from the UTC
	// instant through the tz helper.
	const defaultSchedule = initialScheduledAt
		? utcIsoToTzLocalInput(initialScheduledAt, author.timezone)
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
	const [draftMeta, setDraftMeta] = useState<DraftMeta | null>(initialDraftMeta);
	const [showDraftMeta, setShowDraftMeta] = useState(Boolean(initialDraftMeta));
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

	// "Direct publish" is only meaningful on channels whose effective state is
	// connected_published. For manual_assist / review_pending channels the
	// worker silently falls back to a reminder email, so we hide the Publish
	// button when none of the selected channels can actually post, and we
	// surface the fallback in the Schedule popover.
	const publishableSelected = selectedPlatforms.filter(
		(p) => stateOr(channelStates, p.id) === "connected_published",
	);
	const notifyOnlySelected = selectedPlatforms.filter(
		(p) => stateOr(channelStates, p.id) !== "connected_published",
	);
	const anyPublishable = publishableSelected.length > 0;
	const scheduleHint =
		notifyOnlySelected.length > 0
			? `Channels without direct publishing (${notifyOnlySelected
					.map((p) => p.name)
					.join(", ")}) get a reminder email at this time.`
			: null;

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
		const toastId = toast.loading("Drafting with Muse…");
		startGenerating(async () => {
			try {
				const context = activePlatform?.id ?? selected[0] ?? "general";
				const rich = await generateRichDraft(generateTopic, context);
				handleEditorChange(rich.body);
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
				setShowDraftMeta(true);
				setGenerateTopic("");
				setShowGenerate(false);
				toast.success("Draft ready.", { id: toastId });
			} catch (err) {
				const msg = messageFromErr(
					err,
					"Generate failed. Try again in a moment.",
				);
				toast.error(msg, { id: toastId });
				setFormError(msg);
			}
		});
	};

	// Swap the first line of the body with the picked hook. If the body is
	// empty, just set it. If the first line already matches, no-op.
	const handleSwapHook = (hook: string) => {
		const lines = baseContent.split("\n");
		if (lines.length === 0 || lines[0] === "") {
			handleEditorChange(hook + (baseContent ? `\n${baseContent}` : ""));
			return;
		}
		if (lines[0] === hook) return;
		lines[0] = hook;
		handleEditorChange(lines.join("\n"));
		setDraftMeta((m) => (m ? { ...m, hook } : m));
	};

	// Append hashtags that aren't already present. Adds a blank line before if
	// the body doesn't end with one.
	const handleApplyHashtags = (tags: string[]) => {
		if (tags.length === 0) return;
		const existing = new Set(
			(baseContent.match(/#[\w-]+/g) ?? []).map((t) => t.toLowerCase()),
		);
		const additions = tags.filter((t) => !existing.has(t.toLowerCase()));
		if (additions.length === 0) return;
		const sep = baseContent.endsWith("\n\n")
			? ""
			: baseContent.endsWith("\n")
				? "\n"
				: baseContent
					? "\n\n"
					: "";
		handleEditorChange(baseContent + sep + additions.join(" "));
	};

	const buildPayload = () => ({
		content: baseContent,
		platforms: selected,
		media: baseMedia,
		channelContent: overrides,
		sourceIdeaId,
		draftMeta,
	});

	const handleSaveDraft = () => {
		if (!canSubmit || isReadOnly) return;
		setFormError(null);
		const toastId = toast.loading("Saving draft…");
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
				toast.success("Draft saved.", { id: toastId });
				router.push("/app/dashboard");
			} catch {
				toast.error("Couldn't save. Please try again.", { id: toastId });
				setFormError("Couldn't save. Please try again.");
			}
		});
	};

	const handleSchedule = () => {
		if (!canSubmit || !scheduledAt || isReadOnly) return;
		setFormError(null);
		const toastId = toast.loading("Scheduling…");
		startPublishing(async () => {
			try {
				const when = tzLocalInputToUtcDate(scheduledAt, author.timezone);
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
				toast.success("Post scheduled.", { id: toastId });
				router.push("/app/dashboard");
			} catch {
				toast.error("Couldn't schedule. Check the time and try again.", {
					id: toastId,
				});
				setFormError("Couldn't schedule. Check the time and try again.");
			}
		});
	};

	const handlePublishNow = () => {
		if (!canSubmit || isReadOnly) return;
		setFormError(null);
		const toastId = toast.loading("Publishing…");
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
				toast.success("Publishing now.", { id: toastId });
				router.push("/app/dashboard");
			} catch {
				toast.error("Couldn't publish. Please try again.", { id: toastId });
				setFormError("Couldn't publish. Please try again.");
			}
		});
	};

	type DrawerTabId =
		| "muse"
		| "scaffolding"
		| "variants"
		| "fanout"
		| "import"
		| "score"
		| "library"
		| "image";

	const activeDrawer: DrawerTabId | null = showGenerate
		? "muse"
		: showDraftMeta && draftMeta
			? "scaffolding"
			: showVariants
				? "variants"
				: showFanout && fanoutSourcePlatform
					? "fanout"
					: showImport
						? "import"
						: showScore && scorePlatform
							? "score"
							: showLibrary
								? "library"
								: showImageGen
									? "image"
									: null;

	const closeAllDrawers = () => {
		setShowGenerate(false);
		setShowDraftMeta(false);
		setShowVariants(false);
		setShowFanout(false);
		setShowImport(false);
		setShowScore(false);
		setShowLibrary(false);
		setShowImageGen(false);
	};

	const toggleDrawer = (id: DrawerTabId) => {
		if (activeDrawer === id) {
			closeAllDrawers();
			return;
		}
		closeAllDrawers();
		switch (id) {
			case "muse":
				setShowGenerate(true);
				break;
			case "scaffolding":
				setShowDraftMeta(true);
				break;
			case "variants":
				setShowVariants(true);
				break;
			case "fanout":
				setShowFanout(true);
				break;
			case "import":
				setShowImport(true);
				break;
			case "score":
				setShowScore(true);
				break;
			case "library":
				setShowLibrary(true);
				break;
			case "image":
				setShowImageGen(true);
				break;
		}
	};

	return (
		<div className="space-y-8 pb-12">
			{/* Page header: eyebrow + title (actions live inside the editor card) */}
			<header>
				<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
					{isEditing ? headerEyebrowForStatus(initialStatus) : "New post"}
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
				<p className="mt-3 text-[14px] text-ink/65 max-w-xl leading-[1.55]">
					Write once, pick your channels, schedule or ship. Muse can help
					with hooks, hashtags, and images as you go.
				</p>
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

			{/* Editor card: two chip header bars → core editor + floating preview → footers */}
			<div className="rounded-3xl border border-border bg-background-elev overflow-hidden">
				{/* Header bar 1: publish-to channels + char counter */}
				<div className="flex items-center gap-4 flex-wrap px-5 py-3 border-b border-border bg-muted/40">
					<p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-ink/55 shrink-0">
						Publish to
					</p>
					<div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
						{PLATFORMS.map((p) => {
							const isSelected = selected.includes(p.id);
							const Icon = PLATFORM_ICONS[p.id];
							const state = isSelected ? stateOr(channelStates, p.id) : null;
							const style = state ? stateStyles(state) : null;
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
									{isSelected && style && state !== "connected_published" ? (
										<span
											aria-label={style.label}
											title={style.tooltip}
											className={cn(
												"ml-0.5 inline-block w-1.5 h-1.5 rounded-full",
												style.dotClass,
											)}
										/>
									) : null}
								</button>
							);
						})}
					</div>
					<div className="shrink-0">
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
				</div>

				{connectedProviders.length === 0 ? (
					<p className="flex items-center gap-1.5 px-5 py-2 border-b border-border bg-peach-100/50 text-[12px] text-ink/65">
						<Plug className="w-3.5 h-3.5" />
						No channels connected yet. You can still draft and schedule —
						connect from Settings to go live.
					</p>
				) : null}

				{/* Header bar 2: scope tabs — Draft | channels */}
				<div
					role="tablist"
					aria-label="Content scope"
					className="flex flex-wrap items-center gap-1 px-5 py-3 border-b border-border bg-muted/25"
				>
					<TabButton
						active={activeTab === "all"}
						onClick={() => setActiveTab("all")}
					>
						Draft
					</TabButton>
					{selectedPlatforms.length > 0 ? <ToolDivider /> : null}
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
					<div className="px-5 py-2 border-b border-border">
						<BestWindowHint
							platformName={activePlatform.name}
							window={bestWindows[activePlatform.id][0]}
						/>
					</div>
				) : null}

				{activePlatform ? (
					<div className="flex items-center justify-between gap-3 px-5 py-2 border-b border-border text-[12px] text-ink/60">
						<span>
							{isOverridden(activePlatform.id)
								? `Customized for ${activePlatform.name}.`
								: `Inheriting from Draft. Edit to customize for ${activePlatform.name}.`}
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

				<div className="grid grid-cols-1 lg:grid-cols-12">
					<div className="lg:col-span-7 min-w-0">
						<textarea
							value={editorValue}
							onChange={(e) => handleEditorChange(e.target.value)}
							placeholder={
								activePlatform
									? `Write a version tailored for ${activePlatform.name}…`
									: "Write the base draft — each channel inherits from here."
							}
							className="w-full min-h-[360px] p-7 lg:p-8 bg-transparent focus:outline-none resize-none text-[17px] leading-[1.6] text-ink placeholder:text-ink/35 font-sans"
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
					</div>

					<aside className="lg:col-span-5 p-4 lg:p-5 flex flex-col gap-4 h-full">
						{activePlatform ? (
							<div className="rounded-2xl shadow-[0_14px_32px_-18px_rgba(26,22,18,0.28)]">
								<PreviewCard
									platform={activePlatform}
									author={author}
									content={effectiveContent(activePlatform.id)}
								/>
							</div>
						) : (
							<div className="rounded-2xl border border-dashed border-border-strong bg-background/60 px-6 py-12 text-center shadow-[0_14px_32px_-18px_rgba(26,22,18,0.18)]">
								<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-2">
									Live preview
								</p>
								<p className="text-[13px] text-ink/55 leading-normal">
									Pick a channel above to see how this draft will look there.
								</p>
							</div>
						)}

						<div className="mt-auto flex flex-wrap items-center justify-end gap-2">
							<button
								type="button"
								onClick={handleSaveDraft}
								disabled={!canSubmit || isSaving || isReadOnly}
								className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full border border-border-strong bg-background-elev text-[13px] font-medium text-ink hover:border-ink disabled:opacity-40 disabled:hover:border-border-strong transition-colors"
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
								hint={scheduleHint}
							/>

							{anyPublishable ? (
								<button
									type="button"
									onClick={handlePublishNow}
									disabled={!canSubmit || isPublishing || isReadOnly}
									className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-ink text-background text-[13px] font-medium hover:bg-primary disabled:opacity-40 disabled:hover:bg-ink transition-colors"
									title={
										notifyOnlySelected.length > 0
											? `Publishes to ${publishableSelected.map((p) => p.name).join(", ")}. ${notifyOnlySelected.map((p) => p.name).join(", ")} need a schedule to get a reminder.`
											: `Publish to ${publishableSelected.map((p) => p.name).join(", ")}`
									}
								>
									{isPublishing && !scheduledAt ? (
										<Loader2 className="w-4 h-4 animate-spin" />
									) : (
										<Send className="w-4 h-4" />
									)}
									Publish
								</button>
							) : null}
						</div>
					</aside>
				</div>

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
								<ToolDivider />
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

					{/* Second footer: Assist — Muse / Variants / Fan out / Score / Import / Image / Library */}
					{museAccess ? (
					<TooltipProvider delay={250}>
						<div className="flex items-center gap-1 px-3 py-2 border-t border-border bg-muted/50 overflow-x-auto">
							<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 px-2 shrink-0">
								Assist
							</p>
							<ToolDivider />
							<DrawerTab
								active={activeDrawer === "muse"}
								onClick={() => toggleDrawer("muse")}
								icon={<Wand2 className="w-3.5 h-3.5" />}
								label="Draft from a topic — Muse writes the post + scaffolding"
							>
								Muse
							</DrawerTab>
							{draftMeta ? (
								<DrawerTab
									active={activeDrawer === "scaffolding"}
									onClick={() => toggleDrawer("scaffolding")}
									icon={<Sparkles className="w-3.5 h-3.5" />}
									label="Muse scaffolding — hooks, beats, CTA, hashtags"
								>
									Scaffolding
								</DrawerTab>
							) : null}
							<DrawerTab
								active={activeDrawer === "variants"}
								onClick={() => toggleDrawer("variants")}
								disabled={selectedPlatforms.length === 0}
								icon={<Layers className="w-3.5 h-3.5" />}
								label={
									selectedPlatforms.length === 0
										? "Select a channel first"
										: "Draft one version per selected channel"
								}
							>
								Variants
							</DrawerTab>
							<DrawerTab
								active={activeDrawer === "fanout"}
								onClick={() => toggleDrawer("fanout")}
								disabled={!canFanout}
								icon={<GitBranch className="w-3.5 h-3.5" />}
								label={
									!fanoutSourcePlatform
										? "Open a channel tab to fan out from"
										: fanoutTargets.length === 0
											? "Select another channel to fan out to"
											: effectiveContent(fanoutSourcePlatform.id).trim()
													.length === 0
												? "Write something on this channel first"
												: `Fan out this ${fanoutSourcePlatform.name} post`
								}
							>
								Fan out
							</DrawerTab>
							<DrawerTab
								active={activeDrawer === "score"}
								onClick={() => toggleDrawer("score")}
								disabled={!canScore}
								icon={<Gauge className="w-3.5 h-3.5" />}
								label={
									!scorePlatform
										? "Select a channel to score against"
										: scoreContent.trim().length < 20
											? "Write a bit more to score"
											: `Score this ${scorePlatform.name} post`
								}
							>
								Score
							</DrawerTab>
							<DrawerTab
								active={activeDrawer === "import"}
								onClick={() => toggleDrawer("import")}
								disabled={selectedPlatforms.length === 0}
								icon={<FileText className="w-3.5 h-3.5" />}
								label={
									selectedPlatforms.length === 0
										? "Select a channel first"
										: "Import from a URL"
								}
							>
								Import
							</DrawerTab>
							<DrawerTab
								active={activeDrawer === "image"}
								onClick={() => toggleDrawer("image")}
								disabled={baseMedia.length >= MAX_MEDIA}
								icon={<ImagePlus className="w-3.5 h-3.5" />}
								label={
									baseMedia.length >= MAX_MEDIA
										? `Up to ${MAX_MEDIA} images`
										: "Generate image"
								}
							>
								Image
							</DrawerTab>
							<DrawerTab
								active={activeDrawer === "library"}
								onClick={() => toggleDrawer("library")}
								disabled={baseMedia.length >= MAX_MEDIA}
								icon={<Images className="w-3.5 h-3.5" />}
								label={
									baseMedia.length >= MAX_MEDIA
										? `Up to ${MAX_MEDIA} images`
										: "Attach from library"
								}
							>
								Library
							</DrawerTab>
							{activeDrawer ? (
								<button
									type="button"
									onClick={closeAllDrawers}
									aria-label="Close panel"
									className="ml-auto inline-flex items-center justify-center w-8 h-8 rounded-full text-ink/60 hover:text-ink hover:bg-background/70 transition-colors shrink-0"
								>
									<XIcon className="w-4 h-4" />
								</button>
							) : null}
						</div>
					</TooltipProvider>
					) : (
						<div className="flex items-center justify-between gap-4 px-5 py-3 border-t border-border bg-peach-100/30">
							<div className="flex items-center gap-3">
								<span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-peach-100 border border-peach-300 text-primary">
									<Sparkles className="w-4 h-4" />
								</span>
								<div>
									<p className="text-[13px] font-medium text-ink">
										Unlock Muse — your AI co-writer
									</p>
									<p className="text-[12px] text-ink/60">
										Draft posts from a topic, generate hooks & hashtags, score engagement, fan out to multiple channels, and more.
									</p>
								</div>
							</div>
							<Link
								href="/app/settings/muse"
								className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-ink text-background text-[13px] font-medium hover:bg-primary transition-colors shrink-0"
							>
								<Wand2 className="w-3.5 h-3.5" />
								Enable Muse
							</Link>
						</div>
					)}

						{museAccess && activeDrawer ? (
							<div className="border-t border-border bg-muted/30">
								{activeDrawer === "muse" ? (
									<div className="px-5 py-4 lg:px-6 lg:py-5 space-y-3">
										<div className="flex items-center gap-2 text-[12px] text-ink/65">
											<Wand2 className="w-3.5 h-3.5 text-primary" />
											<span>
												Muse drafts the post + the scaffolding — hook options,
												beats, CTA, hashtags
												{activePlatform
													? ` for ${activePlatform.name}`
													: selected.length > 0
														? " — picks the first selected channel"
														: ""}
												.
											</span>
										</div>
										<div className="flex items-center gap-2 flex-wrap">
											<input
												value={generateTopic}
												onChange={(e) => setGenerateTopic(e.target.value)}
												onKeyDown={(e) => {
													if (e.key === "Enter" && !isGenerating) {
														e.preventDefault();
														handleGenerate();
													}
													if (e.key === "Escape") {
														closeAllDrawers();
														setGenerateTopic("");
													}
												}}
												placeholder="e.g. how we cut onboarding time in half"
												autoFocus
												className="flex-1 min-w-[240px] h-10 px-3 rounded-full border border-border bg-background-elev text-[13.5px] text-ink placeholder:text-ink/40 focus:outline-none focus:border-ink"
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
										</div>
									</div>
								) : null}

								{activeDrawer === "scaffolding" && draftMeta ? (
									<DraftMetaPanel
										meta={draftMeta}
										onSwapHook={handleSwapHook}
										onApplyHashtags={handleApplyHashtags}
										onClose={closeAllDrawers}
									/>
								) : null}

								{activeDrawer === "variants" ? (
									<VariantsPanel
										platforms={variantPlatforms}
										onAccept={applyVariantToChannel}
										onClose={closeAllDrawers}
									/>
								) : null}

								{activeDrawer === "fanout" && fanoutSourcePlatform ? (
									<FanoutPanel
										sourcePlatform={fanoutSourcePlatform.id}
										sourcePlatformName={fanoutSourcePlatform.name}
										sourceContent={effectiveContent(fanoutSourcePlatform.id)}
										targets={fanoutTargets}
										onAccept={applyVariantToChannel}
										onClose={closeAllDrawers}
									/>
								) : null}

								{activeDrawer === "import" ? (
									<ImportPanel
										targets={variantPlatforms}
										onAccept={applyVariantToChannel}
										onClose={closeAllDrawers}
									/>
								) : null}

								{activeDrawer === "score" && scorePlatform ? (
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
										onClose={closeAllDrawers}
									/>
								) : null}

								{activeDrawer === "library" ? (
									<LibraryPanel
										attachedUrls={baseMedia.map((m) => m.url)}
										remainingSlots={MAX_MEDIA - baseMedia.length}
										onAttach={handleAttachFromLibrary}
										onClose={closeAllDrawers}
									/>
								) : null}

								{activeDrawer === "image" ? (
									<div className="px-5 py-4 lg:px-6 lg:py-5 space-y-3">
										<div className="flex items-center gap-2 text-[12px] text-ink/65">
											<ImagePlus className="w-3.5 h-3.5 text-primary" />
											<span>
												Describe the image you want — Muse generates it in
												your chosen aspect.
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
													closeAllDrawers();
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
													onClick={closeAllDrawers}
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
							</div>
						) : null}
			</div>
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
	hint,
}: {
	scheduledAt: string;
	setScheduledAt: (v: string) => void;
	open: boolean;
	setOpen: (v: boolean) => void;
	onConfirm: () => void;
	disabled: boolean;
	busy: boolean;
	timezone: string;
	hint?: string | null;
}) {
	// `scheduledAt` is a "YYYY-MM-DDTHH:mm" wall-clock string in the user's
	// configured tz. The calendar widget wants a Date whose *browser-local*
	// Y/M/D equals the picked day, so we synthesize one from the string
	// components (no parsing that could drift across tzs).
	const selectedDate = scheduledAt
		? (() => {
				const [y, m, d] = scheduledAt.slice(0, 10).split("-").map(Number);
				return new Date(y, m - 1, d);
			})()
		: undefined;
	const [selectedTime, setSelectedTime] = useState<string>(
		scheduledAt ? scheduledAt.slice(11, 16) : "12:00",
	);

	// Update time when scheduledAt changes externally
	useEffect(() => {
		if (scheduledAt) {
			setSelectedTime(scheduledAt.slice(11, 16));
		}
	}, [scheduledAt]);

	const handleDateSelect = (date: Date | undefined) => {
		if (!date) return;
		// The calendar returns a Date whose browser-local Y/M/D is the picked
		// day. Read those components directly and pair with the chosen time —
		// no tz arithmetic, since `scheduledAt` is a wall-clock string.
		setScheduledAt(
			buildTzLocalInput(
				date.getFullYear(),
				date.getMonth() + 1,
				date.getDate(),
				selectedTime,
			),
		);
	};

	const handleTimeChange = (time: string) => {
		setSelectedTime(time);
		if (selectedDate) {
			setScheduledAt(
				buildTzLocalInput(
					selectedDate.getFullYear(),
					selectedDate.getMonth() + 1,
					selectedDate.getDate(),
					time,
				),
			);
		}
	};

	const preview = scheduledAt
		? formatTzLocalInputForDisplay(scheduledAt, timezone)
		: "Schedule";

	// Calculate min date (today in the user's tz, can't select past dates).
	// The calendar compares its picked Date against this via browser-local
	// Y/M/D, so we build `minDate` with the user's tz Y/M/D at browser
	// midnight — keeps the gate aligned with what "today" means for them.
	const minDate = (() => {
		const parts = new Intl.DateTimeFormat("en-CA", {
			timeZone: timezone,
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
		}).formatToParts(new Date());
		const get = (t: string) => Number(parts.find((p) => p.type === t)!.value);
		return new Date(get("year"), get("month") - 1, get("day"));
	})();

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger
				render={
					<button
						type="button"
						className={cn(
							"inline-flex items-center gap-1.5 h-10 px-4 rounded-full border text-[13px] font-medium transition-colors",
							scheduledAt
								? "bg-peach-100 border-ink/20 text-ink"
								: "bg-background-elev border-border-strong text-ink hover:border-ink",
						)}
					>
						<CalendarClock className="w-4 h-4" />
						{preview}
					</button>
				}
			/>
			<PopoverContent
				align="center"
				sideOffset={8}
				className="w-[360px] p-5"
			>
				<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
					Schedule
				</p>
				<p className="mt-1 text-[12.5px] text-ink/60 leading-normal">
					Your timezone: <span className="text-ink">{timezone}</span>
				</p>

				{hint ? (
					<p className="mt-3 flex items-start gap-1.5 rounded-xl border border-border bg-peach-100/60 px-3 py-2 text-[12px] text-ink/75 leading-[1.45]">
						<AlertCircle className="w-3.5 h-3.5 mt-[2px] text-primary shrink-0" />
						<span>{hint}</span>
					</p>
				) : null}

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
			</PopoverContent>
		</Popover>
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
