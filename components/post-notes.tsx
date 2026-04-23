"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import {
	addNote,
	deleteNote,
	editNote,
	type PostNote,
} from "@/app/actions/post-notes";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type Props = {
	postId: string;
	initialNotes: PostNote[];
};

export function PostNotes({ postId, initialNotes }: Props) {
	const [notes, setNotes] = useState<PostNote[]>(initialNotes);
	const [body, setBody] = useState("");
	const [editingId, setEditingId] = useState<string | null>(null);
	const [draft, setDraft] = useState("");
	const [isPending, startTransition] = useTransition();

	const handleAdd = () => {
		const trimmed = body.trim();
		if (!trimmed || isPending) return;
		const toastId = toast.loading("Posting…");
		startTransition(async () => {
			try {
				const row = await addNote(postId, trimmed);
				setNotes((prev) => [
					...prev,
					{
						id: row.id,
						postId: row.postId,
						authorUserId: row.authorUserId,
						authorName: null,
						authorImage: null,
						body: row.body,
						createdAt: row.createdAt,
						updatedAt: row.updatedAt,
						editedAt: row.editedAt,
						isMine: true,
					},
				]);
				setBody("");
				toast.success("Comment posted.", { id: toastId });
			} catch (err) {
				toast.error(
					err instanceof Error ? err.message : "Couldn't post.",
					{ id: toastId },
				);
			}
		});
	};

	const startEdit = (note: PostNote) => {
		setEditingId(note.id);
		setDraft(note.body);
	};

	const cancelEdit = () => {
		setEditingId(null);
		setDraft("");
	};

	const handleEdit = (noteId: string) => {
		const trimmed = draft.trim();
		if (!trimmed || isPending) return;
		const toastId = toast.loading("Saving…");
		startTransition(async () => {
			try {
				await editNote(noteId, trimmed);
				const now = new Date();
				setNotes((prev) =>
					prev.map((n) =>
						n.id === noteId
							? { ...n, body: trimmed, editedAt: now, updatedAt: now }
							: n,
					),
				);
				cancelEdit();
				toast.success("Updated.", { id: toastId });
			} catch (err) {
				toast.error(
					err instanceof Error ? err.message : "Couldn't save.",
					{ id: toastId },
				);
			}
		});
	};

	const handleDelete = (noteId: string) => {
		if (isPending) return;
		const toastId = toast.loading("Deleting…");
		startTransition(async () => {
			try {
				await deleteNote(noteId);
				setNotes((prev) => prev.filter((n) => n.id !== noteId));
				toast.success("Deleted.", { id: toastId });
			} catch (err) {
				toast.error(
					err instanceof Error ? err.message : "Couldn't delete.",
					{ id: toastId },
				);
			}
		});
	};

	return (
		<section className="space-y-4">
			<p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/55">
				Comments
			</p>

			{notes.length === 0 ? (
				<p className="text-[13px] text-ink/55">
					No comments yet. Leave a note for reviewers or your future self.
				</p>
			) : (
				<ul className="space-y-3">
					{notes.map((note) => (
						<li
							key={note.id}
							className="rounded-xl border border-border bg-background px-4 py-3"
						>
							<div className="flex items-start justify-between gap-3">
								<div className="flex items-center gap-2 min-w-0">
									<Avatar name={note.authorName} image={note.authorImage} />
									<div className="min-w-0">
										<p className="text-[13px] font-medium text-ink truncate">
											{note.authorName ?? "Someone"}
										</p>
										<p className="text-[11px] text-ink/55">
											{relativeTime(note.createdAt)}
											{note.editedAt ? " · edited" : ""}
										</p>
									</div>
								</div>
								{note.isMine ? (
									<NoteMenu
										onEdit={() => startEdit(note)}
										onDelete={() => handleDelete(note.id)}
									/>
								) : null}
							</div>

							{editingId === note.id ? (
								<div className="mt-3 space-y-2">
									<textarea
										value={draft}
										onChange={(e) => setDraft(e.target.value)}
										rows={3}
										className="w-full rounded-lg border border-border bg-background-elev px-3 py-2 text-[13px] text-ink focus:outline-none focus:border-ink/40"
									/>
									<div className="flex items-center justify-end gap-2">
										<button
											type="button"
											onClick={cancelEdit}
											disabled={isPending}
											className="h-8 px-3 rounded-full text-[12px] text-ink/65 hover:text-ink transition-colors"
										>
											Cancel
										</button>
										<button
											type="button"
											onClick={() => handleEdit(note.id)}
											disabled={isPending || !draft.trim()}
											className="h-8 px-3 rounded-full bg-ink text-background text-[12px] font-medium disabled:opacity-40 transition-colors"
										>
											Save
										</button>
									</div>
								</div>
							) : (
								<p className="mt-2 text-[13px] text-ink whitespace-pre-wrap leading-relaxed">
									{note.body}
								</p>
							)}
						</li>
					))}
				</ul>
			)}

			<div className="rounded-xl border border-border bg-background-elev p-3 space-y-2">
				<textarea
					value={body}
					onChange={(e) => setBody(e.target.value)}
					placeholder="Add a comment…"
					rows={3}
					className="w-full bg-transparent text-[13px] text-ink placeholder:text-ink/40 focus:outline-none resize-none"
				/>
				<div className="flex items-center justify-end">
					<button
						type="button"
						onClick={handleAdd}
						disabled={isPending || !body.trim()}
						className={cn(
							"inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-ink text-background text-[12px] font-medium",
							"disabled:opacity-40 disabled:cursor-not-allowed",
						)}
					>
						{isPending ? (
							<Loader2 className="w-3.5 h-3.5 animate-spin" />
						) : null}
						Post
					</button>
				</div>
			</div>
		</section>
	);
}

function NoteMenu({
	onEdit,
	onDelete,
}: {
	onEdit: () => void;
	onDelete: () => void;
}) {
	const [open, setOpen] = useState(false);
	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger
				className="p-1 rounded-full text-ink/50 hover:text-ink hover:bg-background-elev transition-colors"
				aria-label="Comment actions"
			>
				<MoreHorizontal className="w-4 h-4" />
			</PopoverTrigger>
			<PopoverContent
				align="end"
				className="w-40 p-1 rounded-xl border border-border bg-background-elev shadow-lg"
			>
				<button
					type="button"
					onClick={() => {
						setOpen(false);
						onEdit();
					}}
					className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] text-ink hover:bg-muted transition-colors"
				>
					<Pencil className="w-3.5 h-3.5" />
					Edit
				</button>
				<button
					type="button"
					onClick={() => {
						setOpen(false);
						onDelete();
					}}
					className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] text-destructive hover:bg-destructive/10 transition-colors"
				>
					<Trash2 className="w-3.5 h-3.5" />
					Delete
				</button>
			</PopoverContent>
		</Popover>
	);
}

function Avatar({
	name,
	image,
}: {
	name: string | null;
	image: string | null;
}) {
	if (image) {
		// eslint-disable-next-line @next/next/no-img-element
		return (
			<img
				src={image}
				alt={name ?? "avatar"}
				className="w-7 h-7 rounded-full object-cover bg-muted"
			/>
		);
	}
	const initial = (name ?? "?").trim().charAt(0).toUpperCase();
	return (
		<div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-[11px] font-medium text-ink/70">
			{initial}
		</div>
	);
}

function relativeTime(date: Date): string {
	const diffMs = Date.now() - new Date(date).getTime();
	const diffSec = Math.round(diffMs / 1000);
	if (diffSec < 45) return "just now";
	const diffMin = Math.round(diffSec / 60);
	if (diffMin < 60) return `${diffMin}m ago`;
	const diffHr = Math.round(diffMin / 60);
	if (diffHr < 24) return `${diffHr}h ago`;
	const diffDay = Math.round(diffHr / 24);
	if (diffDay < 7) return `${diffDay}d ago`;
	return new Date(date).toLocaleDateString();
}
