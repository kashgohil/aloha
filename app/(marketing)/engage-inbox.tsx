"use client";

import { Check, Send } from "lucide-react";
import { useMemo, useState } from "react";

type MsgType = "comment" | "dm" | "mention";
type Tag = "question" | "share" | "love";

type Msg = {
	id: string;
	n: string;
	p: string;
	t: string;
	tag: Tag;
	type: MsgType;
	time: string;
	avatar: string;
};

const MESSAGES: Msg[] = [
	{
		id: "1",
		n: "Ada K.",
		p: "Instagram",
		t: "This completely reframed how I think about launch weeks. Where do I read more?",
		tag: "question",
		type: "comment",
		time: "2h",
		avatar: "bg-peach-100",
	},
	{
		id: "2",
		n: "Jun H.",
		p: "LinkedIn",
		t: "Shared with my team — we're trying the 3-post rule next sprint.",
		tag: "share",
		type: "mention",
		time: "3h",
		avatar: "bg-peach-200",
	},
	{
		id: "3",
		n: "Rosa M.",
		p: "X",
		t: "Wait, how did you get your carousel to loop like that?",
		tag: "question",
		type: "dm",
		time: "4h",
		avatar: "bg-peach-300",
	},
	{
		id: "4",
		n: "Theo B.",
		p: "Threads",
		t: "Best thing I read this morning. ☕",
		tag: "love",
		type: "comment",
		time: "5h",
		avatar: "bg-primary-soft",
	},
	{
		id: "5",
		n: "Priya S.",
		p: "Instagram",
		t: "Any chance you'll share the carousel template? Been chasing this aesthetic for weeks.",
		tag: "question",
		type: "dm",
		time: "6h",
		avatar: "bg-peach-100",
	},
];

type Folder = "All" | "Mentions" | "DMs" | "Comments" | "Needs reply";

function matchFolder(m: Msg, f: Folder, replied: Set<string>) {
	if (f === "All") return true;
	if (f === "Mentions") return m.type === "mention";
	if (f === "DMs") return m.type === "dm";
	if (f === "Comments") return m.type === "comment";
	return m.tag === "question" && !replied.has(m.id);
}

export function EngageInbox() {
	const [folder, setFolder] = useState<Folder>("All");
	const [selected, setSelected] = useState<string>("1");
	const [replied, setReplied] = useState<Set<string>>(new Set());
	const [saved, setSaved] = useState<Set<string>>(new Set());
	const [composingId, setComposingId] = useState<string | null>(null);
	const [draft, setDraft] = useState("");

	const folders: Folder[] = [
		"All",
		"Mentions",
		"DMs",
		"Comments",
		"Needs reply",
	];

	const counts = useMemo(() => {
		const c: Record<Folder, number> = {
			All: 0,
			Mentions: 0,
			DMs: 0,
			Comments: 0,
			"Needs reply": 0,
		};
		for (const f of folders)
			c[f] = MESSAGES.filter((m) => matchFolder(m, f, replied)).length;
		return c;
	}, [replied]);

	const visible = MESSAGES.filter((m) => matchFolder(m, folder, replied));

	function toggleSave(id: string) {
		setSaved((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	}

	function openReply(id: string) {
		setComposingId(id);
		setDraft("");
		setSelected(id);
	}

	function sendReply() {
		if (!composingId) return;
		setReplied((prev) => new Set(prev).add(composingId));
		setComposingId(null);
		setDraft("");
	}

	return (
		<div className="rounded-3xl bg-background-elev border border-ink/10 overflow-hidden">
			{/* Mobile: horizontal scroll tab bar */}
			<div className="sm:hidden border-b border-border bg-muted/50 px-3 py-2 overflow-x-auto">
				<div className="flex items-center gap-1.5 w-max">
					{folders.map((f) => {
						const active = folder === f;
						const accent = f === "Needs reply";
						return (
							<button
								key={f}
								onClick={() => setFolder(f)}
								className={`inline-flex items-center gap-1.5 whitespace-nowrap text-[12.5px] px-2.5 py-1.5 rounded-full transition-colors ${
									active
										? "bg-ink text-background-elev"
										: "text-ink/70 hover:bg-ink/5"
								}`}
							>
								<span>{f}</span>
								<span
									className={`text-[10.5px] font-mono ${
										accent && !active ? "text-primary font-semibold" : "opacity-70"
									}`}
								>
									{counts[f]}
								</span>
							</button>
						);
					})}
				</div>
			</div>

			<div className="flex">
				<aside className="hidden sm:block w-48 border-r border-border bg-muted/50 p-4 space-y-2">
					{folders.map((f) => {
						const active = folder === f;
						const accent = f === "Needs reply";
						return (
							<button
								key={f}
								onClick={() => setFolder(f)}
								className={`w-full flex items-center justify-between text-left text-[13px] px-2.5 py-1.5 rounded-md transition-colors ${
									active
										? "bg-ink text-background-elev"
										: "text-ink/70 hover:bg-ink/5"
								}`}
							>
								<span>{f}</span>
								<span
									className={`text-[11px] font-mono ${
										accent && !active ? "text-primary font-semibold" : ""
									}`}
								>
									{counts[f]}
								</span>
							</button>
						);
					})}
				</aside>

				<div className="flex-1 divide-y divide-border h-[400px] overflow-y-auto min-w-0">
					{visible.length === 0 ? (
						<div className="p-10 text-center text-[13px] text-ink/55">
							<Check className="w-5 h-5 text-primary mx-auto mb-2" />
							Inbox zero on {folder.toLowerCase()}. Go touch grass.
						</div>
					) : (
						visible.map((m) => {
							const isSelected = selected === m.id;
							const isReplied = replied.has(m.id);
							const isSaved = saved.has(m.id);
							const isComposing = composingId === m.id;
							return (
								<div
									key={m.id}
									onClick={() => setSelected(m.id)}
									className={`p-4 sm:p-5 flex gap-3 sm:gap-4 cursor-pointer transition-colors ${
										isSelected ? "bg-primary-soft/60" : "hover:bg-muted/40"
									}`}
								>
									<span
										className={`w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-[12px] font-semibold ${m.avatar}`}
									>
										{m.n
											.split(" ")
											.map((s) => s[0])
											.join("")}
									</span>
									<div className="min-w-0 flex-1">
										<div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
											<span className="font-medium text-[14px]">{m.n}</span>
											<span className="text-[11px] text-ink/50">on {m.p}</span>
											{isReplied && (
												<span className="text-[10px] font-mono uppercase tracking-[0.15em] text-primary flex items-center gap-1">
													<Check className="w-3 h-3" />
													replied
												</span>
											)}
											<span className="ml-auto text-[11px] font-mono text-ink/40">
												{m.time}
											</span>
										</div>
										<p className="mt-1 text-[13.5px] text-ink/80 leading-snug">
											{m.t}
										</p>
										<div className="mt-2 flex flex-wrap items-center gap-2">
											<button
												onClick={(e) => {
													e.stopPropagation();
													openReply(m.id);
												}}
												disabled={isReplied}
												className={`text-[11px] px-2 py-0.5 rounded-full transition-colors ${
													isReplied
														? "bg-ink/10 text-ink/40 cursor-not-allowed"
														: "bg-primary text-white hover:bg-primary-deep"
												}`}
											>
												{isReplied ? "Replied" : "Reply"}
											</button>
											<button
												onClick={(e) => {
													e.stopPropagation();
													toggleSave(m.id);
												}}
												className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors inline-flex items-center gap-1 ${
													isSaved
														? "border-primary bg-primary/10 text-primary"
														: "border-border text-ink/70 hover:border-ink/40"
												}`}
											>
												{isSaved && <Check className="w-3 h-3" />}
												{isSaved ? "Saved" : "Save"}
											</button>
											<span className="text-[10.5px] uppercase tracking-[0.15em] text-ink/40">
												{m.tag}
											</span>
										</div>

										{isComposing && (
											<div
												onClick={(e) => e.stopPropagation()}
												className="mt-3 rounded-xl border border-border bg-background p-3"
											>
												<textarea
													autoFocus
													value={draft}
													onChange={(e) => setDraft(e.target.value)}
													placeholder={`Reply to ${m.n}…`}
													rows={2}
													className="w-full resize-none bg-transparent text-[13px] text-ink placeholder:text-ink/40 focus:outline-none"
												/>
												<div className="mt-2 flex items-center justify-between">
													<span className="text-[10.5px] font-mono text-ink/40">
														posting to {m.p.toLowerCase()}
													</span>
													<div className="flex items-center gap-2">
														<button
															onClick={() => setComposingId(null)}
															className="text-[11px] px-2.5 py-1 rounded-full text-ink/60 hover:text-ink"
														>
															Cancel
														</button>
														<button
															onClick={sendReply}
															disabled={!draft.trim()}
															className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-ink text-background-elev disabled:opacity-40 disabled:cursor-not-allowed"
														>
															<Send className="w-3 h-3" />
															Send
														</button>
													</div>
												</div>
											</div>
										)}
									</div>
								</div>
							);
						})
					)}
				</div>
			</div>
		</div>
	);
}
