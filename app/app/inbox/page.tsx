import { FilterTabs } from "@/components/ui/filter-tabs";
import { db } from "@/db";
import { accounts, inboxMessages } from "@/db/schema";
import { getCurrentUser } from "@/lib/current-user";
import { getCurrentContext } from "@/lib/current-context";
import { and, desc, eq, sql } from "drizzle-orm";
import { MarkAllReadButton, RefreshButton } from "./_components/inbox-actions";
import { InboxEmpty } from "./_components/inbox-empty";
import { InboxList } from "./_components/inbox-list";
import {
	InboxThreadList,
	type DmThreadSummary,
} from "./_components/inbox-thread-list";
import { InboxThread } from "./_components/inbox-thread";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const FILTERS = ["dms", "mentions"] as const;
type Filter = (typeof FILTERS)[number];

const first = (v: string | string[] | undefined) =>
	Array.isArray(v) ? v[0] : v;

export default async function InboxPage({
	searchParams,
}: {
	searchParams: SearchParams;
}) {
	const user = (await getCurrentUser())!;

	const ctx = (await getCurrentContext())!;

	const { workspace } = ctx;
	const tz = user.timezone ?? "UTC";

	const params = await searchParams;
	const filter: Filter = FILTERS.includes(first(params.filter) as Filter)
		? (first(params.filter) as Filter)
		: "dms";
	const selectedId = first(params.selected) ?? null;

	// Opening a thread/message marks it (and everything in its DM thread)
	// read — same chat-app behavior across both tabs. Mutate before the list
	// query so the rendered rows reflect the new state without a round-trip.
	if (selectedId) {
		const [preview] = await db
			.select({
				reason: inboxMessages.reason,
				threadId: inboxMessages.threadId,
			})
			.from(inboxMessages)
			.where(
				and(
					eq(inboxMessages.id, selectedId),
					eq(inboxMessages.workspaceId, workspace.id),
				),
			)
			.limit(1);

		if (preview?.reason === "dm" && preview.threadId) {
			await db
				.update(inboxMessages)
				.set({ isRead: true, updatedAt: new Date() })
				.where(
					and(
						eq(inboxMessages.workspaceId, workspace.id),
						eq(inboxMessages.threadId, preview.threadId),
						eq(inboxMessages.reason, "dm"),
						eq(inboxMessages.isRead, false),
					),
				);
		} else if (preview?.reason === "mention") {
			await db
				.update(inboxMessages)
				.set({ isRead: true, updatedAt: new Date() })
				.where(
					and(
						eq(inboxMessages.id, selectedId),
						eq(inboxMessages.workspaceId, workspace.id),
					),
				);
		}
	}

	// Tab counts: DMs are counted as distinct threads (matches the
	// chat-app metaphor — one row per conversation), mentions per message.
	const [dmThreadCountRow, mentionCountRow] = await Promise.all([
		db
			.select({
				total: sql<number>`count(distinct (${inboxMessages.platform}, ${inboxMessages.threadId}))`,
			})
			.from(inboxMessages)
			.where(
				and(
					eq(inboxMessages.workspaceId, workspace.id),
					eq(inboxMessages.reason, "dm"),
				),
			),
		db
			.select({ total: sql<number>`count(*)` })
			.from(inboxMessages)
			.where(
				and(
					eq(inboxMessages.workspaceId, workspace.id),
					eq(inboxMessages.reason, "mention"),
				),
			),
	]);
	const counts: Record<Filter, number> = {
		dms: Number(dmThreadCountRow[0]?.total ?? 0),
		mentions: Number(mentionCountRow[0]?.total ?? 0),
	};

	// Right-column thread payload (shared across both tabs — clicking a
	// mention or a DM thread populates this).
	let threadMessages: (typeof inboxMessages.$inferSelect)[] = [];
	let selectedThreadId: string | null = null;
	if (selectedId) {
		const [selected] = await db
			.select()
			.from(inboxMessages)
			.where(
				and(
					eq(inboxMessages.id, selectedId),
					eq(inboxMessages.workspaceId, workspace.id),
				),
			)
			.limit(1);
		if (selected?.threadId) {
			selectedThreadId = selected.threadId;
			threadMessages = await db
				.select()
				.from(inboxMessages)
				.where(
					and(
						eq(inboxMessages.workspaceId, workspace.id),
						eq(inboxMessages.threadId, selected.threadId),
					),
				)
				.orderBy(inboxMessages.platformCreatedAt)
				.limit(200);
		} else if (selected) {
			threadMessages = [selected];
		}
	}

	let dmThreads: DmThreadSummary[] = [];
	let mentionMessages: (typeof inboxMessages.$inferSelect)[] = [];
	let counterparty: {
		handle: string;
		displayName: string | null;
		avatarUrl: string | null;
	} | null = null;

	if (filter === "dms") {
		// We need the workspace's connected provider account IDs to identify
		// "us" vs "them" inside each thread. Build a (platform -> ourAccountId)
		// map so the counterparty pick is O(1) per message.
		const accountRows = await db
			.select({
				provider: accounts.provider,
				providerAccountId: accounts.providerAccountId,
			})
			.from(accounts)
			.where(eq(accounts.workspaceId, workspace.id));
		const ourIdByPlatform = new Map<string, string>();
		for (const row of accountRows) {
			ourIdByPlatform.set(row.provider, row.providerAccountId);
		}

		const dmRows = await db
			.select()
			.from(inboxMessages)
			.where(
				and(
					eq(inboxMessages.workspaceId, workspace.id),
					eq(inboxMessages.reason, "dm"),
				),
			)
			.orderBy(desc(inboxMessages.platformCreatedAt))
			.limit(2000);

		const grouped = new Map<string, typeof dmRows>();
		for (const row of dmRows) {
			if (!row.threadId) continue;
			const key = `${row.platform}:${row.threadId}`;
			const list = grouped.get(key);
			if (list) list.push(row);
			else grouped.set(key, [row]);
		}

		dmThreads = Array.from(grouped.values())
			.map((rows) => {
				// Rows arrive newest-first because of the outer query order.
				const latest = rows[0];
				const ourId = ourIdByPlatform.get(latest.platform) ?? null;
				// Prefer the most recent inbound message for counterparty
				// identity. Falls through to any row whose author isn't us,
				// then to the latest row as a last-ditch fallback (rare:
				// outbound-only thread before counterparty has replied).
				const counterRow =
					rows.find((r) => r.direction === "in") ??
					(ourId ? rows.find((r) => r.authorDid !== ourId) : undefined) ??
					latest;
				const unreadCount = rows.filter((r) => !r.isRead).length;
				return {
					threadId: latest.threadId!,
					platform: latest.platform,
					selectedMessageId: latest.id,
					counterpartyHandle: counterRow.authorHandle,
					counterpartyDisplayName: counterRow.authorDisplayName,
					counterpartyAvatarUrl: counterRow.authorAvatarUrl,
					lastContent: latest.content,
					lastDirection: latest.direction,
					unreadCount,
					lastActivityAt: latest.platformCreatedAt,
				} satisfies DmThreadSummary;
			})
			.sort(
				(a, b) => b.lastActivityAt.getTime() - a.lastActivityAt.getTime(),
			);

		if (selectedThreadId && threadMessages.length > 0) {
			const platform = threadMessages[0]!.platform;
			const ourId = ourIdByPlatform.get(platform) ?? null;
			const counterRow =
				threadMessages.findLast((m) => m.direction === "in") ??
				(ourId
					? threadMessages.findLast((m) => m.authorDid !== ourId)
					: undefined) ??
				threadMessages[threadMessages.length - 1];
			if (counterRow) {
				counterparty = {
					handle: counterRow.authorHandle,
					displayName: counterRow.authorDisplayName,
					avatarUrl: counterRow.authorAvatarUrl,
				};
			}
		}
	} else {
		mentionMessages = await db
			.select()
			.from(inboxMessages)
			.where(
				and(
					eq(inboxMessages.workspaceId, workspace.id),
					eq(inboxMessages.reason, "mention"),
				),
			)
			.orderBy(desc(inboxMessages.platformCreatedAt))
			.limit(200);
	}

	const isEmpty =
		filter === "dms" ? dmThreads.length === 0 : mentionMessages.length === 0;

	return (
		<div className="space-y-10">
			<header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
				<div>
					<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
						Messages
					</p>
					<h1 className="mt-3 font-display text-[44px] lg:text-[56px] leading-[1.02] tracking-[-0.03em] text-ink font-normal">
						Inbox<span className="text-primary font-light">.</span>
					</h1>
					<p className="mt-3 text-[14px] text-ink/65 max-w-xl leading-[1.55]">
						DMs and mentions from your connected channels. Replies on your
						posts live on each post&apos;s page.
					</p>
				</div>
				<div className="flex items-center gap-2">
					<MarkAllReadButton />
					<RefreshButton />
				</div>
			</header>

			<FilterTabs
				activeKey={filter}
				items={FILTERS.map((f) => ({
					key: f,
					label: f === "dms" ? "DMs" : "Mentions",
					href: `/app/inbox?filter=${f}`,
					count: counts[f],
				}))}
			/>

			{isEmpty ? (
				<InboxEmpty />
			) : (
				<div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-0 rounded-2xl border border-border bg-background-elev overflow-hidden min-h-[500px]">
					<div className="overflow-y-auto border-r border-border max-h-[700px]">
						{filter === "dms" ? (
							<InboxThreadList
								threads={dmThreads}
								selectedThreadId={selectedThreadId}
								tz={tz}
							/>
						) : (
							<InboxList
								messages={mentionMessages}
								selectedId={selectedId}
								tz={tz}
							/>
						)}
					</div>

					<div className="hidden lg:flex flex-col">
						{selectedId && threadMessages.length > 0 ? (
							<InboxThread
								messages={threadMessages}
								selectedId={selectedId}
								tz={tz}
								counterparty={counterparty}
							/>
						) : (
							<div className="flex-1 grid place-items-center text-[14px] text-ink/40">
								{filter === "dms"
									? "Select a conversation to start chatting"
									: "Select a mention to view it"}
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
