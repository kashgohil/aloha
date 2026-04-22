import {
	DEFAULT_DESCRIPTION,
	SITE_LOCALE,
	SITE_NAME,
	SITE_TAGLINE,
	SITE_URL,
} from "@/lib/seo";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { Fraunces, Geist, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { themeInitScript } from "./app/_components/theme-provider";
import "./globals.css";

const fraunces = Fraunces({
	variable: "--font-display",
	subsets: ["latin"],
	display: "swap",
});

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

// Audience-page template fonts. Loaded lazily on the public profile route so
// the main app doesn't pay the bytes. `display: "swap"` keeps first paint
// readable even on slow connections.
const instrumentSerif = Instrument_Serif({
	weight: "400",
	style: ["normal", "italic"],
	subsets: ["latin"],
	variable: "--font-serif",
	display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
	subsets: ["latin"],
	variable: "--font-mono",
	display: "swap",
});

export const metadata: Metadata = {
	metadataBase: new URL(SITE_URL),
	title: {
		default: `${SITE_NAME} — ${SITE_TAGLINE}`,
		template: `%s · ${SITE_NAME}`,
	},
	description: DEFAULT_DESCRIPTION,
	applicationName: SITE_NAME,
	alternates: {
		types: {
			"application/atom+xml": [
				{ url: "/feed.xml", title: `${SITE_NAME} — What's new` },
			],
		},
	},
	icons: {
		icon: [
			{ url: "/aloha.svg", type: "image/svg+xml" },
			{ url: "/aloha.ico", sizes: "any" },
			{ url: "/aloha.png", type: "image/png" },
		],
		apple: { url: "/aloha.png", type: "image/png" },
		shortcut: "/aloha.ico",
	},
	openGraph: {
		title: `${SITE_NAME} — ${SITE_TAGLINE}`,
		description: DEFAULT_DESCRIPTION,
		siteName: SITE_NAME,
		locale: SITE_LOCALE,
		type: "website",
		url: SITE_URL,
	},
	twitter: {
		card: "summary_large_image",
		title: `${SITE_NAME} — ${SITE_TAGLINE}`,
		description: DEFAULT_DESCRIPTION,
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html
			lang="en"
			className={cn(
				"h-full",
				"antialiased",
				fraunces.variable,
				"font-sans",
				geist.variable,
				instrumentSerif.variable,
				jetbrainsMono.variable,
			)}
			suppressHydrationWarning
		>
			<head>
				<script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
			</head>
			<body className="min-h-full flex flex-col font-sans">
				{children}
				<Toaster
					position="bottom-right"
					closeButton
					toastOptions={{
						unstyled: true,
						classNames: {
							toast:
								"group relative w-full flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--background-elev)] text-[var(--foreground)] pl-4 pr-10 py-3 shadow-[0_10px_30px_-12px_rgba(26,22,18,0.25)] font-sans",
							title: "text-[13px] font-medium leading-snug",
							description:
								"text-[12.5px] leading-snug text-[var(--muted-foreground)]",
							icon: "mt-0.5 shrink-0",
							closeButton:
								"!absolute !top-2 !right-2 !left-auto !translate-x-0 !translate-y-0 !size-6 !rounded-md !bg-transparent !border-0 !text-[var(--muted-foreground)] hover:!bg-[var(--muted)] hover:!text-[var(--foreground)] transition-colors",
							success:
								"[&_[data-icon]]:text-emerald-600 dark:[&_[data-icon]]:text-emerald-400",
							error:
								"[&_[data-icon]]:text-[var(--destructive)]",
							info: "[&_[data-icon]]:text-[var(--muted-foreground)]",
							warning:
								"[&_[data-icon]]:text-[var(--peach-400)]",
						},
					}}
				/>
			</body>
		</html>
	);
}
