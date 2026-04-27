"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, MessageSquare, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import {
	addNote,
	deleteNote,
	editNote,
	type PostNote,
	type PostNoteMention,
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
	members?: PostNoteMention[];
};

function extractMentions(
	body: string,
	members: PostNoteMention[],
): string[] {
	if (members.length === 0) return [];
	const byFirstName = new Map<string, string>();
	for (const m of members) {
		if (!m.name) continue;
		const first = m.name.trim().split(/\s+/)[0]?.toLowerCase();
		if (first && !byFirstName.has(first)) byFirstName.set(first, m.userId);
	}
	const matches = new Set<string>();
	const re = /@([A-Za-z][A-Za-z0-9_-]*)/g;
	let m: RegExpExecArray | null;
	while ((m = re.exec(body)) !== null) {
		const id = byFirstName.get(m[1].toLowerCase());
		if (id) matches.add(id);
	}
	return Array.from(matches);
}

function renderBody(body: string, mentions: PostNoteMention[]): React.ReactNode {
	if (mentions.length === 0) return body;
	const byFirstName = new Map<string, PostNoteMention>();
	for (const m of mentions) {
		if (!m.name) continue;
		const first = m.name.trim().split(/\s+/)[0]?.toLowerCase();
		if (first) byFirstName.set(first, m);
	}
	const parts: React.ReactNode[] = [];
	const re = /@([A-Za-z][A-Za-z0-9_-]*)/g;
	let lastIndex = 0;
	let m: RegExpExecArray | null;
	let key = 0;
	while ((m = re.exec(body)) !== null) {
		if (m.index > lastIndex) parts.push(body.slice(lastIndex, m.index));
		const matched = byFirstName.get(m[1].toLowerCase());
		if (matched) {
			parts.push(
				<span
					key={`m${key++}`}
					className="inline-flex items-center px-1 rounded bg-peach-100 text-ink font-medium"
				>
					@{matched.name?.split(/\s+/)[0] ?? m[1]}
				</span>,
			);
		} else {
			parts.push(m[0]);
		}
		lastIndex = m.index + m[0].length;
	}
	if (lastIndex < body.length) parts.push(body.slice(lastIndex));
	return parts;
}

function insertReply(
	notes: PostNote[],
	parentId: string,
	reply: PostNote,
): PostNote[] {
	return notes.map((note) => {
		if (note.id === parentId) {
			return { ...note, replies: [...note.replies, reply] };
		}
		if (note.replies.length > 0) {
			return { ...note, replies: insertReply(note.replies, parentId, reply) };
		}
		return note;
	});
}

export function PostNotes({ postId, initialNotes, members = [] }: Props) {
	const [notes, setNotes] = useState<PostNote[]>(initialNotes);
	const [body, setBody] = useState("");
	const [replyingToId, setReplyingToId] = useState<string | null>(null);
	const [replyBody, setReplyBody] = useState("");
	const [editingId, setEditingId] = useState<string | null>(null);
	const [draft, setDraft] = useState("");
	const [isPending, startTransition] = useTransition();

	const handleAdd = () => {
		const trimmed = body.trim();
		if (!trimmed || isPending) return;
		const mentionIds = extractMentions(trimmed, members);
		const resolvedMentions = members.filter((m) =>
			mentionIds.includes(m.userId),
		);
		const toastId = toast.loading("Posting…");
		startTransition(async () => {
			try {
				const row = await addNote(postId, trimmed, mentionIds);
				const newNote: PostNote = {
					id: row.id,
					postId: row.postId,
					authorUserId: row.authorUserId,
					authorName: null,
					authorImage: null,
					body: row.body,
					mentions: resolvedMentions,
					createdAt: row.createdAt,
					updatedAt: row.updatedAt,
					editedAt: row.editedAt,
					isMine: true,
					parentNoteId: row.parentNoteId ?? null,
					replies: [],
				};
				setNotes((prev) => [...prev, newNote]);
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

	const handleReply = (parentNote: PostNote) => {
		const trimmed = replyBody.trim();
		if (!trimmed || isPending) return;
		const mentionIds = extractMentions(trimmed, members);
		const resolvedMentions = members.filter((m) =>
			mentionIds.includes(m.userId),
		);
		const toastId = toast.loading("Posting…");
		startTransition(async () => {
			try {
				const row = await addNote(postId, trimmed, mentionIds, parentNote.id);
				const newReply: PostNote = {
					id: row.id,
					postId: row.postId,
					authorUserId: row.authorUserId,
					authorName: null,
					authorImage: null,
					body: row.body,
					mentions: resolvedMentions,
					createdAt: row.createdAt,
					updatedAt: row.updatedAt,
					editedAt: row.editedAt,
					isMine: true,
					parentNoteId: row.parentNoteId ?? null,
					replies: [],
				};
				setNotes((prev) => insertReply(prev, parentNote.id, newReply));
				setReplyingToId(null);
				setReplyBody("");
				toast.success("Reply posted.", { id: toastId });
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

	const cancelReply = () => {
		setReplyingToId(null);
		setReplyBody("");
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
						<NoteItem
							key={note.id}
							note={note}
							isPending={isPending}
							editingId={editingId}
							draft={draft}
							replyingToId={replyingToId}
							replyBody={replyBody}
							onBodyChange={setBody}
							onReplyBodyChange={setReplyBody}
							onReply={handleReply}
							onStartReply={() => setReplyingToId(note.id)}
							onCancelReply={cancelReply}
							onStartEdit={startEdit}
							onEdit={handleEdit}
							onDelete={handleDelete}
							onDraftChange={setDraft}
							onCancelEdit={cancelEdit}
							members={members}
						/>
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

function NoteItem({
	note,
	isPending,
	editingId,
	draft,
	replyingToId,
	replyBody,
	onBodyChange,
	onReplyBodyChange,
	onReply,
	onStartReply,
	onCancelReply,
	onStartEdit,
	onEdit,
	onDelete,
	onDraftChange,
	onCancelEdit,
	members,
}: {
	note: PostNote;
	isPending: boolean;
	editingId: string | null;
	draft: string;
	replyingToId: string | null;
	replyBody: string;
	onBodyChange: (v: string) => void;
	onReplyBodyChange: (v: string) => void;
	onReply: (parent: PostNote) => void;
	onStartReply: () => void;
	onCancelReply: () => void;
	onStartEdit: (n: PostNote) => void;
	onEdit: (id: string) => void;
	onDelete: (id: string) => void;
	onDraftChange: (v: string) => void;
	onCancelEdit: () => void;
	members: PostNoteMention[];
}) {
	const isEditing = editingId === note.id;
	const isReplying = replyingToId === note.id;

	return (
		<li className="rounded-xl border border-border bg-background px-4 py-3">
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
				<div className="flex items-center gap-1">
					<button
						type="button"
						onClick={onStartReply}
						className="p-1.5 rounded-full text-ink/50 hover:text-ink hover:bg-background-elev transition-colors"
						aria-label="Reply"
					>
						<MessageSquare className="w-4 h-4" />
					</button>
					{note.isMine ? (
						<NoteMenu
							onEdit={() => onStartEdit(note)}
							onDelete={() => onDelete(note.id)}
						/>
					) : null}
				</div>
			</div>

			{isEditing ? (
				<div className="mt-3 space-y-2">
					<textarea
						value={draft}
						onChange={(e) => onDraftChange(e.target.value)}
						rows={3}
						className="w-full rounded-lg border border-border bg-background-elev px-3 py-2 text-[13px] text-ink focus:outline-none focus:border-ink/40"
					/>
					<div className="flex items-center justify-end gap-2">
						<button
							type="button"
							onClick={onCancelEdit}
							disabled={isPending}
							className="h-8 px-3 rounded-full text-[12px] text-ink/65 hover:text-ink transition-colors"
						>
							Cancel
						</button>
						<button
							type="button"
							onClick={() => onEdit(note.id)}
							disabled={isPending || !draft.trim()}
							className="h-8 px-3 rounded-full bg-ink text-background text-[12px] font-medium disabled:opacity-40 transition-colors"
						>
							Save
						</button>
					</div>
				</div>
			) : (
				<p className="mt-2 text-[13px] text-ink whitespace-pre-wrap leading-relaxed">
					{renderBody(note.body, note.mentions)}
				</p>
			)}

			{isReplying && (
				<div className="mt-3 space-y-2">
					<textarea
						value={replyBody}
						onChange={(e) => onReplyBodyChange(e.target.value)}
						placeholder={`Reply to ${note.authorName ?? "someone"}…`}
						rows={2}
						className="w-full rounded-lg border border-border bg-background-elev px-3 py-2 text-[13px] text-ink focus:outline-none focus:border-ink/40"
					/>
					<div className="flex items-center justify-end gap-2">
						<button
							type="button"
							onClick={onCancelReply}
							disabled={isPending}
							className="h-8 px-3 rounded-full text-[12px] text-ink/65 hover:text-ink transition-colors"
						>
							Cancel
						</button>
						<button
							type="button"
							onClick={() => onReply(note)}
							disabled={isPending || !replyBody.trim()}
							className="h-8 px-3 rounded-full bg-ink text-background text-[12px] font-medium disabled:opacity-40 transition-colors"
						>
							Reply
						</button>
					</div>
				</div>
			)}

			{note.replies.length > 0 && (
				<ul className="mt-4 space-y-3 pl-5 border-l border-border">
					{note.replies.map((reply) => (
						<NoteItem
							key={reply.id}
							note={reply}
							isPending={isPending}
							editingId={editingId}
							draft={draft}
							replyingToId={replyingToId}
							replyBody={replyBody}
							onBodyChange={onBodyChange}
							onReplyBodyChange={onReplyBodyChange}
							onReply={onReply}
							onStartReply={() => onStartReply()}
							onCancelReply={onCancelReply}
							onStartEdit={onStartEdit}
							onEdit={onEdit}
							onDelete={onDelete}
							onDraftChange={onDraftChange}
							onCancelEdit={onCancelEdit}
							members={members}
						/>
					))}
				</ul>
			)}
		</li>
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