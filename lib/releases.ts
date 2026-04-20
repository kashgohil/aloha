export type ChangeTag = "new" | "improved" | "fixed";

export type Release = {
	version: string;
	date: string; // ISO
	dateLabel: string;
	title: string;
	lead: string;
	changes: { tag: ChangeTag; t: string }[];
	featured?: boolean;
	screenshotLabel?: string;
	screenshotNotes?: string;
	screenshotSrc?: string;
	screenshotAlt?: string;
};

export const RELEASES: Release[] = [
	{
		version: "1.14",
		date: "2026-04-09",
		dateLabel: "Apr 9, 2026",
		title: "The Logic Matrix graduates from beta",
		lead: "Six months of creator testing later, the automation canvas is ready for everyone. Human-approve default, cross-channel triggers, the whole thing.",
		changes: [
			{
				tag: "new",
				t: "Logic Matrix available on Pro and Agency — free matrices included on the free plan up to three nodes.",
			},
			{ tag: "new", t: "Six starter matrix templates shipped with the app." },
			{
				tag: "improved",
				t: "Dry-run preview now shows a 7-day simulation instead of just the next trigger.",
			},
			{
				tag: "fixed",
				t: "Fixed a race condition where two matrices on the same trigger could double-run.",
			},
		],
		featured: true,
		screenshotLabel: "Matrix canvas showing the new starter templates panel.",
		screenshotNotes: "",
		screenshotSrc: "/aloha-matrix.webp",
		screenshotAlt:
			"Aloha Logic Matrix — automations list with starter templates in the sidebar and the selected matrix canvas showing trigger, condition, and action nodes.",
	},
	{
		version: "1.13",
		date: "2026-03-27",
		dateLabel: "Mar 27, 2026",
		title: "Voice model v2 — it actually sounds like you now",
		lead: "The voice model learns from your best posts, not your whole archive. Users in the beta cohort saw a jump from 78% to 94% voice-match on average.",
		changes: [
			{
				tag: "improved",
				t: "New training method — pick the 12 posts that sound most like you, not the last 100.",
			},
			{
				tag: "improved",
				t: "Voice settings UI: tone sliders are labelled in plain English ('short sentences' / 'long sentences' instead of 'tau = 0.3').",
			},
			{
				tag: "new",
				t: "'Try a rewrite' button in voice settings — paste a draft, see how the current model would rewrite it for each channel.",
			},
		],
	},
	{
		version: "1.12",
		date: "2026-03-11",
		dateLabel: "Mar 11, 2026",
		title: "Inbox triage + daily digest",
		lead: "Comments, DMs, and mentions are now sorted into three buckets. The daily digest email summarises everything you didn't reply to and why.",
		changes: [
			{
				tag: "new",
				t: "Inbox triage view (Questions / Praise / Needs-review).",
			},
			{
				tag: "new",
				t: "Daily digest email — opt in, opt out, one click either way.",
			},
			{
				tag: "improved",
				t: "'Low-touch' classifier can now be taught per-account.",
			},
		],
	},
	{
		version: "1.11",
		date: "2026-02-24",
		dateLabel: "Feb 24, 2026",
		title: "Pinterest pin scheduling + Threads native cross-post",
		lead: "Two new channels moved out of beta. Pinterest supports pins and boards; Threads uses the native cross-post API from Instagram (not a screenshot repost).",
		changes: [
			{
				tag: "new",
				t: "Pinterest scheduling — pins and boards, with image + description native fields.",
			},
			{
				tag: "new",
				t: "Threads auto-mirror from Instagram, using the platform's native cross-post.",
			},
			{
				tag: "improved",
				t: "Channel connect flow unified across all 8 networks.",
			},
			{
				tag: "fixed",
				t: "TikTok drafts would occasionally lose their cover frame — fixed.",
			},
		],
	},
	{
		version: "1.10",
		date: "2026-02-06",
		dateLabel: "Feb 6, 2026",
		title: "Calendar conflict chips + cadence",
		lead: "Calendar now calls out the things you'd want a careful editor to call out — two-post Tuesdays, a channel that's been silent for three days, a launch beat that slipped.",
		changes: [
			{
				tag: "new",
				t: "Conflict chips: two-post-per-hour, channel-silence, launch-beat-missing.",
			},
			{
				tag: "new",
				t: "Cadence settings — per-channel weekly frequency, quiet hours, preferred slots.",
			},
			{
				tag: "improved",
				t: "Drag-to-reschedule snaps to best-time by default; override with Shift.",
			},
		],
	},
	{
		version: "1.9",
		date: "2026-01-22",
		dateLabel: "Jan 22, 2026",
		title: "Analytics CSV export + 24-month history",
		lead: "Every plan, including Free, now gets 24 months of analytics history and CSV export. No paywall on your own data.",
		changes: [
			{
				tag: "new",
				t: "CSV, JSON, and Markdown digest exports on every view.",
			},
			{ tag: "new", t: "24-month history on every plan, including Free." },
			{
				tag: "improved",
				t: "Platform-API gaps surface as visible markers instead of silent zeros.",
			},
		],
	},
];
