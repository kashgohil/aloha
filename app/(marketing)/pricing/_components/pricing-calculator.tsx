"use client";

import { ArrowRight, Sparkle } from "lucide-react";
import { useMemo, useState } from "react";
import { BANDS, bandFor, calcMonthly } from "@/lib/billing/pricing";

function formatMoney(n: number) {
	const rounded = Math.round(n * 100) / 100;
	return Number.isInteger(rounded) ? `${rounded}` : rounded.toFixed(2);
}

type CalculatorProps = {
	initialChannels?: number;
	initialMuse?: boolean;
	initialAnnual?: boolean;
	submitLabel?: string;
};

export function PricingCalculator({
	initialChannels = 5,
	initialMuse = true,
	initialAnnual = true,
	submitLabel,
}: CalculatorProps = {}) {
	const [channels, setChannels] = useState(initialChannels);
	const [muse, setMuse] = useState(initialMuse);
	const [annual, setAnnual] = useState(initialAnnual);

	const bill = useMemo(() => calcMonthly(channels), [channels]);
	const monthly = muse ? bill.withMuse : bill.basic;
	const effective = annual ? monthly * 0.8 : monthly;
	const yearly = effective * 12;
	const savings = annual ? monthly * 12 - yearly : 0;
	const nextBand = bandFor(channels + 1);
	const nextChannelCost = muse ? nextBand.basic + nextBand.muse : nextBand.basic;

	return (
		<div className="rounded-3xl bg-background border border-border overflow-hidden">
			{/* price headline */}
			<div className="p-8 lg:p-12 bg-peach-100 border-b border-border">
				<div className="flex flex-wrap items-start justify-between gap-6">
					<div>
						<div className="flex items-center gap-2 text-[10.5px] font-mono uppercase tracking-[0.22em] text-ink/60 mb-3">
							<Sparkle className="w-3 h-3 text-primary" />
							Live estimate · {annual ? "billed yearly" : "billed monthly"}
						</div>
						<p className="font-display text-[48px] lg:text-[72px] leading-[0.95] tracking-[-0.025em]">
							${formatMoney(effective)}
							<span className="text-[20px] lg:text-[24px] text-ink/50 font-mono ml-3">
								/ mo
							</span>
						</p>
						<p className="mt-2 text-[13.5px] text-ink/70">
							{channels === 0 ? (
								<>Free tier · 3 channels, AI companion only</>
							) : (
								<>
									{channels} channel{channels > 1 ? "s" : ""} ·{" "}
									{muse ? "Basic + Muse" : "Basic only"}
									{annual && savings > 0 && (
										<>
											<span className="text-ink/40"> · </span>
											<span className="text-primary-deep font-medium">
												save ${Math.round(savings)}/yr
											</span>
										</>
									)}
								</>
							)}
						</p>
					</div>

					{/* billing toggle */}
					<div className="inline-flex rounded-full bg-background-elev p-1 text-[12px] font-medium">
						<button
							type="button"
							onClick={() => setAnnual(false)}
							className={`px-4 h-9 rounded-full transition-colors ${
								!annual ? "bg-ink text-background-elev" : "text-ink/60"
							}`}
						>
							Monthly
						</button>
						<button
							type="button"
							onClick={() => setAnnual(true)}
							className={`px-4 h-9 rounded-full transition-colors inline-flex items-center gap-1.5 ${
								annual ? "bg-ink text-background-elev" : "text-ink/60"
							}`}
						>
							Yearly
							<span
								className={`text-[10px] font-mono uppercase tracking-[0.12em] ${
									annual ? "text-peach-300" : "text-primary"
								}`}
							>
								−20%
							</span>
						</button>
					</div>
				</div>
			</div>

			{/* muse toggle */}
			<div className="px-8 lg:px-12 pt-8">
				<div className="rounded-2xl bg-background-elev border border-border p-2 grid grid-cols-2 gap-1 text-[13px] font-medium">
					<button
						type="button"
						onClick={() => setMuse(false)}
						className={`rounded-xl px-4 py-3 text-left transition-colors ${
							!muse ? "bg-ink text-background-elev" : "text-ink/65 hover:text-ink"
						}`}
					>
						<span className="block text-[13.5px]">Basic</span>
						<span
							className={`block text-[11px] mt-0.5 font-mono ${
								!muse ? "text-peach-300" : "text-ink/50"
							}`}
						>
							Scheduling + AI companion
						</span>
					</button>
					<button
						type="button"
						onClick={() => setMuse(true)}
						className={`rounded-xl px-4 py-3 text-left transition-colors ${
							muse ? "bg-primary text-primary-foreground" : "text-ink/65 hover:text-ink"
						}`}
					>
						<span className="flex items-center gap-1.5 text-[13.5px]">
							Basic + Muse
							<Sparkle className="w-3 h-3" />
						</span>
						<span
							className={`block text-[11px] mt-0.5 font-mono ${
								muse ? "text-primary-foreground/80" : "text-ink/50"
							}`}
						>
							Adds style-trained AI
						</span>
					</button>
				</div>
			</div>

			{/* slider */}
			<div className="p-8 lg:p-12 pt-8 space-y-10">
				<div>
					<div className="flex items-end justify-between mb-4">
						<div>
							<label
								htmlFor="channels"
								className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-ink/55 block mb-1.5"
							>
								Channels
							</label>
							<p className="text-[12.5px] text-ink/60 max-w-[32ch]">
								Each connected channel — LinkedIn, X, Instagram, TikTok,
								wherever you publish.
							</p>
						</div>
						<span className="font-display text-[40px] lg:text-[48px] leading-none tracking-[-0.015em]">
							{channels}
						</span>
					</div>
					<input
						id="channels"
						type="range"
						min={0}
						max={30}
						step={1}
						value={channels}
						onChange={(e) => setChannels(Number(e.target.value))}
						className="w-full accent-primary"
					/>
					<div className="flex justify-between mt-2 text-[10.5px] font-mono text-ink/50">
						<span>0</span>
						<span>10</span>
						<span>20</span>
						<span>30+</span>
					</div>
				</div>

				{/* breakdown */}
				<div className="pt-6 border-t border-border grid grid-cols-2 gap-6">
					<div>
						<p className="text-[10.5px] font-mono uppercase tracking-[0.18em] text-ink/55 mb-1">
							Basic
						</p>
						<p className="font-display text-[28px] tracking-[-0.01em]">
							${formatMoney(bill.basic)}
							<span className="text-[15px] text-ink/50 font-mono ml-1.5">
								/ mo
							</span>
						</p>
						<p className="mt-1 text-[11.5px] text-ink/55">
							scheduling, calendar, companion
						</p>
					</div>
					<div
						className={`transition-opacity ${muse ? "opacity-100" : "opacity-40"}`}
					>
						<p className="text-[10.5px] font-mono uppercase tracking-[0.18em] text-primary-deep mb-1 inline-flex items-center gap-1.5">
							<Sparkle className="w-3 h-3" /> Muse add-on
						</p>
						<p className="font-display text-[28px] tracking-[-0.01em]">
							{muse ? `$${formatMoney(bill.muse)}` : "—"}
							{muse && (
								<span className="text-[15px] text-ink/50 font-mono ml-1.5">
									/ mo
								</span>
							)}
						</p>
						<p className="mt-1 text-[11.5px] text-ink/55">
							style-trained voice + advanced campaigns
						</p>
					</div>
				</div>

				{/* next channel */}
				<div className="pt-6 border-t border-border flex flex-wrap items-baseline justify-between gap-4">
					<div>
						<p className="text-[10.5px] font-mono uppercase tracking-[0.18em] text-ink/55 mb-1">
							{channels < 30 ? "Next channel" : "Add-on rate"}
						</p>
						<p className="font-display text-[22px] tracking-[-0.005em]">
							+${formatMoney(nextChannelCost)}
							<span className="text-[13px] text-ink/55 font-mono ml-2">
								/ mo
							</span>
						</p>
					</div>
					<p className="text-[12px] text-ink/55 font-mono">
						Annual ${Math.round(yearly).toLocaleString()}
					</p>
				</div>

				{/* CTA — one checkout. "bundle" is Basic+Muse combined pricing. */}
				<div className="pt-6 border-t border-border">
					<form action="/api/billing/checkout" method="post">
						<input type="hidden" name="plan" value={muse ? "bundle" : "basic"} />
						<input type="hidden" name="interval" value={annual ? "year" : "month"} />
						<input type="hidden" name="channels" value={Math.max(1, channels)} />
						<button
							type="submit"
							className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-full bg-primary text-primary-foreground font-medium text-[13.5px] hover:bg-primary-deep transition-colors w-full"
						>
							{submitLabel ??
								(channels === 0
									? "Start free · 3 channels"
									: muse
										? `Start with Muse on ${channels} ${channels === 1 ? "channel" : "channels"}`
										: `Start Basic on ${channels} ${channels === 1 ? "channel" : "channels"}`)}
							<ArrowRight className="w-4 h-4" />
						</button>
					</form>
				</div>
			</div>

			{/* tier bands reference */}
			<div className="border-t border-border bg-background-elev/60 px-8 lg:px-12 py-6">
				<p className="text-[10.5px] font-mono uppercase tracking-[0.22em] text-ink/55 mb-4">
					Per-channel rate by band
				</p>
				<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 text-[12.5px]">
					{BANDS.map((band, i) => (
						<div
							key={band.from}
							className={`rounded-xl p-3 ${
								isBandActive(channels, i)
									? "bg-peach-200 text-ink"
									: "text-ink/65"
							}`}
						>
							<p className="text-[10px] font-mono uppercase tracking-[0.18em] text-ink/55 mb-1">
								{band.to === Infinity ? `${band.from}+` : `${band.from}–${band.to}`}
							</p>
							<p className="font-display text-[16px] tracking-[-0.005em]">
								${formatMoney(band.basic)}
								{muse && (
									<>
										<span className="text-ink/40 mx-1">+</span>$
										{formatMoney(band.muse)}
									</>
								)}
							</p>
							<p className="text-[10.5px] text-ink/55 mt-0.5 font-mono">
								{muse ? "basic + muse" : "basic"}
							</p>
						</div>
					))}
				</div>
				<p className="mt-3 text-[11px] text-ink/50 font-mono">
					Discount applies per-channel within each band — same shape for Basic
					and Muse.
				</p>
			</div>
		</div>
	);
}

function isBandActive(channels: number, bandIndex: number) {
	if (channels === 0) return false;
	const band = BANDS[bandIndex];
	return channels >= band.from;
}

