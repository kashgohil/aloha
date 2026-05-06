"use client";

import { bulkDeletePosts } from "@/app/actions/posts";
import { ChannelIcons } from "@/components/channel-chip";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Label } from "@/components/ui/label";
import { previewContent } from "@/lib/post-preview";
import { cn } from "@/lib/utils";
import {
	AlertCircle,
	CheckCircle2,
	Clock,
	FileText,
	Trash2,
	X,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
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

const STATUS_META: Record<
	string,
	{
		label: string;
		icon: React.ComponentType<{ className?: string }>;
		badgeClass: string;
	}
> = {
	draft: { label: "Draft", icon: FileText, badgeClass: "bg-muted text-ink/70" },
	in_review: {
		label: "In review",
		icon: Clock,
		badgeClass: "bg-amber-100 text-amber-900",
	},
	approved: {
		label: "Approved",
		icon: CheckCircle2,
		badgeClass: "bg-emerald-100 text-emerald-900",
	},
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
	canDelete,
}: {
	rows: Row[];
	tz: string;
	filter: string;
	canDelete: boolean;
}) {
	const [selected, setSelected] = useState<Set<string>>(new Set());
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [isPending, startTransition] = useTransition();

	console.log({ rows });

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
				<Label
					htmlFor="posts-list-select-all"
					className="inline-flex cursor-pointer gap-2 text-[12px] font-normal text-ink/60 select-none"
				>
					<Checkbox
						id="posts-list-select-all"
						checked={allSelected}
						indeterminate={someSelected}
						onCheckedChange={(checked) =>
							setSelected(checked ? new Set(rowIds) : new Set())
						}
						className="border-border-strong"
					/>
					{selected.size > 0 ? (
						<span className="text-ink font-medium">
							{selected.size} selected
						</span>
					) : (
						<span>Select all</span>
					)}
				</Label>
				{selected.size > 0 && (
					<div className="flex items-center gap-2 ml-auto">
						<Button
							type="button"
							variant="ghost"
							onClick={() => setSelected(new Set())}
						>
							<X />
							Clear
						</Button>
						{canDelete ? (
							<Button
								type="button"
								variant="destructive"
								onClick={() => setConfirmOpen(true)}
							>
								<Trash2 />
								{mode === "permanent" ? "Delete permanently" : "Delete"}
							</Button>
						) : null}
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
							className={cn("relative group", isSelected && "bg-peach-100/40")}
						>
							<Link
								href={
									p.status === "draft"
										? `?compose=${p.id}`
										: `/app/posts/${p.id}`
								}
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
									<p className="text-[14.5px] text-ink leading-normal line-clamp-2">
										{previewContent(p)}
									</p>
									<div className="mt-2 flex flex-wrap items-center gap-1.5">
										<ChannelIcons
											channels={p.platforms}
											size="md"
											visible={4}
										/>
									</div>
								</div>
							</Link>

							{/* Checkbox — sibling of Link so clicks don't navigate. */}
							<Label
								htmlFor={`posts-list-row-${p.id}`}
								className="absolute left-4 top-1/2 -translate-y-1/2 inline-flex size-6 cursor-pointer items-center justify-center gap-0 p-0 font-normal leading-none"
								onClick={(e) => e.stopPropagation()}
							>
								<Checkbox
									id={`posts-list-row-${p.id}`}
									checked={isSelected}
									onCheckedChange={() => toggle(p.id)}
									aria-label={`Select post ${p.content.slice(0, 40)}`}
									className="border-border-strong"
								/>
							</Label>

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
									canDelete={canDelete}
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
