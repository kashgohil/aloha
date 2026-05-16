import { Block, PageHeaderSkeleton } from "@/app/app/_components/skeleton-bits";

// Single fallback for the entire gated admin tree. Most pages share the
// same shape: AdminPageHeader (eyebrow + 44–52px display heading +
// subtitle) followed by a few DataCard blocks. The shell stays painted
// (sidebar + topbar) while this swaps in for the page body.
export default function Loading() {
  return (
    <div className="space-y-10">
      <PageHeaderSkeleton subtitleWidth="w-[32rem]" />
      <div className="space-y-4 animate-pulse">
        <Block className="h-24" />
        <Block className="h-64" />
      </div>
    </div>
  );
}
