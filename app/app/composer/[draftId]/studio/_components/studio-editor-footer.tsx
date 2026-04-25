"use client";

import {
	AlertCircle,
	Hash,
	ImageUp,
	Loader2,
	Sparkles,
	X as XIcon,
} from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { refineContent, suggestHashtags } from "@/app/actions/ai";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import type { PostMedia } from "@/db/schema";
import { cn } from "@/lib/utils";

// Compose-style "first footer" for the Studio editor: char counter on the
// left, then attach / refine / suggest-hashtags icon buttons. Mirrors
// composer.tsx so the two surfaces feel like one product.

export function StudioEditorFooter({
	channel,
	channelName,
	text,
	media,
	maxChars,
	maxMedia,
	onTextChange,
	onMediaChange,
	disabled,
}: {
	channel: string;
	channelName: string;
	text: string;
	media: PostMedia[];
	maxChars: number;
	maxMedia: number;
	onTextChange: (text: string) => void;
	onMediaChange: (media: PostMedia[]) => void;
	disabled?: boolean;
}) {
	const fileInputRef = useRef<HTMLInputElement | null>(null);
	const [isUploading, setIsUploading] = useState(false);
	const [isRefining, startRefining] = useTransition();
	const [isHashing, startHashing] = useTransition();
	const [hashSuggestions, setHashSuggestions] = useState<string[]>([]);

	const handleFiles = async (files: FileList | null) => {
		if (!files || files.length === 0) return;
		const remaining = maxMedia - media.length;
		const toUpload = Array.from(files).slice(0, remaining);
		if (toUpload.length === 0) {
			toast.error(`You can attach up to ${maxMedia} files.`);
			return;
		}
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
			onMediaChange([...media, ...uploaded]);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Upload failed.");
		} finally {
			setIsUploading(false);
			if (fileInputRef.current) fileInputRef.current.value = "";
		}
	};

	const handleRefine = () => {
		if (!text.trim()) return;
		startRefining(async () => {
			try {
				const refined = await refineContent(text, channel);
				onTextChange(refined);
			} catch (err) {
				toast.error(
					err instanceof Error
						? err.message
						: "Refine failed. Try again in a moment.",
				);
			}
		});
	};

	const handleSuggestHashtags = () => {
		if (!text.trim()) return;
		startHashing(async () => {
			try {
				const tags = await suggestHashtags(text, channel);
				setHashSuggestions(tags);
				if (tags.length === 0) {
					toast.message("No hashtag suggestions for this post.");
				}
			} catch (err) {
				toast.error(
					err instanceof Error
						? err.message
						: "Hashtag suggest failed. Try again in a moment.",
				);
			}
		});
	};

	const appendHashtag = (tag: string) => {
		if (text.includes(tag)) {
			setHashSuggestions((prev) => prev.filter((t) => t !== tag));
			return;
		}
		const next =
			text.trimEnd().length === 0
				? tag
				: /\s$/.test(text)
					? `${text}${tag}`
					: `${text} ${tag}`;
		onTextChange(next);
		setHashSuggestions((prev) => prev.filter((t) => t !== tag));
	};

	if (disabled) return null;

	return (
		<div className="border-t border-border bg-background-elev/80">
			{hashSuggestions.length > 0 ? (
				<div className="max-w-[1320px] mx-auto px-6 lg:px-10 py-2 border-b border-border flex flex-wrap items-center gap-1.5">
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
				<div className="max-w-[1320px] mx-auto px-6 lg:px-10 flex flex-wrap items-center gap-1 py-2">
					<div className="pl-2 pr-3 shrink-0">
						<CharCounter
							length={text.length}
							limit={maxChars}
							channelName={channelName}
						/>
					</div>
					<ToolDivider />
					<input
						ref={fileInputRef}
						type="file"
						accept="image/jpeg,image/png,image/webp,image/gif,video/mp4"
						multiple
						hidden
						onChange={(e) => handleFiles(e.target.files)}
					/>
					{maxMedia > 0 ? (
						<ToolButton
							onClick={() => fileInputRef.current?.click()}
							disabled={isUploading || media.length >= maxMedia}
							label={
								media.length >= maxMedia
									? `Up to ${maxMedia} attachments`
									: "Attach media"
							}
							icon={
								isUploading ? (
									<Loader2 className="w-4 h-4 animate-spin" />
								) : (
									<ImageUp className="w-4 h-4" />
								)
							}
						/>
					) : null}
					<ToolDivider />
					<ToolButton
						onClick={handleRefine}
						disabled={isRefining || !text.trim()}
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
						disabled={isHashing || !text.trim()}
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
	);
}

function CharCounter({
	length,
	limit,
	channelName,
}: {
	length: number;
	limit: number;
	channelName: string;
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
			{over ? (
				<span className="inline-flex items-center gap-1 text-[11px] font-medium text-primary-deep">
					<AlertCircle className="w-3 h-3" />
					Too long for {channelName}
				</span>
			) : null}
		</div>
	);
}

function ToolButton({
	icon,
	label,
	onClick,
	disabled,
}: {
	icon: React.ReactNode;
	label: string;
	onClick: () => void;
	disabled?: boolean;
}) {
	const button = (
		<button
			type="button"
			onClick={onClick}
			disabled={disabled}
			aria-label={label}
			className={cn(
				"inline-flex items-center justify-center w-9 h-9 rounded-full transition-colors shrink-0",
				"text-ink/60 hover:text-ink hover:bg-muted/60",
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
