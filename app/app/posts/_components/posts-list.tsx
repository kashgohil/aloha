"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
	AlertCircle,
	CheckCircle2,
	Clock,
	FileText,
	Trash2,
	X,
} from "lucide-react";
import { toast } from "sonner";
import { bulkDeletePosts } from "@/app/actions/posts";
import { CHANNEL_ICONS, CHANNEL_LABELS } from "@/components/channel-chip";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";
import { PostRowActions } from "./post-row-actions";

type Row = {
	id: string;
	content: string;
	channelContent?: Record<string, { content?: string } | null> | null;
	platforms: string[];
	status: string;
	scheduledAt: Date | null;
	publishedAt: Date | null;
	createdAt: Date;
};

function previewContent(p: Row): string {
	const base = p.content?.trim();
	if (base) return p.content;
	const overrides = p.channelContent ?? {};
	for (const platform of p.platforms) {
		const c = overrides[platform]?.content?.trim();
		if (c) return overrides[platform]!.content!;
	}
	for (const entry of Object.values(overrides)) {
		const c = entry?.content?.trim();
		if (c) return entry!.content!;
	}
	return "";
}

const STATUS_META: Record<
	string,
	{
		label: string;
		icon: React.ComponentType<{ className?: string }>;
		badgeClass: string;
	}
> = {
	draft: { label: "Draft", icon: FileText, badgeClass: "bg-muted text-ink/70" },
	scheduled: {
		label: "Scheduled",
		icon: Clock,
		badgeClass: "bg-primary-soft text-primary",
	},
	published: {
		label: "Published",
		icon: CheckCircle2,
		badgeClass: "bg-peach-100 text-ink/80",
	},
	failed: {
		label: "Failed",
		icon: AlertCircle,
		badgeClass: "bg-destructive/10 text-destructive",
	},
	deleted: {
		label: "Deleted",
		icon: Trash2,
		badgeClass: "bg-ink/10 text-ink/60",
	},
};

export function PostsList({
	rows,
	tz,
	filter,
}: {
	rows: Row[];
	tz: string;
	filter: string;
}) {
	const [selected, setSelected] = useState<Set<string>>(new Set());
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [isPending, startTransition] = useTransition();

	const mode: "local" | "permanent" =
		filter === "deleted" ? "permanent" : "local";

	const rowIds = useMemo(() => rows.map((r) => r.id), [rows]);
	const allSelected = rowIds.length > 0 && selected.size === rowIds.length;
	const someSelected = selected.size > 0 && !allSelected;

	const toggle = (id: string) => {
		setSelected((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	};

	const toggleAll = () => {
		setSelected(allSelected ? new Set() : new Set(rowIds));
	};

	const onBulkDelete = () => {
		const ids = Array.from(selected);
		if (ids.length === 0) return;
		const toastId = toast.loading(
			mode === "permanent"
				? `Permanently deleting ${ids.length} post${ids.length === 1 ? "" : "s"}…`
				: `Deleting ${ids.length} post${ids.length === 1 ? "" : "s"}…`,
		);
		startTransition(async () => {
			try {
				const result = await bulkDeletePosts(ids, mode);
				toast.success(
					mode === "permanent"
						? `Permanently deleted ${result.count} post${result.count === 1 ? "" : "s"}.`
						: `Moved ${result.count} post${result.count === 1 ? "" : "s"} to deleted.`,
					{ id: toastId },
				);
				setSelected(new Set());
				setConfirmOpen(false);
			} catch (e) {
				const msg = e instanceof Error ? e.message : "Bulk delete failed.";
				toast.error(msg, { id: toastId, duration: 6000 });
				setConfirmOpen(false);
			}
		});
	};

	return (
		<div className="space-y-3">
			{/* Select-all + bulk action bar. Reserves space so the list doesn't
			    jump when selection starts. */}
			<div className="flex items-center gap-3 px-1 h-8">
				<label className="inline-flex items-center gap-2 text-[12px] text-ink/60 cursor-pointer select-none">
					<input
						type="checkbox"
						checked={allSelected}
						ref={(el) => {
							if (el) el.indeterminate = someSelected;
						}}
						onChange={toggleAll}
						className="size-4 rounded border-border-strong accent-ink cursor-pointer"
					/>
					{selected.size > 0 ? (
						<span className="text-ink font-medium">
							{selected.size} selected
						</span>
					) : (
						<span>Select all</span>
					)}
				</label>
				{selected.size > 0 && (
					<div className="flex items-center gap-2 ml-auto">
						<button
							type="button"
							onClick={() => setSelected(new Set())}
							className="inline-flex items-center gap-1 h-8 px-3 rounded-full text-[12px] text-ink/60 hover:text-ink transition-colors"
						>
							<X className="w-3.5 h-3.5" />
							Clear
						</button>
						<button
							type="button"
							onClick={() => setConfirmOpen(true)}
							className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full bg-destructive text-white text-[12px] font-medium hover:bg-destructive/90 transition-colors"
						>
							<Trash2 className="w-3.5 h-3.5" />
							{mode === "permanent" ? "Delete permanently" : "Delete"}
						</button>
					</div>
				)}
			</div>

			<ul className="rounded-2xl border border-border bg-background-elev divide-y divide-border overflow-hidden">
				{rows.map((p) => {
					const meta = STATUS_META[p.status];
					const Icon = meta?.icon ?? FileText;
					const ts = p.publishedAt ?? p.scheduledAt ?? p.createdAt;
					const isSelected = selected.has(p.id);

					return (
						<li
							key={p.id}
							className={cn(
								"relative group",
								isSelected && "bg-peach-100/40",
							)}
						>
							<Link
								href={`/app/composer?post=${p.id}`}
								prefetch={false}
								className="flex items-start gap-4 pl-12 pr-14 py-4 hover:bg-muted/40 transition-colors"
							>
								<div className="w-[100px] shrink-0 space-y-1.5">
									<span
										className={cn(
											"inline-flex items-center gap-1 h-6 px-2.5 rounded-full text-[11px] font-medium",
											meta?.badgeClass ?? "bg-muted text-ink/70",
										)}
									>
										<Icon className="w-3 h-3" />
										{meta?.label ?? p.status}
									</span>
									<p className="text-[12px] text-ink/55 leading-[1.4]">
										{formatDate(ts, tz)}
									</p>
								</div>
								<div className="flex-1 min-w-0">
									<p className="text-[14.5px] text-ink leading-[1.5] line-clamp-2">
										{previewContent(p)}
									</p>
									<div className="mt-2 flex flex-wrap items-center gap-1.5">
										{p.platforms.map((pl) => {
											const ChannelIcon = CHANNEL_ICONS[pl];
											return (
												<span
													key={pl}
													title={CHANNEL_LABELS[pl] ?? pl}
													aria-label={CHANNEL_LABELS[pl] ?? pl}
													className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-peach-100 border border-border text-ink/75"
												>
													{ChannelIcon ? (
														<ChannelIcon className="w-3 h-3" />
													) : (
														<span className="text-[10px]">
															{(CHANNEL_LABELS[pl] ?? pl).slice(0, 1)}
														</span>
													)}
												</span>
											);
										})}
									</div>
								</div>
							</Link>

							{/* Checkbox — sibling of Link so clicks don't navigate. */}
							<label
								className="absolute left-4 top-1/2 -translate-y-1/2 inline-flex items-center justify-center size-6 cursor-pointer"
								onClick={(e) => e.stopPropagation()}
							>
								<input
									type="checkbox"
									checked={isSelected}
									onChange={() => toggle(p.id)}
									aria-label={`Select post ${p.content.slice(0, 40)}`}
									className="size-4 rounded border-border-strong accent-ink cursor-pointer"
								/>
							</label>

							<div className="absolute inset-y-0 right-4 flex items-center">
								<PostRowActions
									postId={p.id}
									status={
										p.status as
											| "draft"
											| "scheduled"
											| "published"
											| "failed"
											| "deleted"
									}
									platforms={p.platforms}
								/>
							</div>
						</li>
					);
				})}
			</ul>

			<ConfirmDialog
				isOpen={confirmOpen}
				onClose={() => {
					if (!isPending) setConfirmOpen(false);
				}}
				onConfirm={onBulkDelete}
				title={
					mode === "permanent"
						? `Delete ${selected.size} post${selected.size === 1 ? "" : "s"} permanently?`
						: `Delete ${selected.size} post${selected.size === 1 ? "" : "s"}?`
				}
				description={
					mode === "permanent"
						? "These posts will be immediately and permanently removed from Aloha. This action cannot be undone."
						: "Posts move to deleted and will be permanently removed after 30 days. Live copies on connected platforms are not touched."
				}
				confirmText={
					isPending
						? "Deleting…"
						: mode === "permanent"
							? "Delete permanently"
							: "Delete"
				}
				variant="destructive"
			/>
		</div>
	);
}

function formatDate(date: Date, tz: string) {
	return new Intl.DateTimeFormat("en-US", {
		month: "short",
		day: "numeric",
		hour: "numeric",
		minute: "2-digit",
		timeZone: tz,
	}).format(date);
}
