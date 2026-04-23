import { db } from "@/db";
import { postComments } from "@/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { MessageSquare } from "lucide-react";

type CommentRow = typeof postComments.$inferSelect;

type TreeNode = {
  row: CommentRow;
  children: TreeNode[];
};

function buildTree(rows: CommentRow[]): TreeNode[] {
  // Group by parentRemoteId so each row can look up its children in O(1).
  const byParent = new Map<string, CommentRow[]>();
  const knownIds = new Set<string>();
  for (const r of rows) {
    knownIds.add(r.remoteId);
    const bucket = byParent.get(r.parentRemoteId);
    if (bucket) bucket.push(r);
    else byParent.set(r.parentRemoteId, [r]);
  }

  const build = (row: CommentRow): TreeNode => ({
    row,
    children: (byParent.get(row.remoteId) ?? [])
      .slice()
      .sort(
        (a, b) =>
          a.platformCreatedAt.getTime() - b.platformCreatedAt.getTime(),
      )
      .map(build),
  });

  // Roots = rows whose parent is the post itself (parentRemoteId ===
  // rootRemoteId) PLUS orphans whose parent wasn't fetched. Orphans still
  // render at the root level — we don't drop replies just because a parent
  // is missing from pagination.
  const roots = rows.filter(
    (r) => r.parentRemoteId === r.rootRemoteId || !knownIds.has(r.parentRemoteId),
  );

  return roots
    .slice()
    .sort(
      (a, b) => a.platformCreatedAt.getTime() - b.platformCreatedAt.getTime(),
    )
    .map(build);
}

function formatWhen(date: Date, tz: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: tz,
  }).format(date);
}

function CommentNode({
  node,
  depth,
  tz,
  orphanOf,
}: {
  node: TreeNode;
  depth: number;
  tz: string;
  orphanOf?: string;
}) {
  const { row, children } = node;
  return (
    <li className="space-y-3">
      <div className="flex items-start gap-3">
        {row.authorAvatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={row.authorAvatarUrl}
            alt=""
            className="w-8 h-8 rounded-full object-cover border border-border shrink-0"
          />
        ) : (
          <span className="w-8 h-8 rounded-full bg-peach-100 border border-border shrink-0 grid place-items-center text-[11px] font-medium text-ink/60">
            {(row.authorDisplayName ?? row.authorHandle).slice(0, 2).toUpperCase()}
          </span>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-[12px] text-ink/60">
            <span className="font-medium text-ink">
              {row.authorDisplayName ?? row.authorHandle}
            </span>
            {/* LinkedIn's API won't resolve third-party handles with the
             * scopes we hold, so hide the @handle chip there and just show
             * the generic label. */}
            {row.platform !== "linkedin" && (
              <>
                <span>·</span>
                <span>@{row.authorHandle}</span>
              </>
            )}
            <span>·</span>
            <span>{formatWhen(row.platformCreatedAt, tz)}</span>
          </div>
          {orphanOf && (
            <p className="mt-0.5 text-[11px] text-ink/45">
              replying to {orphanOf}
            </p>
          )}
          <p className="mt-1 text-[14px] text-ink leading-[1.55] whitespace-pre-wrap">
            {row.content}
          </p>
        </div>
      </div>
      {children.length > 0 && (
        <ul
          className="space-y-4 border-l border-border pl-5"
          style={{ marginLeft: depth < 3 ? 16 : 0 }}
        >
          {children.map((child) => (
            <CommentNode
              key={child.row.id}
              node={child}
              depth={depth + 1}
              tz={tz}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export async function PostReplies({
  userId,
  workspaceId,
  platform,
  rootRemoteId,
  tz,
}: {
  userId: string;
  workspaceId: string;
  platform: string;
  rootRemoteId: string | null;
  tz: string;
}) {
  if (!rootRemoteId) {
    return (
      <div className="rounded-2xl border border-dashed border-border-strong bg-background-elev p-6 text-center">
        <MessageSquare className="w-5 h-5 text-ink/40 mx-auto" />
        <p className="mt-3 text-[13px] text-ink/55">
          This delivery hasn&apos;t published yet — replies will appear here once
          it&apos;s live.
        </p>
      </div>
    );
  }

  const rows = await db
    .select()
    .from(postComments)
    .where(
      and(
        eq(postComments.workspaceId, workspaceId),
        eq(postComments.platform, platform),
        eq(postComments.rootRemoteId, rootRemoteId),
      ),
    )
    .orderBy(asc(postComments.platformCreatedAt))
    .limit(500);

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border-strong bg-background-elev p-6 text-center">
        <MessageSquare className="w-5 h-5 text-ink/40 mx-auto" />
        <p className="mt-3 text-[13px] text-ink/55">
          No replies yet. Refresh the inbox to pull the latest.
        </p>
      </div>
    );
  }

  const tree = buildTree(rows);
  const knownIds = new Set(rows.map((r) => r.remoteId));

  return (
    <div className="rounded-2xl border border-border bg-background-elev p-6">
      <div className="flex items-center justify-between mb-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/55">
          Replies · {rows.length}
        </p>
      </div>
      <ul className="space-y-5">
        {tree.map((node) => {
          const isOrphan =
            node.row.parentRemoteId !== node.row.rootRemoteId &&
            !knownIds.has(node.row.parentRemoteId);
          return (
            <CommentNode
              key={node.row.id}
              node={node}
              depth={0}
              tz={tz}
              orphanOf={isOrphan ? "earlier in the thread" : undefined}
            />
          );
        })}
      </ul>
    </div>
  );
}
