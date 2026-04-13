"use client";

import { useMemo, useState } from "react";
import { Sparkle, Clock } from "lucide-react";
import { CHANNELS, CHANNEL_SLUGS } from "@/lib/channels";

const TIMEZONES = [
  { label: "Pacific (UTC−8)", offset: -8 },
  { label: "Eastern (UTC−5)", offset: -5 },
  { label: "UTC", offset: 0 },
  { label: "Central European (UTC+1)", offset: 1 },
  { label: "India Standard (UTC+5.5)", offset: 5.5 },
  { label: "Singapore (UTC+8)", offset: 8 },
  { label: "Sydney (UTC+11)", offset: 11 },
];

const HOUR_LABELS = ["12a", "3a", "6a", "9a", "12p", "3p", "6p", "9p"];

function bandForIntensity(v: number): string {
  if (v >= 75) return "bg-primary";
  if (v >= 55) return "bg-peach-400";
  if (v >= 35) return "bg-peach-300";
  if (v >= 20) return "bg-peach-200";
  if (v >= 8) return "bg-peach-100";
  return "bg-muted";
}

function shiftArray(arr: number[], shiftHours: number): number[] {
  const len = arr.length;
  const shift = ((Math.round(shiftHours) % len) + len) % len;
  return arr.slice(shift).concat(arr.slice(0, shift));
}

function formatHour(h: number): string {
  const mod = ((h % 24) + 24) % 24;
  const base = mod % 12 || 12;
  const suffix = mod < 12 ? "am" : "pm";
  return `${base}${suffix}`;
}

export function BestTimeFinder() {
  const [channel, setChannel] = useState("instagram");
  const [tzOffset, setTzOffset] = useState(0); // hours from UTC; local = reference
  const ch = CHANNELS[channel];

  // Shift the 24-bucket intensity array by timezone offset.
  // The underlying data represents local-hour engagement; when the
  // reader's timezone differs, they see their own hours on the x-axis.
  const shifted = useMemo(
    () => shiftArray(ch.bestTimes, Math.round(tzOffset)),
    [ch, tzOffset],
  );

  const peakIndex = shifted.reduce(
    (best, v, i) => (v > shifted[best] ? i : best),
    0,
  );
  const peakRange = `${formatHour(peakIndex)} – ${formatHour(peakIndex + 2)}`;

  // Also surface a secondary peak away from the primary one.
  let secondary = -1;
  let secondaryVal = -1;
  for (let i = 0; i < shifted.length; i++) {
    const far = Math.min(
      Math.abs(i - peakIndex),
      24 - Math.abs(i - peakIndex),
    );
    if (far >= 4 && shifted[i] > secondaryVal) {
      secondary = i;
      secondaryVal = shifted[i];
    }
  }

  return (
    <div className="grid grid-cols-12 gap-6 lg:gap-8">
      {/* form */}
      <div className="col-span-12 lg:col-span-4">
        <div className="p-7 lg:p-8 rounded-3xl bg-peach-100 border border-peach-300/40 space-y-6">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-ink/55">
            Pick a channel + timezone
          </p>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-2">
              Channel
            </label>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              className="w-full h-12 px-4 rounded-xl bg-background-elev border border-border-strong text-[14px] text-ink focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
            >
              {CHANNEL_SLUGS.map((slug) => (
                <option key={slug} value={slug}>
                  {CHANNELS[slug].name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-2">
              Your timezone
            </label>
            <select
              value={tzOffset}
              onChange={(e) => setTzOffset(Number(e.target.value))}
              className="w-full h-12 px-4 rounded-xl bg-background-elev border border-border-strong text-[14px] text-ink focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz.label} value={tz.offset}>
                  {tz.label}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-4 border-t border-ink/10">
            <p className="text-[11px] text-ink/65 leading-[1.6]">
              Uses global averages for {ch.name}. Your real data is tighter —
              Aloha re-learns your own peak windows from your last 90 days
              inside the product.
            </p>
          </div>
        </div>
      </div>

      {/* viz */}
      <div className="col-span-12 lg:col-span-8">
        <div className={`p-8 lg:p-10 rounded-3xl ${ch.accent}`}>
          {/* headline */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-[10.5px] font-mono uppercase tracking-[0.22em] text-ink/60">
              <Clock className="w-3 h-3" />
              {ch.name} · your local hours
            </div>
            <span className="text-[10.5px] font-mono text-ink/55">
              24-hour average · global
            </span>
          </div>

          {/* bars */}
          <div className="flex items-end gap-[4px] h-[140px]">
            {shifted.map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-stretch">
                <div
                  className={`rounded-t-sm ${bandForIntensity(v)} ${i === peakIndex ? "ring-2 ring-ink/80 ring-offset-[1px] ring-offset-peach-200" : ""}`}
                  style={{ height: `${Math.max(6, v)}%` }}
                />
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-between text-[10px] font-mono text-ink/45">
            {HOUR_LABELS.map((h) => (
              <span key={h}>{h}</span>
            ))}
          </div>

          {/* insights */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-background-elev/70">
              <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.22em] text-ink/55 mb-2">
                <Sparkle className="w-3 h-3 text-primary" />
                Primary window
              </div>
              <p className="font-display text-[24px] leading-[1] tracking-[-0.015em] text-ink">
                {peakRange}
              </p>
              <p className="mt-2 text-[12px] text-ink/65">
                Peak engagement intensity {shifted[peakIndex]}/100 at {formatHour(peakIndex)}.
              </p>
            </div>

            {secondary !== -1 && (
              <div className="p-5 rounded-2xl bg-background-elev/70">
                <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.22em] text-ink/55 mb-2">
                  <Sparkle className="w-3 h-3 text-primary" />
                  Secondary window
                </div>
                <p className="font-display text-[24px] leading-[1] tracking-[-0.015em] text-ink">
                  {formatHour(secondary)} – {formatHour(secondary + 2)}
                </p>
                <p className="mt-2 text-[12px] text-ink/65">
                  Good fallback when the primary is crowded for you.
                </p>
              </div>
            )}
          </div>

          {/* channel insight */}
          <div className="mt-6 p-5 rounded-2xl bg-background-elev/60 flex items-start gap-3">
            <Sparkle className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
            <p className="text-[12.5px] leading-[1.55] text-ink/85">{ch.peakInsight}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
