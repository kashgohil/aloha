import { db } from "@/db";
import { subscriptions, users, workspaces } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import {
  AdminPageHeader,
  DataCard,
  SectionHeader,
  StatCard,
} from "../../_components/page-header";
import {
  ANNUAL_DISCOUNT,
  CREDIT_BOOST_MONTHLY_USD,
  MEMBER_ADDON_MONTHLY_USD,
  WORKSPACE_ADDON_MONTHLY_USD,
  effectivePrice,
} from "@/lib/billing/pricing";
import type { SubscriptionProductKey } from "@/lib/billing/products";

const PRODUCT_LABEL: Record<SubscriptionProductKey, string> = {
  basic: "Basic",
  bundle: "Bundle",
  workspace_addon: "Workspace",
  member_addon: "Member seat",
  credits_boost: "Credit boost",
};

// Monthly-equivalent value of a single subscription row. Annual plans are
// divided by 12 so MRR is apples-to-apples across both intervals and
// across base plans and add-ons.
function monthlyValue(row: {
  productKey: SubscriptionProductKey;
  interval: "month" | "year";
  seats: number;
}) {
  if (row.productKey === "basic" || row.productKey === "bundle") {
    const { effectivePerMonth } = effectivePrice(row.seats, {
      muse: row.productKey === "bundle",
      interval: row.interval,
    });
    return effectivePerMonth;
  }
  // Flat-priced add-ons + credit boost: monthly rate × seats, with the
  // yearly discount amortized back across months when the row is annual.
  const monthlyPerSeat =
    row.productKey === "workspace_addon"
      ? WORKSPACE_ADDON_MONTHLY_USD
      : row.productKey === "member_addon"
        ? MEMBER_ADDON_MONTHLY_USD
        : CREDIT_BOOST_MONTHLY_USD;
  const discount = row.interval === "year" ? 1 - ANNUAL_DISCOUNT : 1;
  return monthlyPerSeat * row.seats * discount;
}

export default async function AdminBillingPage() {
  const [[counts]] = await Promise.all([
    db
      .select({
        active: sql<number>`count(*) filter (where ${subscriptions.status} = 'active')::int`,
        pastDue: sql<number>`count(*) filter (where ${subscriptions.status} = 'past_due')::int`,
        canceled: sql<number>`count(*) filter (where ${subscriptions.status} in ('canceled','revoked'))::int`,
      })
      .from(subscriptions),
  ]);

  // Fetch every subscription once — the dataset is small enough that
  // computing MRR + the 6-month trend in memory is simpler than pushing
  // the pricing math into SQL.
  const all = await db
    .select({
      id: subscriptions.id,
      productKey: subscriptions.productKey,
      status: subscriptions.status,
      interval: subscriptions.interval,
      seats: subscriptions.seats,
      createdAt: subscriptions.createdAt,
    })
    .from(subscriptions);

  const activeRows = all.filter((r) => r.status === "active");
  const totalMrr = activeRows.reduce((sum, r) => sum + monthlyValue(r), 0);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const newThisMonthRows = all.filter((r) => r.createdAt >= monthStart);
  const newThisMonthMrr = newThisMonthRows.reduce(
    (sum, r) => sum + monthlyValue(r),
    0,
  );

  // 6-month trend of new-subscription MRR. Index 0 = earliest month so the
  // sparkline reads left-to-right.
  const trend: Array<{ label: string; value: number }> = [];
  for (let i = 5; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const monthMrr = all
      .filter((r) => r.createdAt >= start && r.createdAt < end)
      .reduce((sum, r) => sum + monthlyValue(r), 0);
    trend.push({
      label: start.toLocaleString("en-US", { month: "short" }),
      value: monthMrr,
    });
  }
  const prevMonthMrr = trend[trend.length - 2]?.value ?? 0;
  const momDelta =
    prevMonthMrr === 0
      ? null
      : ((newThisMonthMrr - prevMonthMrr) / prevMonthMrr) * 100;

  const rows = await db
    .select({
      id: subscriptions.id,
      email: users.email,
      workspaceId: workspaces.id,
      workspaceName: workspaces.name,
      productKey: subscriptions.productKey,
      status: subscriptions.status,
      interval: subscriptions.interval,
      seats: subscriptions.seats,
      currentPeriodEnd: subscriptions.currentPeriodEnd,
    })
    .from(subscriptions)
    .innerJoin(workspaces, eq(subscriptions.workspaceId, workspaces.id))
    .innerJoin(users, eq(workspaces.ownerUserId, users.id))
    .orderBy(desc(subscriptions.createdAt))
    .limit(100);

  return (
    <div className="space-y-14">
      <AdminPageHeader
        eyebrow="Money"
        title="Billing"
        subtitle="Polar subscriptions across Basic and Basic + Muse bundles."
      />

      <section>
        <SectionHeader eyebrow="Revenue" title="Monthly recurring" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            label="Total MRR"
            value={`$${totalMrr.toFixed(2)}`}
            hint={`${activeRows.length.toLocaleString()} active subscription${activeRows.length === 1 ? "" : "s"}`}
          />
          <StatCard
            label="New this month"
            value={`$${newThisMonthMrr.toFixed(2)}`}
            hint={`${newThisMonthRows.length.toLocaleString()} new · ${
              momDelta === null
                ? "no prior month"
                : `${momDelta >= 0 ? "+" : ""}${momDelta.toFixed(0)}% vs last month`
            }`}
          />
          <TrendCard trend={trend} />
        </div>
      </section>

      <section>
        <SectionHeader eyebrow="Subscription health" title="Status breakdown" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Active"
            value={counts.active.toLocaleString()}
            hint="paying right now"
          />
          <StatCard
            label="Past due"
            value={counts.pastDue.toLocaleString()}
            hint="retry needed"
          />
          <StatCard
            label="Canceled"
            value={counts.canceled.toLocaleString()}
            hint="churned or revoked"
          />
        </div>
      </section>

      <section>
        <SectionHeader eyebrow="Ledger" title="Recent subscriptions" />
        <DataCard>
          <table className="w-full text-sm">
            <thead className="text-[11px] uppercase tracking-[0.14em] text-ink/55 border-b border-border">
              <tr>
                <Th>Workspace</Th>
                <Th>Owner</Th>
                <Th>Product</Th>
                <Th>Status</Th>
                <Th>Interval</Th>
                <Th>Seats</Th>
                <Th>MRR</Th>
                <Th>Renews</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-border last:border-b-0 hover:bg-muted/40"
                >
                  <Td>
                    <span className="text-ink font-medium">{r.workspaceName}</span>
                  </Td>
                  <Td className="text-ink/70">{r.email}</Td>
                  <Td>
                    <span className="inline-flex items-center h-6 px-2 rounded-full bg-peach-100/70 text-[11px] text-ink">
                      {PRODUCT_LABEL[r.productKey]}
                    </span>
                  </Td>
                  <Td>
                    <StatusPill status={r.status} />
                  </Td>
                  <Td className="capitalize">{r.interval}</Td>
                  <Td>{r.seats}</Td>
                  <Td className="tabular-nums">
                    ${monthlyValue(r).toFixed(2)}
                  </Td>
                  <Td className="text-ink/65">
                    {r.currentPeriodEnd
                      ? r.currentPeriodEnd.toISOString().slice(0, 10)
                      : "—"}
                  </Td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-10 text-center text-ink/55 text-[13px]"
                  >
                    No subscriptions yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </DataCard>
      </section>
    </div>
  );
}

function TrendCard({
  trend,
}: {
  trend: Array<{ label: string; value: number }>;
}) {
  const max = Math.max(1, ...trend.map((p) => p.value));
  return (
    <article className="rounded-2xl border border-border bg-background-elev p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
        6-month trend
      </p>
      <p className="mt-3 font-display text-[20px] leading-none tracking-[-0.02em] text-ink/80">
        New MRR per month
      </p>
      <div className="mt-5 flex items-end gap-2 h-20">
        {trend.map((p) => {
          const h = Math.round((p.value / max) * 100);
          return (
            <div
              key={p.label}
              className="flex-1 flex flex-col items-center gap-1.5"
            >
              <div className="w-full flex-1 flex items-end">
                <div
                  className="w-full rounded-sm bg-ink/70 transition-all"
                  style={{ height: `${Math.max(2, h)}%` }}
                  title={`$${p.value.toFixed(2)}`}
                />
              </div>
            </div>
          );
        })}
      </div>
      <ul className="mt-2 flex items-center gap-2">
        {trend.map((p) => (
          <li
            key={p.label}
            className="flex-1 text-center text-[10.5px] text-ink/55 uppercase tracking-[0.12em]"
          >
            {p.label}
          </li>
        ))}
      </ul>
    </article>
  );
}

function StatusPill({ status }: { status: string }) {
  const good = status === "active";
  const warn = status === "past_due";
  const cls = good
    ? "bg-peach-100/70 text-ink"
    : warn
      ? "bg-amber-100/60 text-ink"
      : "bg-muted/70 text-ink/70";
  return (
    <span
      className={`inline-flex items-center h-6 px-2 rounded-full text-[11px] capitalize ${cls}`}
    >
      {status.replace("_", " ")}
    </span>
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
