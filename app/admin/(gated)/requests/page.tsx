import { db } from "@/db";
import { featureAccess, users } from "@/db/schema";
import {
  and,
  desc,
  eq,
  isNotNull,
  isNull,
  sql,
  type SQL,
} from "drizzle-orm";
import {
  AdminPageHeader,
  DataCard,
} from "../../_components/page-header";
import { FilterTabs } from "@/components/ui/filter-tabs";
import { RequestRowActions } from "../../_components/request-row-actions";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type Status = "pending" | "approved" | "rejected" | "all";

const first = (v: string | string[] | undefined) =>
  Array.isArray(v) ? v[0] : v;

function whereFor(status: Status): SQL | undefined {
  switch (status) {
    case "pending":
      return and(
        isNotNull(featureAccess.requestedAt),
        isNull(featureAccess.grantedAt),
        isNull(featureAccess.revokedAt),
      );
    case "approved":
      return and(
        isNotNull(featureAccess.grantedAt),
        isNull(featureAccess.revokedAt),
      );
    case "rejected":
      return isNotNull(featureAccess.revokedAt);
    case "all":
    default:
      return undefined;
  }
}

export default async function AdminRequestsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const raw = first((await searchParams).status);
  const status: Status =
    raw === "approved" || raw === "rejected" || raw === "all"
      ? raw
      : "pending";

  const [[counts], rows] = await Promise.all([
    db
      .select({
        pending: sql<number>`count(*) filter (
          where ${featureAccess.requestedAt} is not null
          and ${featureAccess.grantedAt} is null
          and ${featureAccess.revokedAt} is null
        )::int`,
        approved: sql<number>`count(*) filter (
          where ${featureAccess.grantedAt} is not null
          and ${featureAccess.revokedAt} is null
        )::int`,
        rejected: sql<number>`count(*) filter (
          where ${featureAccess.revokedAt} is not null
        )::int`,
        all: sql<number>`count(*)::int`,
      })
      .from(featureAccess),
    db
      .select({
        id: featureAccess.id,
        feature: featureAccess.feature,
        requestedAt: featureAccess.requestedAt,
        grantedAt: featureAccess.grantedAt,
        revokedAt: featureAccess.revokedAt,
        email: users.email,
        userId: users.id,
      })
      .from(featureAccess)
      .innerJoin(users, eq(featureAccess.userId, users.id))
      .where(whereFor(status))
      .orderBy(desc(featureAccess.requestedAt))
      .limit(200),
  ]);

  return (
    <div className="space-y-10">
      <AdminPageHeader
        eyebrow="Queue"
        title="Access requests"
        subtitle="Users who clicked “request access” on a gated feature."
      />

      <FilterTabs
        activeKey={status}
        items={[
          {
            key: "pending",
            label: "Pending",
            count: counts.pending,
            href: "/admin/requests?status=pending",
          },
          {
            key: "approved",
            label: "Approved",
            count: counts.approved,
            href: "/admin/requests?status=approved",
          },
          {
            key: "rejected",
            label: "Rejected",
            count: counts.rejected,
            href: "/admin/requests?status=rejected",
          },
          {
            key: "all",
            label: "All",
            count: counts.all,
            href: "/admin/requests?status=all",
          },
        ]}
      />

      <DataCard>
        <table className="w-full text-sm">
          <thead className="text-[11px] uppercase tracking-[0.14em] text-ink/55 border-b border-border">
            <tr>
              <Th>Email</Th>
              <Th>Feature</Th>
              <Th>Status</Th>
              <Th>Requested</Th>
              <Th className="text-right">Action</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const rowStatus = computeStatus(r);
              return (
                <tr
                  key={r.id}
                  className="border-b border-border last:border-b-0 hover:bg-muted/40"
                >
                  <Td>
                    <span className="text-ink font-medium">{r.email}</span>
                  </Td>
                  <Td>
                    <span className="inline-flex items-center h-6 px-2 rounded-full bg-peach-100/70 text-[11px] text-ink">
                      {r.feature}
                    </span>
                  </Td>
                  <Td>
                    <StatusPill status={rowStatus} />
                  </Td>
                  <Td className="text-ink/65">
                    {r.requestedAt?.toISOString().slice(0, 10) ?? "—"}
                  </Td>
                  <Td className="text-right">
                    {rowStatus === "pending" ? (
                      <RequestRowActions id={r.id} />
                    ) : (
                      <span className="text-ink/45 text-[12px]">—</span>
                    )}
                  </Td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-10 text-center text-ink/55 text-[13px]"
                >
                  {status === "pending"
                    ? "No pending requests."
                    : status === "approved"
                      ? "No approved requests yet."
                      : status === "rejected"
                        ? "No rejected requests yet."
                        : "No requests yet."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </DataCard>
    </div>
  );
}

type RowStatus = "pending" | "approved" | "rejected";

function computeStatus(r: {
  grantedAt: Date | null;
  revokedAt: Date | null;
}): RowStatus {
  if (r.revokedAt) return "rejected";
  if (r.grantedAt) return "approved";
  return "pending";
}

function StatusPill({ status }: { status: RowStatus }) {
  const cls =
    status === "approved"
      ? "bg-peach-100/70 text-ink"
      : status === "rejected"
        ? "bg-muted/70 text-ink/65"
        : "bg-amber-100/60 text-ink";
  return (
    <span
      className={`inline-flex items-center h-6 px-2 rounded-full text-[11px] capitalize ${cls}`}
    >
      {status}
    </span>
  );
}

function Th({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th className={`text-left px-4 py-3 font-medium ${className}`}>
      {children}
    </th>
  );
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
