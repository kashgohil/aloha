import {
	DEFAULT_DESCRIPTION,
	SITE_LOCALE,
	SITE_NAME,
	SITE_TAGLINE,
	SITE_URL,
} from "@/lib/seo";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { Fraunces, Geist } from "next/font/google";
import { Toaster } from "sonner";
import { themeInitScript } from "./app/_components/theme-provider";
import "./globals.css";

const fraunces = Fraunces({
	variable: "--font-display",
	subsets: ["latin"],
	display: "swap",
});

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
	metadataBase: new URL(SITE_URL),
	title: {
		default: `${SITE_NAME} — ${SITE_TAGLINE}`,
		template: `%s · ${SITE_NAME}`,
	},
	description: DEFAULT_DESCRIPTION,
	applicationName: SITE_NAME,
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
								"w-full flex items-start gap-3 rounded-xl border border-[var(--border-strong)] bg-[var(--background-elev)] text-[var(--foreground)] px-4 py-3 shadow-[0_10px_30px_-12px_rgba(26,22,18,0.25)] font-sans",
							title: "text-[13px] font-medium leading-snug",
							description:
								"text-[12.5px] leading-snug text-[var(--muted-foreground)]",
							icon: "mt-0.5 shrink-0 text-[var(--peach-400)]",
							closeButton:
								"!bg-transparent !border-0 !text-[var(--muted-foreground)] hover:!text-[var(--foreground)]",
							success:
								"border-[var(--peach-300)] bg-[var(--peach-100)] text-[var(--ink)]",
							error:
								"border-[color-mix(in_oklab,var(--destructive)_35%,var(--border-strong))] bg-[color-mix(in_oklab,var(--destructive)_10%,var(--background-elev))] text-[var(--ink)]",
							info: "border-[var(--border-strong)] bg-[var(--background-elev)]",
							warning:
								"border-[var(--peach-300)] bg-[var(--peach-100)] text-[var(--ink)]",
						},
					}}
				/>
			</body>
		</html>
	);
}
