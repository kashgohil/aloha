"use client";

export function FeedAvatar({
  title,
  siteUrl,
  iconUrl,
  size = 32,
  className,
}: {
  title: string;
  siteUrl?: string | null;
  iconUrl?: string | null;
  size?: number;
  className?: string;
}) {
  let fallbackIcon: string | null = null;
  if (!iconUrl && siteUrl) {
    try {
      const host = new URL(siteUrl).hostname;
      fallbackIcon = `https://www.google.com/s2/favicons?domain=${host}&sz=64`;
    } catch {
      fallbackIcon = null;
    }
  }
  const src = iconUrl ?? fallbackIcon;
  const initial = title.trim().charAt(0).toUpperCase() || "?";
  const style = { width: size, height: size };
  return (
    <span
      className={`relative rounded-lg bg-background-elev border border-border overflow-hidden shrink-0 grid place-items-center text-[11.5px] font-semibold text-ink/70 uppercase ${className ?? ""}`}
      style={style}
    >
      <span aria-hidden="true">{initial}</span>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      ) : null}
    </span>
  );
}
