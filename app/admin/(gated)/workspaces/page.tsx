import { db } from "@/db";
import {
  subscriptions,
  users,
  workspaceMembers,
  workspaces,
} from "@/db/schema";
import { and, asc, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { Search } from "lucide-react";
import {
  AdminPageHeader,
  DataCard,
  SectionHeader,
  StatCard,
} from "../../_components/page-header";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const first = (v: string | string[] | undefined) =>
  Array.isArray(v) ? v[0] : v;

type MemberChip = {
  userId: string;
  email: string;
  name: string | null;
  role: string;
};

export default async function AdminWorkspacesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const q = first((await searchParams).q)?.trim() ?? "";

  // Summary counts for the stat strip — computed across all workspaces,
  // not just the page window, so numbers don't jitter with search.
  // Join filters to base plans only so a workspace with add-on rows
  // doesn't get counted twice.
  const baseOnly = or(
    eq(subscriptions.productKey, "basic"),
    eq(subscriptions.productKey, "bundle"),
  );
  const [totals] = await db
    .select({
      total: sql<number>`count(*)::int`,
      withSubscription: sql<number>`count(*) filter (where ${subscriptions.status} in ('active','trialing'))::int`,
    })
    .from(workspaces)
    .leftJoin(
      subscriptions,
      and(eq(subscriptions.workspaceId, workspaces.id), baseOnly),
    );

  const [memberTotals] = await db
    .select({
      totalMembers: sql<number>`count(*)::int`,
    })
    .from(workspaceMembers);

  const rows = await db
    .select({
      id: workspaces.id,
      name: workspaces.name,
      timezone: workspaces.timezone,
      createdAt: workspaces.createdAt,
      ownerUserId: workspaces.ownerUserId,
      ownerEmail: users.email,
      subscriptionStatus: subscriptions.status,
      productKey: subscriptions.productKey,
      seats: subscriptions.seats,
    })
    .from(workspaces)
    .innerJoin(users, eq(users.id, workspaces.ownerUserId))
    .leftJoin(
      subscriptions,
      and(eq(subscriptions.workspaceId, workspaces.id), baseOnly),
    )
    .where(q ? ilike(workspaces.name, `%${q}%`) : undefined)
    .orderBy(desc(workspaces.createdAt))
    .limit(100);

  // Member list per workspace, one query for the visible page.
  const memberships = rows.length
    ? await db
        .select({
          workspaceId: workspaceMembers.workspaceId,
          userId: workspaceMembers.userId,
          role: workspaceMembers.role,
          email: users.email,
          name: users.name,
        })
        .from(workspaceMembers)
        .innerJoin(users, eq(users.id, workspaceMembers.userId))
        .where(
          inArray(
            workspaceMembers.workspaceId,
            rows.map((r) => r.id),
          ),
        )
        .orderBy(asc(users.email))
    : [];

  const membersByWorkspace = new Map<string, MemberChip[]>();
  for (const m of memberships) {
    const list = membersByWorkspace.get(m.workspaceId) ?? [];
    list.push({
      userId: m.userId,
      email: m.email,
      name: m.name,
      role: m.role,
    });
    membersByWorkspace.set(m.workspaceId, list);
  }

  return (
    <div className="space-y-10">
      <AdminPageHeader
        eyebrow="Tenants"
        title="Workspaces"
        subtitle="Every workspace, who owns it, who's in it, and what they pay."
      />

      <section>
        <SectionHeader eyebrow="At a glance" title="Summary" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Workspaces"
            value={(totals?.total ?? 0).toLocaleString()}
          />
          <StatCard
            label="With subscription"
            value={(totals?.withSubscription ?? 0).toLocaleString()}
            hint="active or trialing"
          />
          <StatCard
            label="Total memberships"
            value={(memberTotals?.totalMembers ?? 0).toLocaleString()}
            hint="across all workspaces"
          />
        </div>
      </section>

      <form className="flex items-center gap-2 max-w-md">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink/45" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search workspace name"
            className="w-full h-11 pl-9 pr-3 rounded-full border border-border-strong bg-background-elev text-[14px] text-ink placeholder:text-ink/45 outline-none focus:border-ink transition-colors"
          />
        </div>
        <button
          type="submit"
          className="h-11 px-5 rounded-full bg-ink text-background text-[14px] font-medium hover:bg-primary transition-colors"
        >
          Search
        </button>
      </form>

      <DataCard>
        <table className="w-full text-sm">
          <thead className="text-[11px] uppercase tracking-[0.14em] text-ink/55 border-b border-border">
            <tr>
              <Th>Workspace</Th>
              <Th>Owner</Th>
              <Th>Members</Th>
              <Th>Subscription</Th>
              <Th>Timezone</Th>
              <Th>Created</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const members = membersByWorkspace.get(r.id) ?? [];
              return (
                <tr
                  key={r.id}
                  className="border-b border-border last:border-b-0 hover:bg-muted/40 align-top"
                >
                  <Td>
                    <span className="text-ink font-medium">{r.name}</span>
                  </Td>
                  <Td className="text-ink/75">{r.ownerEmail}</Td>
                  <Td>
                    {members.length === 0 ? (
                      <span className="text-ink/45 text-[12px]">—</span>
                    ) : (
                      <div className="flex flex-wrap items-center gap-1.5">
                        {members.map((m) => (
                          <span
                            key={m.userId}
                            title={m.name ?? m.email}
                            className="inline-flex items-center gap-1.5 h-6 px-2 rounded-full bg-muted/60 text-[11px] text-ink/80"
                          >
                            <span>{m.email}</span>
                            <span className="text-ink/45 uppercase tracking-[0.1em] text-[9.5px]">
                              {m.role}
                            </span>
                          </span>
                        ))}
                      </div>
                    )}
                  </Td>
                  <Td>
                    {r.subscriptionStatus ? (
                      <span className="inline-flex flex-col gap-0.5">
                        <span className="inline-flex items-center h-6 px-2 rounded-full bg-peach-100/70 text-[11px] text-ink capitalize w-fit">
                          {r.productKey} · {r.subscriptionStatus.replace("_", " ")}
                        </span>
                        <span className="text-[11px] text-ink/55">
                          {r.seats ?? 0} seat{r.seats === 1 ? "" : "s"}
                        </span>
                      </span>
                    ) : (
                      <span className="text-ink/45 text-[12px]">none</span>
                    )}
                  </Td>
                  <Td className="text-ink/65">{r.timezone ?? "—"}</Td>
                  <Td className="text-ink/65">
                    {r.createdAt.toISOString().slice(0, 10)}
                  </Td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-10 text-center text-ink/55 text-[13px]"
                >
                  No workspaces match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </DataCard>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-left px-4 py-3 font-medium">{children}</th>;
}
function Td({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={`px-4 py-3 text-ink/80 ${className}`}>{children}</td>;
}
