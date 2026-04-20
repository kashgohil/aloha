// Render social profile banners (X header + LinkedIn banner) to /public.
// Layout mirrors lib/og.tsx `ogCard` — same peach accent, same fonts, same
// three-row (header / title / footer) structure — tuned to banner aspect
// ratios. No effects or colors outside the ogCard palette.
//
// Run with: `bun scripts/render-banners.tsx`

import { ImageResponse } from "next/og";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadOgFonts } from "../lib/og";
import { SITE_NAME, SITE_URL } from "../lib/seo";

const PUBLIC_DIR = join(
	dirname(fileURLToPath(import.meta.url)),
	"..",
	"public",
);

const ICON_DATA_URL = (() => {
	const buf = readFileSync(join(PUBLIC_DIR, "aloha.png"));
	return `data:image/png;base64,${buf.toString("base64")}`;
})();

// Exact palette from lib/og.tsx ACCENTS.peach.
const PEACH_BG = "#F5DFC9";
const INK = "#1A1714";
const INK_SUBTLE = "#1A171499";

const DOMAIN = SITE_URL.replace(/^https?:\/\//, "");

type Size = { width: number; height: number };
type Layout = { padding: number; titleSize: number; iconSize: number };

function banner(size: Size, layout: Layout) {
	const { padding, titleSize, iconSize } = layout;
	return (
		<div
			style={{
				width: "100%",
				height: "100%",
				display: "flex",
				flexDirection: "column",
				justifyContent: "space-between",
				padding,
				background: PEACH_BG,
				color: INK,
				fontFamily: "Fraunces",
			}}
		>
			{/* header: domain (left) + wordmark/icon (right) */}
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
				}}
			>
				<span
					style={{
						fontFamily: "Outfit",
						fontSize: 20,
						color: INK_SUBTLE,
					}}
				>
					{DOMAIN}
				</span>
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: 16,
						color: INK,
					}}
				>
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img src={ICON_DATA_URL} width={iconSize} height={iconSize} alt="" />
					<span
						style={{
							fontFamily: "Fraunces",
							fontSize: Math.round(iconSize * 0.72),
							letterSpacing: "-0.01em",
							color: INK,
						}}
					>
						{SITE_NAME}
					</span>
				</div>
			</div>

			{/* title */}
			<div
				style={{
					display: "flex",
					justifyContent: "flex-end",
				}}
			>
				<div
					style={{
						fontFamily: "Fraunces-Light",
						fontSize: titleSize,
						lineHeight: 0.98,
						letterSpacing: "-0.035em",
						maxWidth: size.width - padding * 2,
						textAlign: "right",
						display: "flex",
						flexWrap: "wrap",
						justifyContent: "flex-end",
					}}
				>
					The calm social media OS.
				</div>
			</div>

			{/* footer: tagline right */}
			<div
				style={{
					display: "flex",
					justifyContent: "flex-end",
					alignItems: "center",
					fontSize: 20,
					color: INK_SUBTLE,
					fontFamily: "Outfit",
				}}
			>
				<span>Grow with intention</span>
			</div>
		</div>
	);
}

const fonts = [...loadOgFonts()];

async function save(name: string, size: Size, layout: Layout) {
	const res = new ImageResponse(banner(size, layout), { ...size, fonts });
	const buf = Buffer.from(await res.arrayBuffer());
	const path = join(PUBLIC_DIR, name);
	writeFileSync(path, buf);
	console.log(
		`✓ public/${name} (${size.width}×${size.height}, ${(buf.length / 1024).toFixed(1)}KB)`,
	);
}

// X / Twitter header
await save(
	"banner-x.png",
	{ width: 1500, height: 500 },
	{ padding: 56, titleSize: 88, iconSize: 44 },
);

// LinkedIn banner (shorter, wider)
await save(
	"banner-linkedin.png",
	{ width: 1584, height: 396 },
	{ padding: 44, titleSize: 72, iconSize: 40 },
);

console.log("Done.");
