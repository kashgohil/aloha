import { and, desc, eq, sql } from "drizzle-orm";
import { ImageIcon, Lock, PenSquare, Sparkles, Upload } from "lucide-react";
import Link from "next/link";
import { db } from "@/db";
import { assets } from "@/db/schema";
import { hasMuseInviteEntitlement } from "@/lib/billing/muse";
import { getCurrentUser } from "@/lib/current-user";
import { getCurrentContext } from "@/lib/current-context";
import { FilterTabs } from "@/components/ui/filter-tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CopyPromptButton } from "./_components/copy-prompt";
import { DeleteAssetButton } from "./_components/delete-confirm";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type Tab = "generated" | "uploaded";

type Row = {
  id: string;
  url: string;
  prompt: string | null;
  width: number | null;
  height: number | null;
  metadata: Record<string, unknown>;
  source: "upload" | "generated" | "imported";
  createdAt: Date;
};

const first = (v: string | string[] | undefined) =>
  Array.isArray(v) ? v[0] : v;

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = (await getCurrentUser())!;

  const ctx = (await getCurrentContext())!;

  const { workspace } = ctx;
  const museAccess = await hasMuseInviteEntitlement(user.id);

  const raw = first((await searchParams).tab);
  const tab: Tab = raw === "uploaded" ? "uploaded" : "generated";
  const sourceFilter = tab === "uploaded" ? "upload" : "generated";

  const [[counts], rows] = await Promise.all([
    db
      .select({
        generated: sql<number>`count(*) filter (where ${assets.source} = 'generated')::int`,
        uploaded: sql<number>`count(*) filter (where ${assets.source} = 'upload')::int`,
      })
      .from(assets)
      .where(eq(assets.workspaceId, workspace.id)),
    db
      .select({
        id: assets.id,
        url: assets.url,
        prompt: assets.prompt,
        width: assets.width,
        height: assets.height,
        metadata: assets.metadata,
        source: assets.source,
        createdAt: assets.createdAt,
      })
      .from(assets)
      .where(
        and(eq(assets.workspaceId, workspace.id), eq(assets.source, sourceFilter)),
      )
      .orderBy(desc(assets.createdAt))
      .limit(120),
  ]);

  return (
    <div className="space-y-10">
      <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
            Library
          </p>
          <h1 className="mt-3 font-display text-[44px] lg:text-[52px] leading-[1.02] tracking-[-0.03em] text-ink font-normal">
            Library<span className="text-primary font-light">.</span>
          </h1>
          <p className="mt-3 text-[14px] text-ink/65 max-w-xl leading-[1.55]">
            Your generated and uploaded images in one place. Reuse any of
            them in a new draft, or copy a prompt to iterate.
          </p>
        </div>
        <div>
          {museAccess ? (
            <Link
              href="?compose=new"
              className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-ink text-background text-[13px] font-medium hover:bg-primary transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              Generate new
            </Link>
          ) : (
            <TooltipProvider delay={150}>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Link
                      href="/app/settings/muse"
                      className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-ink/30 text-background text-[13px] font-medium"
                    >
                      <Lock className="w-4 h-4" />
                      Generate new
                    </Link>
                  }
                />
                <TooltipContent side="bottom" className="max-w-[240px] text-center">
                  Image generation is a Muse feature. Request access to unlock it.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </header>

      <FilterTabs
        activeKey={tab}
        items={[
          {
            key: "generated",
            label: "Generated",
            count: counts.generated,
            href: "/app/library?tab=generated",
          },
          {
            key: "uploaded",
            label: "Uploaded",
            count: counts.uploaded,
            href: "/app/library?tab=uploaded",
          },
        ]}
      />

      {rows.length === 0 ? (
        <EmptyState tab={tab} />
      ) : (
        <ul className="columns-1 sm:columns-2 xl:columns-3 gap-4 [column-fill:_balance]">
          {rows.map((row) => (
            <AssetCard key={row.id} row={row} />
          ))}
        </ul>
      )}
    </div>
  );
}

function EmptyState({ tab }: { tab: Tab }) {
  const isUploaded = tab === "uploaded";
  return (
    <div className="rounded-3xl border border-dashed border-border-strong bg-background-elev px-8 py-14 text-center">
      <span className="inline-grid place-items-center w-12 h-12 rounded-full bg-peach-100 border border-border">
        {isUploaded ? (
          <Upload className="w-5 h-5 text-ink" />
        ) : (
          <ImageIcon className="w-5 h-5 text-ink" />
        )}
      </span>
      <p className="mt-5 font-display text-[22px] leading-[1.15] tracking-[-0.01em] text-ink">
        {isUploaded ? "No uploads yet." : "No generated images yet."}
      </p>
      <p className="mt-2 text-[13.5px] text-ink/60 max-w-md mx-auto leading-[1.55]">
        {isUploaded
          ? "Attach an image from the composer and it'll land here."
          : "Generate an image from the composer and it'll land here — prompt, aspect, and all."}
      </p>
      <div className="mt-6">
        <Link
          href="?compose=new"
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full border border-border-strong text-[12.5px] font-medium text-ink transition-colors"
        >
          <PenSquare className="w-3.5 h-3.5" />
          Open composer
        </Link>
      </div>
    </div>
  );
}

function AssetCard({ row }: { row: Row }) {
  const aspect =
    typeof row.metadata?.aspect === "string"
      ? (row.metadata.aspect as string)
      : row.width && row.height
        ? `${row.width}×${row.height}`
        : null;

  const dateLabel = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(row.createdAt);

  // `break-inside-avoid` + `mb-4` keeps cards whole inside a CSS-columns
  // masonry. Intrinsic `width`/`height` on the img prevent layout shift
  // and let the browser reserve space at the correct aspect ratio.
  return (
    <li className="mb-4 break-inside-avoid rounded-2xl border border-border-strong bg-background-elev p-3 flex flex-col gap-3">
      <a
        href={row.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block rounded-xl overflow-hidden border border-border bg-background"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={row.url}
          alt={row.prompt ?? (row.source === "upload" ? "Uploaded image" : "Generated image")}
          width={row.width ?? undefined}
          height={row.height ?? undefined}
          className="w-full h-auto block"
        />
      </a>

      <div className="flex items-center justify-between gap-2 text-[11px] uppercase tracking-[0.16em] text-ink/50 px-1">
        <span>{aspect ?? "Image"}</span>
        <span>{dateLabel}</span>
      </div>

      {row.prompt ? (
        <p className="text-[13.5px] text-ink/80 leading-[1.55] whitespace-pre-wrap px-1 line-clamp-5">
          {row.prompt}
        </p>
      ) : row.source === "upload" ? null : (
        <p className="text-[13px] text-ink/45 italic px-1">
          No prompt recorded.
        </p>
      )}

      <div className="mt-1 flex items-center gap-1 flex-wrap px-1">
        {row.prompt ? <CopyPromptButton prompt={row.prompt} /> : null}
        <div className="ml-auto">
          <DeleteAssetButton assetId={row.id} />
        </div>
      </div>
    </li>
  );
}
