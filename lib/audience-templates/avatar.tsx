import type { CSSProperties } from "react";

export function initialsFrom(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase() ?? "")
      .join("") || name[0]?.toUpperCase() || "A"
  );
}

export function Avatar({
  url,
  name,
  size,
  shape = "circle",
  className = "",
  style,
}: {
  url: string | null;
  name: string;
  size: number;
  shape?: "circle" | "square";
  className?: string;
  style?: CSSProperties;
}) {
  const rounded = shape === "circle" ? "rounded-full" : "rounded-md";
  const inner = `w-full h-full object-cover ${rounded}`;

  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        width={size}
        height={size}
        className={`${inner} ${className}`}
        style={{ width: size, height: size, ...style }}
      />
    );
  }

  return (
    <span
      className={`grid place-items-center bg-peach-100 text-ink border border-border ${rounded} ${className}`}
      style={{
        width: size,
        height: size,
        fontFamily: "var(--font-display)",
        fontSize: Math.round(size * 0.38),
        lineHeight: 1,
        ...style,
      }}
      aria-hidden
    >
      {initialsFrom(name)}
    </span>
  );
}
