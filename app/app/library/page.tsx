import { and, desc, eq } from "drizzle-orm";
import { ImageIcon, PenSquare, Sparkles } from "lucide-react";
import Link from "next/link";
import { db } from "@/db";
import { assets } from "@/db/schema";
import { getCurrentUser } from "@/lib/current-user";
import { CopyPromptButton } from "./_components/copy-prompt";
import { DeleteAssetButton } from "./_components/delete-confirm";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  url: string;
  prompt: string | null;
  width: number | null;
  height: number | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
};

export default async function LibraryPage() {
  const user = (await getCurrentUser())!;

  const rows: Row[] = await db
    .select({
      id: assets.id,
      url: assets.url,
      prompt: assets.prompt,
      width: assets.width,
      height: assets.height,
      metadata: assets.metadata,
      createdAt: assets.createdAt,
    })
    .from(assets)
    .where(and(eq(assets.userId, user.id), eq(assets.source, "generated")))
    .orderBy(desc(assets.createdAt))
    .limit(120);

  return (
    <div className="space-y-10">
      <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
            {user.workspaceName ?? "Your workspace"}
          </p>
          <h1 className="mt-3 font-display text-[44px] lg:text-[52px] leading-[1.02] tracking-[-0.03em] text-ink font-normal">
            Library<span className="text-primary font-light">.</span>
          </h1>
          <p className="mt-3 text-[14px] text-ink/65 max-w-xl leading-[1.55]">
            Every image you&apos;ve generated, with the prompt that made it.
            Copy a prompt to iterate, or reuse an image in a new draft.
          </p>
        </div>
        <div>
          <Link
            href="/app/composer"
            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-ink text-background text-[13px] font-medium hover:bg-primary transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            Generate new
          </Link>
        </div>
      </header>

      {rows.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {rows.map((row) => (
            <AssetCard key={row.id} row={row} />
          ))}
        </ul>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-3xl border border-dashed border-border-strong bg-background-elev px-8 py-14 text-center">
      <span className="inline-grid place-items-center w-12 h-12 rounded-full bg-peach-100 border border-border">
        <ImageIcon className="w-5 h-5 text-ink" />
      </span>
      <p className="mt-5 font-display text-[22px] leading-[1.15] tracking-[-0.01em] text-ink">
        No generated images yet.
      </p>
      <p className="mt-2 text-[13.5px] text-ink/60 max-w-md mx-auto leading-[1.55]">
        Generate an image from the composer and it&apos;ll land here — prompt,
        aspect, and all.
      </p>
      <div className="mt-6">
        <Link
          href="/app/composer"
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

  return (
    <li className="rounded-2xl border border-border-strong bg-background-elev p-3 flex flex-col gap-3">
      <a
        href={row.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block rounded-xl overflow-hidden border border-border bg-background"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={row.url}
          alt={row.prompt ?? "Generated image"}
          className="w-full h-auto object-cover max-h-[420px]"
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
      ) : (
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
