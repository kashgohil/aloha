"use client";

import { AlertTriangle, Check, Copy, Sparkle } from "lucide-react";
import { useMemo, useState } from "react";

const ZERO_WIDTH = /[\u200B-\u200D\uFEFF\u2060]/g;
const SMART_QUOTES_OPEN = /[\u201C\u2018]/g; // "‘
const SMART_QUOTES_CLOSE = /[\u201D\u2019]/g; // "’
const EM_DASH = /\u2014/g;
const EN_DASH = /\u2013/g;
const NBSP = /\u00A0/g;
const ELLIPSIS_CHAR = /\u2026/g;
const MULTI_SPACES = /[ \t]{2,}/g;
const TRAILING_SPACES = /[ \t]+$/gm;
const MULTI_NEWLINES = /\n{3,}/g;
const SHADOWBAN_TOKENS =
	/\b(follow ?4 ?follow|f4f|l4l|tags ?4 ?likes|like ?4 ?like|dm me|check my bio|free followers)\b/gi;

type ScrubLog = { count: number; label: string };

function scrub(
	input: string,
	opts: {
		zeroWidth: boolean;
		quotes: boolean;
		dashes: boolean;
		whitespace: boolean;
		shadowFlags: boolean;
	},
) {
	let out = input;
	const log: ScrubLog[] = [];
	const flags: string[] = [];

	if (opts.zeroWidth) {
		const c = (out.match(ZERO_WIDTH) ?? []).length;
		if (c > 0)
			log.push({
				count: c,
				label: "Removed invisible / zero-width characters",
			});
		out = out.replace(ZERO_WIDTH, "");
	}

	if (opts.quotes) {
		const open = (out.match(SMART_QUOTES_OPEN) ?? []).length;
		const close = (out.match(SMART_QUOTES_CLOSE) ?? []).length;
		if (open + close > 0)
			log.push({
				count: open + close,
				label: "Replaced curly quotes with straight quotes",
			});
		out = out.replace(SMART_QUOTES_OPEN, '"').replace(SMART_QUOTES_CLOSE, '"');
	}

	if (opts.dashes) {
		const em = (out.match(EM_DASH) ?? []).length;
		const en = (out.match(EN_DASH) ?? []).length;
		if (em + en > 0)
			log.push({ count: em + en, label: "Normalised em / en dashes to —" });
		out = out.replace(EM_DASH, "—").replace(EN_DASH, "–");
	}

	if (opts.whitespace) {
		const nbsp = (out.match(NBSP) ?? []).length;
		const ellipsis = (out.match(ELLIPSIS_CHAR) ?? []).length;
		const multiSp = (out.match(MULTI_SPACES) ?? []).length;
		const trailing = (out.match(TRAILING_SPACES) ?? []).length;
		const newlines = (out.match(MULTI_NEWLINES) ?? []).length;
		const total = nbsp + ellipsis + multiSp + trailing + newlines;
		if (total > 0)
			log.push({
				count: total,
				label: "Tidied whitespace, newlines, and ellipses",
			});
		out = out
			.replace(NBSP, " ")
			.replace(ELLIPSIS_CHAR, "...")
			.replace(MULTI_SPACES, " ")
			.replace(TRAILING_SPACES, "")
			.replace(MULTI_NEWLINES, "\n\n");
	}

	if (opts.shadowFlags) {
		const matches = out.match(SHADOWBAN_TOKENS);
		if (matches) {
			for (const m of matches) flags.push(m);
		}
	}

	return { output: out, log, flags };
}

const OPTIONS: {
	key: keyof Parameters<typeof scrub>[1];
	label: string;
	help: string;
}[] = [
	{
		key: "zeroWidth",
		label: "Strip invisible characters",
		help: "Zero-width spaces and joiners (a common shadowban vector).",
	},
	{
		key: "quotes",
		label: "Straighten curly quotes",
		help: "Replaces \u201Csmart quotes\u201D with plain ASCII.",
	},
	{
		key: "dashes",
		label: "Normalise dashes",
		help: "Keeps em/en dashes consistent.",
	},
	{
		key: "whitespace",
		label: "Tidy whitespace",
		help: "Removes nbsp, doubled spaces, trailing spaces, and 3+ newlines.",
	},
	{
		key: "shadowFlags",
		label: "Flag shadowban tokens",
		help: "Scans for f4f, like-for-like, etc., and warns (does not delete).",
	},
];

export function CaptionScrubber() {
	const [input, setInput] = useState(
		"monday note: \u201Cthe thing you\u2019re avoiding is usually the thing worth writing about.\u201D\n\n\n\n\u200Bcheck my bio for the link \u2014 link 4 link not allowed but follow4follow is fine right?",
	);

	const [opts, setOpts] = useState({
		zeroWidth: true,
		quotes: true,
		dashes: true,
		whitespace: true,
		shadowFlags: true,
	});

	const result = useMemo(() => scrub(input, opts), [input, opts]);
	const [copied, setCopied] = useState(false);

	const copy = async () => {
		await navigator.clipboard.writeText(result.output);
		setCopied(true);
		setTimeout(() => setCopied(false), 1200);
	};

	const charsBefore = input.length;
	const charsAfter = result.output.length;

	return (
		<div className="grid grid-cols-12 gap-x-0 gap-y-6 lg:gap-8">
			{/* input + options */}
			<div className="col-span-12 lg:col-span-5 space-y-5">
				<div className="p-7 lg:p-8 rounded-3xl bg-peach-100 border border-peach-300/40 space-y-5">
					<p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-ink/55">
						Paste the caption
					</p>
					<textarea
						value={input}
						onChange={(e) => setInput(e.target.value)}
						rows={10}
						className="w-full px-4 py-3 rounded-xl bg-background-elev border border-border-strong text-[14px] text-ink focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary resize-none leading-[1.55]"
						placeholder="Paste a caption to scrub it…"
					/>
					<p className="text-[11.5px] font-mono text-ink/55">
						{charsBefore} chars in
					</p>
				</div>

				<div className="p-7 rounded-3xl bg-background-elev border border-border space-y-3">
					<p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-ink/55">
						What to scrub
					</p>
					{OPTIONS.map((o) => (
						<label
							key={o.key}
							className="flex items-start gap-3 cursor-pointer"
						>
							<input
								type="checkbox"
								checked={opts[o.key]}
								onChange={(e) =>
									setOpts({ ...opts, [o.key]: e.target.checked })
								}
								className="mt-1 w-4 h-4 accent-primary"
							/>
							<div className="flex-1">
								<p className="text-[13.5px] font-medium text-ink">{o.label}</p>
								<p className="text-[11.5px] text-ink/60 leading-normal">
									{o.help}
								</p>
							</div>
						</label>
					))}
				</div>
			</div>

			{/* output */}
			<div className="col-span-12 lg:col-span-7 space-y-5">
				<div className="rounded-3xl bg-primary-soft border border-primary/15 overflow-hidden">
					<div className="px-6 py-4 flex items-center justify-between border-b border-primary/10">
						<div className="flex items-center gap-2 text-[10.5px] font-mono uppercase tracking-[0.22em] text-ink/60">
							<Sparkle className="w-3 h-3 text-primary" />
							Cleaned · {charsAfter} chars
						</div>
						<button
							type="button"
							onClick={copy}
							className="inline-flex items-center gap-2 h-9 px-4 rounded-full bg-ink text-background text-[12.5px] font-medium hover:bg-primary transition-colors"
						>
							{copied ? (
								<>
									<Check className="w-3.5 h-3.5" strokeWidth={2.5} />
									Copied
								</>
							) : (
								<>
									<Copy className="w-3.5 h-3.5" />
									Copy cleaned
								</>
							)}
						</button>
					</div>
					<pre className="px-6 py-5 text-[14px] leading-[1.65] text-ink whitespace-pre-wrap font-sans">
						{result.output || (
							<span className="text-ink/50">
								Cleaned output will appear here.
							</span>
						)}
					</pre>
				</div>

				{/* changes log */}
				<div className="rounded-3xl bg-background-elev border border-border p-6">
					<p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
						What changed
					</p>
					{result.log.length === 0 && result.flags.length === 0 ? (
						<p className="text-[13.5px] text-ink/65">
							Nothing to clean. The caption is already tidy.
						</p>
					) : (
						<ul className="space-y-2.5">
							{result.log.map((l, i) => (
								<li
									key={i}
									className="flex items-start gap-3 text-[13.5px] text-ink/85"
								>
									<Check
										className="w-3.5 h-3.5 mt-1 text-primary shrink-0"
										strokeWidth={2.5}
									/>
									<span>
										<strong className="text-ink">{l.count}×</strong>{" "}
										<span className="text-ink/75">{l.label}</span>
									</span>
								</li>
							))}
						</ul>
					)}
				</div>

				{/* shadowban warnings */}
				{result.flags.length > 0 && (
					<div className="rounded-3xl bg-ink text-background-elev p-6 lg:p-7">
						<div className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.22em] text-peach-200 mb-3">
							<AlertTriangle className="w-3.5 h-3.5" />
							Shadowban risk · {result.flags.length}{" "}
							{result.flags.length === 1 ? "match" : "matches"}
						</div>
						<p className="text-[14px] text-background-elev/85 leading-[1.55] mb-4">
							These phrases are flagged on multiple platforms. They were not
							removed automatically — you decide whether to keep them.
						</p>
						<ul className="flex flex-wrap gap-2">
							{Array.from(new Set(result.flags)).map((f) => (
								<li
									key={f}
									className="px-3 py-1.5 rounded-full bg-peach-300 text-ink text-[12px] font-mono"
								>
									{f}
								</li>
							))}
						</ul>
					</div>
				)}
			</div>
		</div>
	);
}
