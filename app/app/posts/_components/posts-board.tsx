"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
	DndContext,
	type DragEndEvent,
	DragOverlay,
	type DragStartEvent,
	PointerSensor,
	useDraggable,
	useDroppable,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
// (icons no longer needed in column headers — using a colored dot instead)
import { toast } from "sonner";
import {
	approvePost,
	backToDraft,
	publishPostNow,
	submitForReview,
} from "@/app/actions/posts";
import {
	canTransition,
	type PostStatus,
} from "@/lib/posts/transitions";
import type { WorkspaceRole } from "@/lib/current-context";
import { ImageIcon } from "lucide-react";
import { CHANNEL_ICONS, CHANNEL_LABELS } from "@/components/channel-chip";
import { previewContent } from "@/lib/post-preview";
import type { PostMedia } from "@/db/schema";
import { cn } from "@/lib/utils";

type Row = {
	id: string;
	content: string;
	channelContent?: Record<string, { content?: string } | null> | null;
	platforms: string[];
	media?: PostMedia[] | null;
	status: string;
	scheduledAt: Date | null;
	publishedAt: Date | null;
	createdAt: Date;
};

const COLUMNS: {
	key: PostStatus;
	label: string;
	dot: string;
}[] = [
	{ key: "draft", label: "Draft", dot: "bg-border-strong" },
	{ key: "in_review", label: "In review", dot: "bg-peach-300" },
	{ key: "approved", label: "Approved", dot: "bg-primary" },
	{ key: "scheduled", label: "Scheduled", dot: "bg-peach-400" },
	{ key: "published", label: "Published", dot: "bg-ink" },
	{ key: "failed", label: "Failed", dot: "bg-destructive" },
];

export function PostsBoard({
	rows,
	tz,
	workspaceRole,
}: {
	rows: Row[];
	tz: string;
	workspaceRole: WorkspaceRole;
}) {
	const router = useRouter();
	const [optimistic, setOptimistic] = useState<Row[]>(rows);
	const [, startTransition] = useTransition();
	const [draggingId, setDraggingId] = useState<string | null>(null);

	// Keep local state in sync if the server-rendered rows change between
	// renders (e.g., after revalidatePath).
	useMemo(() => setOptimistic(rows), [rows]);

	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
	);

	const grouped = useMemo(() => {
		const map = new Map<PostStatus, Row[]>();
		for (const col of COLUMNS) map.set(col.key, []);
		for (const row of optimistic) {
			const list = map.get(row.status as PostStatus);
			if (list) list.push(row);
		}
		return map;
	}, [optimistic]);

	const draggingRow = draggingId
		? optimistic.find((r) => r.id === draggingId) ?? null
		: null;

	const applyTransition = async (
		row: Row,
		target: PostStatus,
	): Promise<void> => {
		const from = row.status as PostStatus;
		// Schedule transitions need a time picker — route user to composer
		// instead. Keeping this slice free of inline date pickers.
		if (target === "scheduled") {
			toast.info("Open the post to pick a schedule time.");
			router.push(`/app/composer?post=${row.id}`);
			return;
		}

		let action: () => Promise<unknown>;
		let label: string;
		if (target === "in_review") {
			action = () => submitForReview(row.id);
			label = "Submitted for review.";
		} else if (target === "approved") {
			action = () => approvePost(row.id);
			label = "Approved.";
		} else if (target === "published") {
			action = () => publishPostNow(row.id);
			label = "Publishing…";
		} else if (target === "draft") {
			action = () => backToDraft(row.id);
			label = "Moved back to draft.";
		} else {
			return;
		}

		// Optimistic update — revert on failure.
		setOptimistic((prev) =>
			prev.map((r) => (r.id === row.id ? { ...r, status: target } : r)),
		);
		const toastId = toast.loading("Updating…");
		try {
			await action();
			toast.success(label, { id: toastId });
			router.refresh();
		} catch (err) {
			setOptimistic((prev) =>
				prev.map((r) => (r.id === row.id ? { ...r, status: from } : r)),
			);
			toast.error(err instanceof Error ? err.message : "Couldn't move.", {
				id: toastId,
			});
		}
	};

	const handleDragStart = (event: DragStartEvent) => {
		setDraggingId(String(event.active.id));
	};

	const handleDragEnd = (event: DragEndEvent) => {
		setDraggingId(null);
		const { active, over } = event;
		if (!over) return;
		const row = optimistic.find((r) => r.id === String(active.id));
		if (!row) return;
		const target = String(over.id) as PostStatus;
		if (row.status === target) return;
		if (!canTransition(row.status as PostStatus, target, workspaceRole)) {
			toast.error(
				`Can't move from ${row.status.replace("_", " ")} to ${target.replace(
					"_",
					" ",
				)}.`,
			);
			return;
		}
		startTransition(() => {
			void applyTransition(row, target);
		});
	};

	return (
		<DndContext
			sensors={sensors}
			onDragStart={handleDragStart}
			onDragEnd={handleDragEnd}
			onDragCancel={() => setDraggingId(null)}
		>
			<div className="overflow-x-auto -mx-4 px-4 pb-2 h-full min-h-[360px]">
				<div className="flex gap-3 min-w-max h-full">
					{COLUMNS.map((col) => (
						<div key={col.key} className="w-[320px] shrink-0 h-full">
							<BoardColumn
								column={col}
								rows={grouped.get(col.key) ?? []}
								tz={tz}
								workspaceRole={workspaceRole}
								draggingRowStatus={
									draggingRow ? (draggingRow.status as PostStatus) : null
								}
							/>
						</div>
					))}
				</div>
			</div>

			<DragOverlay>
				{draggingRow ? <CardPreview row={draggingRow} tz={tz} overlay /> : null}
			</DragOverlay>
		</DndContext>
	);
}

function BoardColumn({
	column,
	rows,
	tz,
	workspaceRole,
	draggingRowStatus,
}: {
	column: (typeof COLUMNS)[number];
	rows: Row[];
	tz: string;
	workspaceRole: WorkspaceRole;
	draggingRowStatus: PostStatus | null;
}) {
	const { isOver, setNodeRef } = useDroppable({ id: column.key });
	const isValidDropTarget =
		draggingRowStatus !== null &&
		draggingRowStatus !== column.key &&
		canTransition(draggingRowStatus, column.key, workspaceRole);

	return (
		<div
			ref={setNodeRef}
			className={cn(
				"flex flex-col h-full rounded-xl border bg-background-elev transition-colors",
				isOver && isValidDropTarget
					? "border-ink"
					: draggingRowStatus && !isValidDropTarget
						? "border-border opacity-60"
						: "border-border",
			)}
		>
			<div className="flex items-center gap-2 px-3.5 py-2.5">
				<span
					className={cn("h-2 w-2 rounded-full shrink-0", column.dot)}
					aria-hidden
				/>
				<span className="text-[12.5px] font-medium text-ink">
					{column.label}
				</span>
				<span className="ml-auto text-[11px] text-ink/45 tabular-nums">
					{rows.length}
				</span>
			</div>
			<div className="flex-1 min-h-0 p-2 pt-0 space-y-2 overflow-y-auto">
				{rows.length === 0 ? (
					<p className="text-[11.5px] text-ink/40 text-center py-6">
						Empty
					</p>
				) : (
					rows.map((row) => <DraggableCard key={row.id} row={row} tz={tz} />)
				)}
			</div>
		</div>
	);
}

function DraggableCard({ row, tz }: { row: Row; tz: string }) {
	const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
		id: row.id,
	});
	return (
		<div
			ref={setNodeRef}
			{...attributes}
			{...listeners}
			className={cn(
				"cursor-grab active:cursor-grabbing",
				isDragging ? "opacity-30" : "",
			)}
		>
			<CardPreview row={row} tz={tz} />
		</div>
	);
}

function CardPreview({
	row,
	tz,
	overlay = false,
}: {
	row: Row;
	tz: string;
	overlay?: boolean;
}) {
	const text = previewContent(row);
	const visible = row.platforms.slice(0, 4);
	const overflow = Math.max(0, row.platforms.length - visible.length);

	const media = row.media ?? [];
	const firstImage = media.find((m) => m.mimeType?.startsWith("image/"));

	return (
		<Link
			href={`/app/posts/${row.id}`}
			onClick={(e) => {
				// Suppress navigation when the event is part of an in-progress
				// drag — dnd-kit fires click at the end of a short drag and we
				// don't want to bounce the user into the detail page.
				if (overlay) e.preventDefault();
			}}
			className={cn(
				"group block rounded-xl border border-border bg-background overflow-hidden transition-all",
				overlay
					? "rotate-[-1.5deg] shadow-[0_18px_36px_-14px_rgba(26,22,18,0.45)]"
					: "shadow-[0_1px_2px_rgba(26,22,18,0.04)] hover:border-border-strong hover:shadow-[0_8px_22px_-12px_rgba(26,22,18,0.18)] hover:-translate-y-0.5",
			)}
		>
			<div className="px-3.5 pt-3 pb-3 space-y-2.5">
				<div className="flex items-center justify-between gap-2">
					{visible.length > 0 ? (
						<div className="flex items-center -space-x-1.5">
							{visible.map((p) => {
								const Icon = CHANNEL_ICONS[p];
								return (
									<span
										key={p}
										aria-label={CHANNEL_LABELS[p] ?? p}
										className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-background-elev border border-border ring-1 ring-background"
									>
										{Icon ? (
											<Icon className="w-2.5 h-2.5 text-ink/70" />
										) : null}
									</span>
								);
							})}
							{overflow > 0 ? (
								<span className="inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-muted border border-border ring-1 ring-background text-[9.5px] font-medium text-ink/65 tabular-nums">
									+{overflow}
								</span>
							) : null}
						</div>
					) : (
						<span className="text-[10.5px] text-ink/45">No channel</span>
					)}
					<span className="text-[10.5px] text-ink/55 tabular-nums">
						{timestampLabel(row, tz)}
					</span>
				</div>

				{text ? (
					<p className="text-[13px] text-ink leading-[1.45] line-clamp-3 whitespace-pre-wrap break-words">
						{text}
					</p>
				) : (
					<p className="text-[12.5px] italic text-ink/40">Empty draft</p>
				)}

				{firstImage ? (
					<div className="relative h-24 rounded-lg overflow-hidden border border-border bg-muted">
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img
							src={firstImage.url}
							alt={firstImage.alt ?? ""}
							className="w-full h-full object-cover"
							referrerPolicy="no-referrer"
						/>
						{media.length > 1 ? (
							<span className="absolute bottom-1.5 right-1.5 inline-flex items-center gap-1 h-5 px-1.5 rounded-full bg-ink/75 text-background text-[10px] font-medium">
								<ImageIcon className="w-2.5 h-2.5" />
								+{media.length - 1}
							</span>
						) : null}
					</div>
				) : null}
			</div>
		</Link>
	);
}

function timestampLabel(row: Row, tz: string): string {
	const fmt = (d: Date) =>
		new Intl.DateTimeFormat("en-US", {
			month: "short",
			day: "numeric",
			hour: "numeric",
			minute: "2-digit",
			timeZone: tz,
		}).format(d);
	if (row.status === "published" && row.publishedAt) return fmt(row.publishedAt);
	if (row.status === "scheduled" && row.scheduledAt) return fmt(row.scheduledAt);
	return fmt(row.createdAt);
}

