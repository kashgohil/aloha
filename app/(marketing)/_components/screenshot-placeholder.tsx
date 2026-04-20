// Marks where a real product screenshot should replace an illustrated mock.
// Grep the codebase for `data-placeholder="SCREENSHOT_PLACEHOLDER"` or the
// component name to find every slot across marketing pages.

import Image from "next/image";

type Props = {
	label: string;
	notes: string;
	aspect?: string;
	tone?: string;
	id?: string;
	comingSoon?: boolean;
	/** When provided, renders the real screenshot instead of the illustrated stand-in. */
	src?: string;
	/** Alt text for the real screenshot — required when src is set. */
	alt?: string;
};

export function ScreenshotPlaceholder({
	label,
	notes,
	aspect = "aspect-[5/3]",
	tone = "bg-peach-100",
	id,
	comingSoon = false,
	src,
	alt,
}: Props) {
	if (src) {
		return (
			<figure
				className={`relative ${aspect} rounded-3xl border border-border-strong overflow-hidden bg-background-elev shadow-[0_30px_60px_-30px_rgba(23,20,18,0.25)]`}
				data-placeholder="SCREENSHOT"
			>
				<Image
					src={src}
					alt={alt ?? label}
					fill
					sizes="(min-width: 1024px) 90vw, 100vw"
					className="object-cover object-top"
				/>
			</figure>
		);
	}

	if (comingSoon) {
		return <ComingSoonCard label={label} aspect={aspect} id={id} />;
	}

	// Illustrated stand-in (only used for legacy placeholders that haven't been
	// given a src or marked comingSoon — kept so we can grep old usage).
	const grainId = `grain-${id ?? Math.random().toString(36).slice(2, 8)}`;
	return (
		<div
			className={`relative ${aspect} ${tone} rounded-3xl border border-border-strong overflow-hidden`}
			data-placeholder="SCREENSHOT_PLACEHOLDER"
		>
			<svg
				aria-hidden
				viewBox="0 0 400 320"
				className="absolute inset-0 w-full h-full opacity-[0.18] mix-blend-multiply"
			>
				<filter id={grainId}>
					<feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" />
				</filter>
				<rect width="100%" height="100%" filter={`url(#${grainId})`} />
			</svg>
			<span
				aria-hidden
				className="absolute top-4 left-4 w-4 h-4 border-l-2 border-t-2 border-ink/30"
			/>
			<span
				aria-hidden
				className="absolute top-4 right-4 w-4 h-4 border-r-2 border-t-2 border-ink/30"
			/>
			<span
				aria-hidden
				className="absolute bottom-4 left-4 w-4 h-4 border-l-2 border-b-2 border-ink/30"
			/>
			<span
				aria-hidden
				className="absolute bottom-4 right-4 w-4 h-4 border-r-2 border-b-2 border-ink/30"
			/>

			<div className="absolute inset-0 p-8 flex flex-col">
				<span className="self-start text-[9px] font-mono uppercase tracking-[0.22em] text-ink/50 bg-background-elev/80 px-2 py-1 rounded-full">
					Screenshot · placeholder
				</span>
				<div className="mt-auto">
					<p className="font-display text-[22px] lg:text-[26px] leading-[1.15] tracking-[-0.01em] text-ink max-w-md">
						{label}
					</p>
					<p className="mt-3 text-[12.5px] font-mono text-ink/60 leading-[1.5] max-w-md">
						{notes}
					</p>
				</div>
			</div>
		</div>
	);
}

// Blurry, mysterious container for features that haven't shipped yet. Soft
// peach gradient blobs + a frosted pane evoke "something is being drawn here"
// without pretending to show an actual UI.
function ComingSoonCard({
	label,
	aspect,
	id,
}: {
	label: string;
	aspect: string;
	id?: string;
}) {
	return (
		<div
			className={`relative ${aspect} rounded-3xl border border-border-strong overflow-hidden isolate`}
			data-placeholder="SCREENSHOT_COMING_SOON"
			data-id={id}
		>
			{/* Gradient base */}
			<div
				aria-hidden
				className="absolute inset-0 bg-gradient-to-br from-peach-200 via-peach-100 to-primary-soft/70"
			/>

			{/* Blurred colour blobs — give the sense of an image hiding behind frost */}
			<div
				aria-hidden
				className="absolute -top-16 -left-12 w-[55%] h-[65%] rounded-full bg-primary/30 blur-3xl"
			/>
			<div
				aria-hidden
				className="absolute -bottom-20 right-[-10%] w-[65%] h-[70%] rounded-full bg-peach-400/70 blur-3xl"
			/>
			<div
				aria-hidden
				className="absolute top-[30%] right-[20%] w-[22%] h-[28%] rounded-full bg-primary-deep/25 blur-2xl"
			/>

			{/* Faint UI hints — horizontal bars that read as "interface behind glass" */}
			<div
				aria-hidden
				className="absolute inset-x-[12%] top-[20%] bottom-[22%] flex flex-col gap-3 opacity-40"
			>
				<div className="h-3 rounded-full bg-ink/30 w-[55%]" />
				<div className="h-3 rounded-full bg-ink/20 w-[78%]" />
				<div className="h-3 rounded-full bg-ink/20 w-[42%]" />
				<div className="mt-auto flex gap-2">
					<div className="h-10 flex-1 rounded-2xl bg-ink/15" />
					<div className="h-10 flex-1 rounded-2xl bg-ink/10" />
					<div className="h-10 flex-1 rounded-2xl bg-ink/15" />
				</div>
			</div>

			{/* Frost pane — the mystery */}
			<div
				aria-hidden
				className="absolute inset-0 backdrop-blur-2xl bg-background-elev/35"
			/>

			{/* Grain overlay for texture continuity with the brand */}
			<svg
				aria-hidden
				viewBox="0 0 400 320"
				className="absolute inset-0 w-full h-full opacity-[0.09] mix-blend-multiply"
			>
				<filter id={`cs-grain-${id ?? "x"}`}>
					<feTurbulence
						type="fractalNoise"
						baseFrequency="0.9"
						numOctaves="2"
					/>
				</filter>
				<rect width="100%" height="100%" filter={`url(#cs-grain-${id ?? "x"})`} />
			</svg>

			{/* Foreground */}
			<div className="relative h-full flex flex-col items-center justify-center px-10 text-center gap-5">
				<span className="inline-flex items-center gap-2 h-8 px-4 rounded-full bg-background-elev/85 border border-border-strong text-[10.5px] font-mono uppercase tracking-[0.22em] text-ink shadow-[0_10px_30px_-12px_rgba(23,20,18,0.25)]">
					<span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
					Coming soon
				</span>
				<p className="font-display text-[22px] lg:text-[28px] leading-[1.15] tracking-[-0.01em] text-ink max-w-md">
					{label}
				</p>
				<p className="text-[11.5px] font-mono uppercase tracking-[0.18em] text-ink/50">
					In the drawer · not yet on the shelf
				</p>
			</div>
		</div>
	);
}
