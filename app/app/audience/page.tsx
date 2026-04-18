import { addLink, updatePage } from "@/app/actions/audience";
import { db } from "@/db";
import { links, pages, subscribers } from "@/db/schema";
import { getCurrentUser } from "@/lib/current-user";
import { cn } from "@/lib/utils";
import { asc, desc, eq, sql } from "drizzle-orm";
import {
	ArrowUpRight,
	ExternalLink,
	Globe,
	Mail,
	Plus,
	Tags,
} from "lucide-react";
import Link from "next/link";
import { DeleteLinkButton } from "./_components/delete-confirm";

export const dynamic = "force-dynamic";

export default async function AudiencePage() {
	const user = (await getCurrentUser())!;

	const page = await db.query.pages.findFirst({
		where: eq(pages.userId, user.id),
	});

	const pageLinks = page
		? await db
				.select()
				.from(links)
				.where(eq(links.pageId, page.id))
				.orderBy(asc(links.order))
		: [];

	const subs = await db
		.select({
			id: subscribers.id,
			email: subscribers.email,
			name: subscribers.name,
			tags: subscribers.tags,
			createdAt: subscribers.createdAt,
		})
		.from(subscribers)
		.where(eq(subscribers.userId, user.id))
		.orderBy(desc(subscribers.createdAt))
		.limit(50);

	const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
	const [weekCount] = await db
		.select({
			total: sql<number>`count(*)`,
			newThisWeek: sql<number>`count(*) filter (where ${subscribers.createdAt} >= ${oneWeekAgo.toISOString()})`,
		})
		.from(subscribers)
		.where(eq(subscribers.userId, user.id));

	const allTags = Array.from(
		new Set(
			subs.flatMap((s) => s.tags ?? []).filter((t): t is string => Boolean(t)),
		),
	);

	return (
		<div className="space-y-12">
			{/* Header */}
			<header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
				<div>
					<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
						{user.workspaceName ?? "Your workspace"} · people
					</p>
					<h1 className="mt-3 font-display text-[44px] lg:text-[52px] leading-[1.02] tracking-[-0.03em] text-ink font-normal">
						Audience,
						<span className="text-primary font-light"> the quiet kind.</span>
					</h1>
					<p className="mt-3 text-[14px] text-ink/65 max-w-xl leading-[1.55]">
						Your public page, the links you share from it, and the people who
						asked to hear from you.
					</p>
				</div>
				{page ? (
					<Link
						href={`/u/${page.slug}`}
						target="_blank"
						rel="noreferrer"
						className="inline-flex items-center gap-1.5 h-11 px-5 rounded-full border border-border-strong text-[14px] font-medium text-ink hover:border-ink transition-colors"
					>
						<ExternalLink className="w-4 h-4" />
						View public page
					</Link>
				) : null}
			</header>

			<section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
				{/* Public page editor */}
				<div className="lg:col-span-7 space-y-6">
					<SectionTitle
						eyebrow="Your public page"
						title={page ? "Keep it tidy" : "Claim your handle"}
						href={page ? `/u/${page.slug}` : undefined}
						hrefLabel="Open"
					/>

					<div className="rounded-3xl border border-border bg-background-elev overflow-hidden">
						<form action={updatePage} className="divide-y divide-border">
							<div className="p-6 space-y-5">
								<div>
									<label
										htmlFor="slug"
										className="block text-[13px] font-medium text-ink mb-2"
									>
										Handle
									</label>
									<div className="flex rounded-xl overflow-hidden border border-border-strong focus-within:border-ink transition-colors">
										<span className="inline-flex items-center px-3.5 bg-muted text-[13px] text-ink/60 select-none">
											usealoha.app/u/
										</span>
										<input
											id="slug"
											name="slug"
											type="text"
											required
											defaultValue={page?.slug ?? ""}
											placeholder="your-handle"
											pattern="[a-z0-9][a-z0-9-]{1,38}[a-z0-9]"
											className="flex-1 h-11 px-3.5 bg-background-elev text-[14px] text-ink outline-none"
										/>
									</div>
									<p className="mt-2 text-[12px] text-ink/50">
										3–40 characters. Lowercase letters, numbers, and hyphens.
									</p>
								</div>

								<div>
									<label
										htmlFor="title"
										className="block text-[13px] font-medium text-ink mb-2"
									>
										Display name
									</label>
									<input
										id="title"
										name="title"
										type="text"
										defaultValue={page?.title ?? user.name ?? ""}
										placeholder="Longhand Studio"
										className="w-full h-11 px-3.5 rounded-xl bg-background-elev border border-border-strong text-[14px] text-ink focus:outline-none focus:border-ink transition-colors"
									/>
								</div>

								<div>
									<label
										htmlFor="bio"
										className="block text-[13px] font-medium text-ink mb-2"
									>
										Bio
									</label>
									<textarea
										id="bio"
										name="bio"
										defaultValue={page?.bio ?? ""}
										placeholder="One or two lines about what you make and who it's for."
										className="w-full min-h-[88px] p-3.5 rounded-xl bg-background-elev border border-border-strong text-[14px] text-ink leading-normal focus:outline-none focus:border-ink transition-colors resize-y"
									/>
								</div>
							</div>

							<div className="flex items-center justify-between px-6 py-4 bg-muted/30">
								<p className="text-[12px] text-ink/55">
									Changes publish immediately.
								</p>
								<button
									type="submit"
									className="inline-flex items-center h-10 px-5 rounded-full bg-ink text-background text-[13.5px] font-medium hover:bg-primary transition-colors"
								>
									Save page
								</button>
							</div>
						</form>
					</div>

					{/* Links */}
					<div className="rounded-3xl border border-border bg-background-elev overflow-hidden">
						<div className="flex items-center justify-between px-6 py-4 border-b border-border">
							<div>
								<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
									Links
								</p>
								<p className="mt-1 font-display text-[18px] text-ink">
									{pageLinks.length
										? `${pageLinks.length} on your page`
										: "Nothing linked yet"}
								</p>
							</div>
						</div>

						<ul className="divide-y divide-border">
							{pageLinks.length === 0 ? (
								<li className="px-6 py-8 text-center text-[13.5px] text-ink/55">
									Add your newsletter, portfolio, shop, or latest post.
								</li>
							) : (
								pageLinks.map((l) => (
									<li key={l.id} className="flex items-center gap-4 px-6 py-3">
										<span className="w-8 h-8 rounded-full bg-peach-100 border border-border grid place-items-center shrink-0 text-[12px] font-medium text-ink">
											{l.order + 1}
										</span>
										<div className="flex-1 min-w-0">
											<p className="text-[14px] text-ink font-medium truncate">
												{l.title}
											</p>
											<a
												href={l.url}
												target="_blank"
												rel="noreferrer"
												className="inline-flex items-center gap-1 text-[12px] text-ink/55 hover:text-ink transition-colors truncate max-w-full"
											>
												<Globe className="w-3 h-3 shrink-0" />
												<span className="truncate">{l.url}</span>
											</a>
										</div>
										<DeleteLinkButton linkId={l.id} title={l.title} />
									</li>
								))
							)}
						</ul>

						<form
							action={addLink}
							className="p-4 border-t border-border bg-muted/30 grid grid-cols-1 sm:grid-cols-[1fr_1.5fr_auto] gap-2"
						>
							<input
								type="text"
								name="title"
								placeholder="Link title"
								required
								maxLength={80}
								className="h-10 px-3.5 rounded-xl bg-background-elev border border-border-strong text-[13.5px] text-ink focus:outline-none focus:border-ink transition-colors"
							/>
							<input
								type="url"
								name="url"
								placeholder="https://"
								required
								className="h-10 px-3.5 rounded-xl bg-background-elev border border-border-strong text-[13.5px] text-ink focus:outline-none focus:border-ink transition-colors"
							/>
							<button
								type="submit"
								disabled={!page}
								className="inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-full bg-ink text-background text-[13px] font-medium hover:bg-primary disabled:opacity-40 disabled:hover:bg-ink transition-colors"
							>
								<Plus className="w-3.5 h-3.5" />
								Add
							</button>
							{!page ? (
								<p className="sm:col-span-3 text-[12px] text-ink/55">
									Save your page above first, then add links.
								</p>
							) : null}
						</form>
					</div>
				</div>

				{/* Subscribers */}
				<aside className="lg:col-span-5 space-y-6">
					<SectionTitle eyebrow="Subscribers" title="People who opted in" />

					<div className="grid grid-cols-2 gap-3">
						<Stat label="Total" value={weekCount.total ?? 0} />
						<Stat
							label="New this week"
							value={weekCount.newThisWeek ?? 0}
							accent
						/>
					</div>

					<div className="rounded-3xl border border-border bg-background-elev overflow-hidden">
						<div className="px-5 py-3 border-b border-border flex items-center justify-between">
							<p className="text-[12.5px] text-ink/70 inline-flex items-center gap-2">
								<Mail className="w-3.5 h-3.5 text-ink/50" />
								{subs.length > 0 ? `Most recent ${subs.length}` : "Empty list"}
							</p>
							<Link
								href="/app/settings"
								className="pencil-link text-[12px] text-ink/60"
							>
								Export CSV
							</Link>
						</div>

						<ul className="divide-y divide-border max-h-[460px] overflow-auto">
							{subs.length === 0 ? (
								<li className="px-5 py-12 text-center text-[13.5px] text-ink/55">
									No one here yet. Share your public page to start collecting
									signups.
								</li>
							) : (
								subs.map((s) => (
									<li key={s.id} className="px-5 py-3.5">
										<div className="flex items-start justify-between gap-3">
											<div className="min-w-0">
												<p className="text-[13.5px] text-ink truncate">
													{s.name ?? s.email}
												</p>
												{s.name ? (
													<p className="text-[12px] text-ink/55 truncate">
														{s.email}
													</p>
												) : null}
											</div>
											<time className="text-[11.5px] text-ink/50 tabular-nums shrink-0">
												{relativeDays(s.createdAt)}
											</time>
										</div>
										{s.tags && s.tags.length > 0 ? (
											<div className="mt-2 flex flex-wrap gap-1">
												{s.tags.map((t) => (
													<span
														key={t}
														className="inline-flex items-center h-5 px-2 rounded-full bg-peach-100 border border-border text-[10.5px] text-ink/75"
													>
														{t}
													</span>
												))}
											</div>
										) : null}
									</li>
								))
							)}
						</ul>
					</div>

					{/* Tags summary */}
					{allTags.length > 0 ? (
						<div className="rounded-3xl border border-border bg-background-elev p-5">
							<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 inline-flex items-center gap-2">
								<Tags className="w-3.5 h-3.5" />
								Active tags
							</p>
							<div className="mt-3 flex flex-wrap gap-1.5">
								{allTags.map((t) => (
									<span
										key={t}
										className={cn(
											"inline-flex items-center h-6 px-2.5 rounded-full border text-[12px]",
											"bg-background border-border-strong text-ink/80",
										)}
									>
										{t}
									</span>
								))}
							</div>
							<p className="mt-3 text-[12px] text-ink/50 leading-normal">
								Segment filtering and manual tagging land next — today tags are
								assigned automatically on signup.
							</p>
						</div>
					) : null}
				</aside>
			</section>
		</div>
	);
}

function SectionTitle({
	eyebrow,
	title,
	href,
	hrefLabel,
}: {
	eyebrow: string;
	title: string;
	href?: string;
	hrefLabel?: string;
}) {
	return (
		<div className="flex items-end justify-between">
			<div>
				<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
					{eyebrow}
				</p>
				<h2 className="mt-1.5 font-display text-[26px] leading-[1.1] tracking-[-0.02em] text-ink">
					{title}
				</h2>
			</div>
			{href && hrefLabel ? (
				<Link
					href={href}
					target={
						href.startsWith("http") || href.startsWith("/u/")
							? "_blank"
							: undefined
					}
					rel="noreferrer"
					className="pencil-link text-[13px] text-ink/70 hover:text-ink inline-flex items-center gap-1"
				>
					{hrefLabel}
					<ArrowUpRight className="w-3.5 h-3.5" />
				</Link>
			) : null}
		</div>
	);
}

function Stat({
	label,
	value,
	accent,
}: {
	label: string;
	value: number;
	accent?: boolean;
}) {
	return (
		<article
			className={cn(
				"rounded-2xl border p-4",
				accent
					? "bg-peach-100 border-peach-300"
					: "bg-background-elev border-border",
			)}
		>
			<p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/55">
				{label}
			</p>
			<p className="mt-2 font-display text-[32px] leading-none tracking-[-0.02em] text-ink">
				{value}
			</p>
		</article>
	);
}

function relativeDays(d: Date) {
	const delta = Date.now() - d.getTime();
	const days = Math.floor(delta / (24 * 60 * 60 * 1000));
	if (days === 0) return "today";
	if (days === 1) return "1d";
	if (days < 7) return `${days}d`;
	if (days < 30) return `${Math.floor(days / 7)}w`;
	if (days < 365) return `${Math.floor(days / 30)}mo`;
	return `${Math.floor(days / 365)}y`;
}
