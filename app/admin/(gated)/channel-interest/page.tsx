import { db } from "@/db";
import { channelNotifications, users } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import {
  AdminPageHeader,
  DataCard,
  SectionHeader,
} from "../../_components/page-header";

export default async function AdminChannelInterestPage() {
  // Per-channel counts — who's asking for what, ranked by demand.
  const perChannel = await db
    .select({
      channel: channelNotifications.channel,
      count: sql<number>`count(*)::int`,
      latest: sql<Date>`max(${channelNotifications.createdAt})`,
    })
    .from(channelNotifications)
    .groupBy(channelNotifications.channel)
    .orderBy(desc(sql`count(*)`));

  const rows = await db
    .select({
      id: channelNotifications.id,
      channel: channelNotifications.channel,
      createdAt: channelNotifications.createdAt,
      email: users.email,
      userId: users.id,
    })
    .from(channelNotifications)
    .innerJoin(users, eq(channelNotifications.userId, users.id))
    .orderBy(desc(channelNotifications.createdAt))
    .limit(200);

  const totalSignals = perChannel.reduce((s, r) => s + r.count, 0);
  const maxCount = Math.max(1, ...perChannel.map((r) => r.count));

  return (
    <div className="space-y-14">
      <AdminPageHeader
        eyebrow="Demand"
        title="Channel interest"
        subtitle={`Every time a user clicked “Notify me” on a channel they can't connect yet. ${totalSignals.toLocaleString()} signal${totalSignals === 1 ? "" : "s"} in total.`}
      />

      <section>
        <SectionHeader eyebrow="Ranked" title="What people want next" />
        <DataCard>
          <ul className="divide-y divide-border">
            {perChannel.map((r) => {
              const share = Math.round((r.count / maxCount) * 100);
              return (
                <li key={r.channel} className="px-6 py-4">
                  <div className="flex items-center justify-between gap-4 text-[13.5px]">
                    <span className="text-ink font-medium capitalize">
                      {r.channel}
                    </span>
                    <span className="text-ink/60 tabular-nums">
                      {r.count.toLocaleString()} signal
                      {r.count === 1 ? "" : "s"} · last{" "}
                      {new Date(r.latest).toISOString().slice(0, 10)}
                    </span>
                  </div>
                  <div className="mt-2 h-1 rounded-full bg-muted/60 overflow-hidden">
                    <div
                      className="h-full bg-ink/70 rounded-full transition-all"
                      style={{ width: `${share}%` }}
                    />
                  </div>
                </li>
              );
            })}
            {perChannel.length === 0 && (
              <li className="px-6 py-10 text-center text-ink/55 text-[13px]">
                No channel interest yet.
              </li>
            )}
          </ul>
        </DataCard>
      </section>

      <section>
        <SectionHeader eyebrow="Feed" title="Recent signals" />
        <DataCard>
          <table className="w-full text-sm">
            <thead className="text-[11px] uppercase tracking-[0.14em] text-ink/55 border-b border-border">
              <tr>
                <Th>When</Th>
                <Th>Email</Th>
                <Th>Channel</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-border last:border-b-0 hover:bg-muted/40"
                >
                  <Td className="text-ink/65 whitespace-nowrap tabular-nums">
                    {r.createdAt.toISOString().replace("T", " ").slice(0, 19)}
                  </Td>
                  <Td>
                    <span className="text-ink font-medium">{r.email}</span>
                  </Td>
                  <Td>
                    <span className="inline-flex items-center h-6 px-2 rounded-full bg-peach-100/70 text-[11px] text-ink capitalize">
                      {r.channel}
                    </span>
                  </Td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={3}
                    className="px-4 py-10 text-center text-ink/55 text-[13px]"
                  >
                    No signals yet.
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
