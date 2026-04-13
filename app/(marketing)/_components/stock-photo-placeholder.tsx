// Marks a slot where editorial/stock photography should replace an
// illustrated placeholder. Find every slot with:
//   grep -r data-placeholder=\"PHOTO_PLACEHOLDER\"

import { Camera } from "lucide-react";

type Props = {
  label: string;
  notes: string;
  aspect?: string;
  tone?: string;
  id?: string;
};

export function StockPhotoPlaceholder({
  label,
  notes,
  aspect = "aspect-[4/5]",
  tone = "bg-peach-200",
  id,
}: Props) {
  const grainId = `photo-grain-${id ?? Math.random().toString(36).slice(2, 8)}`;
  return (
    <div
      className={`relative ${aspect} ${tone} rounded-3xl overflow-hidden border border-border-strong`}
      data-placeholder="PHOTO_PLACEHOLDER"
    >
      {/* heavier grain + warm gradient to suggest a photo */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(ellipse at 30% 25%, rgba(255,240,215,0.7) 0%, transparent 55%), radial-gradient(ellipse at 70% 90%, rgba(234,159,87,0.35) 0%, transparent 60%)",
        }}
      />
      <svg aria-hidden viewBox="0 0 400 500" className="absolute inset-0 w-full h-full opacity-[0.22] mix-blend-multiply">
        <filter id={grainId}>
          <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="3" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#${grainId})`} />
      </svg>

      {/* film-edge marks */}
      <span aria-hidden className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <span key={i} className="w-2 h-1 rounded-sm bg-ink/20" />
        ))}
      </span>
      <span aria-hidden className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <span key={i} className="w-2 h-1 rounded-sm bg-ink/20" />
        ))}
      </span>

      <div className="absolute inset-0 p-7 flex flex-col">
        <span className="self-start inline-flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-[0.22em] text-ink/55 bg-background-elev/80 px-2 py-1 rounded-full">
          <Camera className="w-3 h-3" />
          Photo · placeholder
        </span>
        <div className="mt-auto">
          <p className="font-display italic text-[22px] lg:text-[24px] leading-[1.2] tracking-[-0.01em] text-ink/85 max-w-md">
            {label}
          </p>
          <p className="mt-3 text-[12.5px] font-mono text-ink/55 leading-[1.5] max-w-md">
            {notes}
          </p>
        </div>
      </div>
    </div>
  );
}
