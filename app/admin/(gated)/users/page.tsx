import { db } from "@/db";
import { users, workspaceMembers, workspaces } from "@/db/schema";
import { asc, desc, eq, ilike, inArray, or } from "drizzle-orm";
import Link from "next/link";
import { Search } from "lucide-react";
import {
  AdminPageHeader,
  DataCard,
} from "../../_components/page-header";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const first = (v: string | string[] | undefined) =>
  Array.isArray(v) ? v[0] : v;

type WorkspaceBadge = {
  id: string;
  name: string;
  role: string;
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const q = first((await searchParams).q)?.trim() ?? "";
  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      activeWorkspaceId: users.activeWorkspaceId,
      createdAt: users.createdAt,
      onboardedAt: users.onboardedAt,
    })
    .from(users)
    .where(
      q
        ? or(ilike(users.email, `%${q}%`), ilike(users.name, `%${q}%`))
        : undefined,
    )
    .orderBy(desc(users.createdAt))
    .limit(100);

  // Fetch every workspace the listed users belong to, in one round-trip.
  // Renders as multi-workspace chips so admins can see membership spread
  // without a per-row query.
  const memberships = rows.length
    ? await db
        .select({
          userId: workspaceMembers.userId,
          workspaceId: workspaceMembers.workspaceId,
          role: workspaceMembers.role,
          name: workspaces.name,
        })
        .from(workspaceMembers)
        .innerJoin(workspaces, eq(workspaces.id, workspaceMembers.workspaceId))
        .where(
          inArray(
            workspaceMembers.userId,
            rows.map((r) => r.id),
          ),
        )
        .orderBy(asc(workspaces.name))
    : [];

  const byUser = new Map<string, WorkspaceBadge[]>();
  for (const m of memberships) {
    const list = byUser.get(m.userId) ?? [];
    list.push({ id: m.workspaceId, name: m.name, role: m.role });
    byUser.set(m.userId, list);
  }

  return (
    <div className="space-y-10">
      <AdminPageHeader
        eyebrow="Directory"
        title="Users"
        subtitle="Every workspace on Aloha. Search by email or name."
      />

      <form className="flex items-center gap-2 max-w-md">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink/45" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search email or name"
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
              <Th>Email</Th>
              <Th>Name</Th>
              <Th>Workspaces</Th>
              <Th>Type</Th>
              <Th>Onboarded</Th>
              <Th>Joined</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const memberOf = byUser.get(r.id) ?? [];
              return (
                <tr
                  key={r.id}
                  className="border-b border-border last:border-b-0 hover:bg-muted/40"
                >
                  <Td>
                    <span className="text-ink font-medium">{r.email}</span>
                  </Td>
                  <Td>{r.name ?? "—"}</Td>
                  <Td>
                    {memberOf.length === 0 ? (
                      <span className="text-ink/45 text-[12px]">—</span>
                    ) : (
                      <div className="flex flex-wrap items-center gap-1.5">
                        {memberOf.map((w) => {
                          const isActive = w.id === r.activeWorkspaceId;
                          return (
                            <Link
                              key={w.id}
                              href={`/admin/workspaces?q=${encodeURIComponent(w.name)}`}
                              title={`${w.role}${isActive ? " · active" : ""}`}
                              className={`inline-flex items-center gap-1.5 h-6 px-2 rounded-full text-[11px] transition-colors ${
                                isActive
                                  ? "bg-peach-100/70 text-ink"
                                  : "bg-muted/60 text-ink/75 hover:bg-muted"
                              }`}
                            >
                              <span>{w.name}</span>
                              <span className="text-ink/45 uppercase tracking-[0.1em] text-[9.5px]">
                                {w.role}
                              </span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </Td>
                  <Td>{r.role ?? "—"}</Td>
                  <Td>
                    {r.onboardedAt ? (
                      <span className="inline-flex items-center h-6 px-2 rounded-full bg-peach-100/70 text-[11px] text-ink">
                        yes
                      </span>
                    ) : (
                      <span className="text-ink/45 text-[12px]">no</span>
                    )}
                  </Td>
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
                  No users match.
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
